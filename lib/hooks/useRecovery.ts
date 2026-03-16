import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RecoveryMetric } from '@/types';
import { getTodayString } from '@/lib/utils';

export function useRecovery() {
  const [metrics, setMetrics] = useState<RecoveryMetric[]>([]);
  const [todayMetric, setTodayMetric] = useState<RecoveryMetric | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMetrics = useCallback(async (limit = 30) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('recovery_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (err) throw err;
      setMetrics(data || []);

      const today = getTodayString();
      const todayData = data?.find((m) => m.date === today) || null;
      setTodayMetric(todayData);
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
      const { data: result, error: err } = await supabase
        .from('recovery_metrics')
        .upsert(data, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (err) throw err;

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
