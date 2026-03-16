import { useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { localRecovery } from '@/lib/localDb';
import { RecoveryMetric } from '@/types';
import { getTodayString } from '@/lib/utils';

export function useRecovery() {
  const [metrics, setMetrics] = useState<RecoveryMetric[]>([]);
  const [todayMetric, setTodayMetric] = useState<RecoveryMetric | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = isSupabaseConfigured ? createClient() : null;

  const fetchMetrics = useCallback(async (limit = 30) => {
    setIsLoading(true);
    setError(null);
    try {
      let data: RecoveryMetric[];

      if (!supabase) {
        const { data: localData } = localRecovery.getLogs();
        data = ((localData || []) as unknown as RecoveryMetric[]).slice(0, limit);
      } else {
        try {
          const { data: remoteData, error: err } = await supabase
            .from('recovery_metrics')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
          if (err) throw err;
          data = remoteData || [];
        } catch {
          // Supabase unavailable — fall back to localStorage
          const { data: localData } = localRecovery.getLogs();
          data = ((localData || []) as unknown as RecoveryMetric[]).slice(0, limit);
        }
      }

      setMetrics(data);
      const today = getTodayString();
      setTodayMetric(data.find((m) => m.date === today) || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recovery metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertMetric = useCallback(async (data: {
    date: string;
    energy: number;
    fatigue: number;
    motivation: number;
    sleep_hours?: number | null;
    note?: string | null;
  }) => {
    setError(null);
    try {
      let result: RecoveryMetric;

      if (!supabase) {
        const { data: r, error: e } = localRecovery.upsert(data as Record<string, unknown>);
        if (e) throw new Error(e);
        result = r as unknown as RecoveryMetric;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: r, error: err } = await supabase
          .from('recovery_metrics')
          .upsert({ ...data, user_id: user.id }, { onConflict: 'user_id,date' })
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
      const message = err instanceof Error ? err.message : 'Failed to save recovery metric';
      setError(message);
      return { data: null, error: message };
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    todayMetric,
    isLoading,
    error,
    fetchMetrics,
    upsertMetric,
  };
}
