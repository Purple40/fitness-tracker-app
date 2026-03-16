import { useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { localBodyMetrics } from '@/lib/localDb';
import { BodyMetric, WeeklyBodyStats } from '@/types';
import { getTodayString } from '@/lib/utils';
import { startOfWeek, format } from 'date-fns';

export function useBodyMetrics() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [todayMetric, setTodayMetric] = useState<BodyMetric | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyBodyStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = isSupabaseConfigured ? createClient() : null;

  const fetchMetrics = useCallback(async (limit = 90) => {
    setIsLoading(true);
    setError(null);
    try {
      let data: BodyMetric[];

      if (!supabase) {
        const { data: localData } = localBodyMetrics.getAll();
        data = ((localData || []) as unknown as BodyMetric[]).slice(0, limit);
      } else {
        const { data: remoteData, error: err } = await supabase
          .from('body_metrics')
          .select('*')
          .order('date', { ascending: false })
          .limit(limit);
        if (err) throw err;
        data = remoteData || [];
      }

      setMetrics(data);

      const today = getTodayString();
      setTodayMetric(data.find((m) => m.date === today) || null);

      if (data.length > 0) {
        setWeeklyStats(calculateWeeklyStats(data));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch body metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertMetric = useCallback(async (data: {
    date: string;
    weight_fasted?: number | null;
    steps?: number | null;
    note?: string | null;
  }) => {
    setError(null);
    try {
      let result: BodyMetric;

      if (!supabase) {
        const { data: r, error: e } = localBodyMetrics.upsert(data as Record<string, unknown>);
        if (e) throw new Error(e);
        result = r as unknown as BodyMetric;
      } else {
        const { data: r, error: err } = await supabase
          .from('body_metrics')
          .upsert(data, { onConflict: 'user_id,date' })
          .select()
          .single();
        if (err) throw err;
        result = r;
      }

      setMetrics((prev) => {
        const exists = prev.findIndex((m) => m.date === data.date);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = result;
          return updated;
        }
        return [result, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });

      if (data.date === getTodayString()) {
        setTodayMetric(result);
      }

      return { data: result, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save metric';
      setError(message);
      return { data: null, error: message };
    }
  }, []);

  const deleteMetric = useCallback(async (id: string) => {
    try {
      if (!supabase) {
        localBodyMetrics.delete(id);
      } else {
        const { error: err } = await supabase
          .from('body_metrics')
          .delete()
          .eq('id', id);
        if (err) throw err;
      }

      setMetrics((prev) => prev.filter((m) => m.id !== id));
      if (todayMetric?.id === id) setTodayMetric(null);

      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete metric';
      return { error: message };
    }
  }, [todayMetric]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    todayMetric,
    weeklyStats,
    isLoading,
    error,
    fetchMetrics,
    upsertMetric,
    deleteMetric,
  };
}

function calculateWeeklyStats(metrics: BodyMetric[]): WeeklyBodyStats[] {
  const weekMap = new Map<string, number[]>();

  metrics.forEach((m) => {
    if (!m.weight_fasted) return;
    const date = new Date(m.date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(m.weight_fasted);
  });

  const stats: WeeklyBodyStats[] = [];
  weekMap.forEach((weights, weekKey) => {
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    stats.push({
      week: weekKey,
      avg_weight: Math.round(avg * 10) / 10,
      min_weight: Math.min(...weights),
      max_weight: Math.max(...weights),
      avg_steps: 0,
    });
  });

  return stats.sort((a, b) => a.week.localeCompare(b.week));
}
