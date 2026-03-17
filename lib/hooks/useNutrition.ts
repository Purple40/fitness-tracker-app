import { useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { localNutrition } from '@/lib/localDb';
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

  // ─── fetch macro targets ──────────────────────────────────────────────────

  const fetchMacroTargets = useCallback(async () => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        const { data } = localNutrition.getMacroTargets();
        setMacroTargets(data as unknown as MacroTarget | null);
        return;
      }
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

  // ─── fetch logs ───────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async (limit = 30) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        const { data } = localNutrition.getLogs(limit);
        const items = (data || []) as unknown as NutritionLog[];
        setLogs(items);
        const today = getTodayString();
        setTodayLog(items.find((l) => l.date === today) || null);
        return;
      }
      const { data, error: err } = await supabase
        .from('nutrition_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);
      if (err) throw err;
      setLogs(data || []);
      const today = getTodayString();
      setTodayLog(data?.find((l) => l.date === today) || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nutrition logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── upsert log ───────────────────────────────────────────────────────────

  const upsertLog = useCallback(async (data: {
    date: string;
    calories_consumed?: number | null;
    protein_consumed?: number | null;
    carbs_consumed?: number | null;
    fat_consumed?: number | null;
    note?: string | null;
  }) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    setError(null);
    try {
      let result: NutritionLog;

      if (!supabase) {
        const { data: r, error: e } = localNutrition.upsert(data as Record<string, unknown>);
        if (e) throw new Error(e);
        result = r as unknown as NutritionLog;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: r, error: err } = await supabase
          .from('nutrition_logs')
          .upsert({ ...data, user_id: user.id }, { onConflict: 'user_id,date' })
          .select()
          .single();
        if (err) throw err;
        result = r;
      }

      setLogs((prev) => {
        const exists = prev.findIndex((l) => l.date === data.date);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = result;
          return updated;
        }
        return [result, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });
      if (data.date === getTodayString()) setTodayLog(result);
      return { data: result, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save nutrition log';
      setError(message);
      return { data: null, error: message };
    }
  }, []);

  // ─── add to today log (accumulate meals) ─────────────────────────────────

  const addToTodayLog = useCallback(async (meal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealName?: string;
  }) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    setError(null);
    const today = getTodayString();
    try {
      let result: NutritionLog;

      if (!supabase) {
        // Get current today's log from localStorage
        const { data: current } = localNutrition.getTodayLog();
        const cur = current as NutritionLog | null;
        const merged = {
          date: today,
          calories_consumed: (cur?.calories_consumed || 0) + meal.calories,
          protein_consumed: (cur?.protein_consumed || 0) + meal.protein,
          carbs_consumed: (cur?.carbs_consumed || 0) + meal.carbs,
          fat_consumed: (cur?.fat_consumed || 0) + meal.fat,
          note: meal.mealName
            ? cur?.note ? `${cur.note} · ${meal.mealName}` : meal.mealName
            : cur?.note || null,
        };
        const { data: r, error: e } = localNutrition.upsert(merged as Record<string, unknown>);
        if (e) throw new Error(e);
        result = r as unknown as NutritionLog;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch current today's log from Supabase
        const { data: current } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('date', today)
          .eq('user_id', user.id)
          .maybeSingle();

        const merged = {
          date: today,
          user_id: user.id,
          calories_consumed: (current?.calories_consumed || 0) + meal.calories,
          protein_consumed: (current?.protein_consumed || 0) + meal.protein,
          carbs_consumed: (current?.carbs_consumed || 0) + meal.carbs,
          fat_consumed: (current?.fat_consumed || 0) + meal.fat,
          note: meal.mealName
            ? current?.note ? `${current.note} · ${meal.mealName}` : meal.mealName
            : current?.note || null,
        };
        const { data: r, error: err } = await supabase
          .from('nutrition_logs')
          .upsert(merged, { onConflict: 'user_id,date' })
          .select()
          .single();
        if (err) throw err;
        result = r;
      }

      setLogs((prev) => {
        const exists = prev.findIndex((l) => l.date === today);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = result;
          return updated;
        }
        return [result, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });
      setTodayLog(result);
      return { data: result, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add meal';
      setError(message);
      return { data: null, error: message };
    }
  }, []);

  // ─── reset today log ──────────────────────────────────────────────────────

  const resetTodayLog = useCallback(async () => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    const today = getTodayString();
    try {
      const resetData = {
        date: today,
        calories_consumed: 0,
        protein_consumed: 0,
        carbs_consumed: 0,
        fat_consumed: 0,
        note: null,
      };

      let result: NutritionLog;

      if (!supabase) {
        const { data: r, error: e } = localNutrition.upsert(resetData as Record<string, unknown>);
        if (e) throw new Error(e);
        result = r as unknown as NutritionLog;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: r, error: err } = await supabase
          .from('nutrition_logs')
          .upsert({ ...resetData, user_id: user.id }, { onConflict: 'user_id,date' })
          .select()
          .single();
        if (err) throw err;
        result = r;
      }

      setLogs((prev) => {
        const exists = prev.findIndex((l) => l.date === today);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = result;
          return updated;
        }
        return [result, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });
      setTodayLog(result);
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset log';
      return { error: message };
    }
  }, []);

  // ─── delete log ───────────────────────────────────────────────────────────

  const deleteLog = useCallback(async (id: string) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        localNutrition.delete(id);
      } else {
        const { error: err } = await supabase
          .from('nutrition_logs')
          .delete()
          .eq('id', id);
        if (err) throw err;
      }
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setTodayLog((prev) => (prev?.id === id ? null : prev));
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete log';
      return { error: message };
    }
  }, []);

  // ─── update macro targets ─────────────────────────────────────────────────

  const updateMacroTargets = useCallback(async (targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      let result: MacroTarget;

      if (!supabase) {
        const { data: r, error: e } = localNutrition.upsertMacroTargets(targets as Record<string, unknown>);
        if (e) throw new Error(e);
        result = r as unknown as MacroTarget;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: r, error: err } = await supabase
          .from('macro_targets')
          .upsert({ ...targets, user_id: user.id }, { onConflict: 'user_id' })
          .select()
          .single();
        if (err) throw err;
        result = r;
      }

      setMacroTargets(result);
      return { data: result, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update macro targets';
      return { data: null, error: message };
    }
  }, []);

  const getEffectiveTargets = (): MacroTarget => {
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
    addToTodayLog,
    resetTodayLog,
    deleteLog,
    updateMacroTargets,
  };
}
