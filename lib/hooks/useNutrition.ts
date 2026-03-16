import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NutritionLog, MacroTarget } from '@/types';
import { getTodayString } from '@/lib/utils';

const DEFAULT_MACRO_TARGETS: Omit<MacroTarget, 'id' | 'user_id' | 'updated_at'> = {
  calories: 2460,
  protein: 140,
  carbs: 340,
  fat: 60,
};

export function useNutrition() {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [todayLog, setTodayLog] = useState<NutritionLog | null>(null);
  const [macroTargets, setMacroTargets] = useState<MacroTarget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchMacroTargets = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('macro_targets')
        .select('*')
        .single();

      if (err && err.code !== 'PGRST116') throw err;
      setMacroTargets(data || null);
    } catch (err: unknown) {
      console.error('Failed to fetch macro targets:', err);
    }
  }, []);

  const fetchLogs = useCallback(async (limit = 30) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('nutrition_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (err) throw err;
      setLogs(data || []);

      const today = getTodayString();
      const todayData = data?.find((l) => l.date === today) || null;
      setTodayLog(todayData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nutrition logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertLog = useCallback(async (data: {
    date: string;
    calories_consumed?: number | null;
    protein_consumed?: number | null;
    carbs_consumed?: number | null;
    fat_consumed?: number | null;
    note?: string | null;
  }) => {
    setError(null);
    try {
      const { data: result, error: err } = await supabase
        .from('nutrition_logs')
        .upsert(data, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (err) throw err;

      setLogs((prev) => {
        const exists = prev.findIndex((l) => l.date === data.date);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = result;
          return updated;
        }
        return [result, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });

      if (data.date === getTodayString()) {
        setTodayLog(result);
      }

      return { data: result, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save nutrition log';
      setError(message);
      return { data: null, error: message };
    }
  }, []);

  const updateMacroTargets = useCallback(async (targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    try {
      const { data, error: err } = await supabase
        .from('macro_targets')
        .upsert(targets, { onConflict: 'user_id' })
        .select()
        .single();

      if (err) throw err;
      setMacroTargets(data);
      return { data, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update macro targets';
      return { data: null, error: message };
    }
  }, []);

  const getEffectiveTargets = () => {
    if (macroTargets) return macroTargets;
    return {
      ...DEFAULT_MACRO_TARGETS,
      id: '',
      user_id: '',
      updated_at: new Date().toISOString(),
    } as MacroTarget;
  };

  useEffect(() => {
    fetchLogs();
    fetchMacroTargets();
  }, [fetchLogs, fetchMacroTargets]);

  return {
    logs,
    todayLog,
    macroTargets: getEffectiveTargets(),
    isLoading,
    error,
    fetchLogs,
    fetchMacroTargets,
    upsertLog,
    updateMacroTargets,
  };
}
