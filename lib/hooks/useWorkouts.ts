import { useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { localWorkouts } from '@/lib/localDb';
import {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  Exercise,
  PRNotification,
} from '@/types';
import { getTodayString } from '@/lib/utils';
import { useWorkoutStore } from '@/store/workoutStore';

export function useWorkouts() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addPRNotification } = useWorkoutStore();

  // ─── fetch sessions ───────────────────────────────────────────────────────

  const fetchSessions = useCallback(async (limit = 20) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    setIsLoading(true);
    try {
      if (!supabase) {
        const { data } = localWorkouts.getSessions(limit);
        setSessions((data || []) as unknown as WorkoutSession[]);
        return;
      }
      try {
        const { data, error: err } = await supabase
          .from('workout_sessions')
          .select(`
            *,
            workout_exercises (
              *,
              exercise:exercises(*),
              sets:workout_sets(*)
            )
          `)
          .order('date', { ascending: false })
          .limit(limit);
        if (err) throw err;
        setSessions(data || []);
      } catch {
        // Supabase unavailable — fall back to localStorage
        const { data } = localWorkouts.getSessions(limit);
        setSessions((data || []) as unknown as WorkoutSession[]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── fetch exercises ──────────────────────────────────────────────────────

  const fetchExercises = useCallback(async () => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        const { data } = localWorkouts.getExercises();
        setExercises((data || []) as unknown as Exercise[]);
        return;
      }
      try {
        const { data, error: err } = await supabase
          .from('exercises')
          .select('*')
          .order('name');
        if (err) throw err;
        setExercises(data || []);
      } catch {
        // Supabase unavailable — fall back to localStorage
        const { data } = localWorkouts.getExercises();
        setExercises((data || []) as unknown as Exercise[]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
    }
  }, []);

  // ─── fetch session by id ──────────────────────────────────────────────────

  const fetchSessionById = useCallback(async (sessionId: string) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        const { data, error: e } = localWorkouts.getSessionById(sessionId);
        if (e) throw new Error(e);
        return { data: data as unknown as WorkoutSession, error: null };
      }
      try {
        const { data, error: err } = await supabase
          .from('workout_sessions')
          .select(`
            *,
            exercises:workout_exercises (
              *,
              exercise:exercises(*),
              sets:workout_sets(*)
            )
          `)
          .eq('id', sessionId)
          .single();
        if (err) throw err;
        return { data: data as WorkoutSession, error: null };
      } catch {
        // Supabase unavailable — fall back to localStorage
        const { data, error: e } = localWorkouts.getSessionById(sessionId);
        if (e) throw new Error(e);
        return { data: data as unknown as WorkoutSession, error: null };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch session';
      return { data: null, error: message };
    }
  }, []);

  // ─── create session ───────────────────────────────────────────────────────

  const createSession = useCallback(async (sessionData: {
    date: string;
    session_number: number;
    note: string | null;
    duration: number | null;
  }) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        const { data, error: e } = localWorkouts.createSession(sessionData as Record<string, unknown>);
        if (e) throw new Error(e);
        const session = data as unknown as WorkoutSession;
        setSessions((prev) => [session, ...prev]);
        return { data: session, error: null };
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data, error: err } = await supabase
          .from('workout_sessions')
          .insert({ ...sessionData, user_id: user.id })
          .select()
          .single();
        if (err) throw err;
        await fetchSessions();
        return { data: data as WorkoutSession, error: null };
      } catch (e) {
        // If auth error, re-throw; otherwise fall back to localStorage
        if (e instanceof Error && e.message === 'Not authenticated') throw e;
        const { data, error: le } = localWorkouts.createSession(sessionData as Record<string, unknown>);
        if (le) throw new Error(le);
        const session = data as unknown as WorkoutSession;
        setSessions((prev) => [session, ...prev]);
        return { data: session, error: null };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      return { data: null, error: message };
    }
  }, []);

  // ─── update session ───────────────────────────────────────────────────────

  const updateSession = useCallback(async (
    sessionId: string,
    updates: Partial<Pick<WorkoutSession, 'duration' | 'note'>>
  ) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        const { data, error: e } = localWorkouts.updateSession(sessionId, updates as Record<string, unknown>);
        if (e) throw new Error(e);
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, ...(data as unknown as WorkoutSession) } : s))
        );
        return { data, error: null };
      }
      try {
        const { data, error: err } = await supabase
          .from('workout_sessions')
          .update(updates)
          .eq('id', sessionId)
          .select()
          .single();
        if (err) throw err;
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s))
        );
        return { data, error: null };
      } catch {
        // Supabase unavailable — fall back to localStorage
        const { data, error: e } = localWorkouts.updateSession(sessionId, updates as Record<string, unknown>);
        if (e) throw new Error(e);
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, ...(data as unknown as WorkoutSession) } : s))
        );
        return { data, error: null };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update session';
      return { data: null, error: message };
    }
  }, []);

  // ─── delete session ───────────────────────────────────────────────────────

  const deleteSession = useCallback(async (sessionId: string) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        localWorkouts.deleteSession(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        return { error: null };
      }
      try {
        const { error: err } = await supabase
          .from('workout_sessions')
          .delete()
          .eq('id', sessionId);
        if (err) throw err;
      } catch {
        localWorkouts.deleteSession(sessionId);
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      return { error: message };
    }
  }, []);

  // ─── add exercise to session ──────────────────────────────────────────────

  const addExerciseToSession = useCallback(async (
    sessionId: string,
    exerciseId: string,
    orderIndex: number
  ) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        const { data, error: e } = localWorkouts.addExerciseToSession(sessionId, exerciseId, orderIndex);
        if (e) throw new Error(e);
        return { data: data as unknown as WorkoutExercise, error: null };
      }
      try {
        const { data, error: err } = await supabase
          .from('workout_exercises')
          .insert({ session_id: sessionId, exercise_id: exerciseId, order_index: orderIndex })
          .select(`*, exercise:exercises(*)`)
          .single();
        if (err) throw err;
        return { data: { ...data, sets: [] } as WorkoutExercise, error: null };
      } catch {
        // Supabase unavailable — fall back to localStorage
        const { data, error: e } = localWorkouts.addExerciseToSession(sessionId, exerciseId, orderIndex);
        if (e) throw new Error(e);
        return { data: data as unknown as WorkoutExercise, error: null };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add exercise';
      return { data: null, error: message };
    }
  }, []);

  // ─── delete exercise from session ────────────────────────────────────────

  const deleteExerciseFromSession = useCallback(async (workoutExerciseId: string) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        localWorkouts.deleteExerciseFromSession(workoutExerciseId);
        return { error: null };
      }
      try {
        const { error: err } = await supabase
          .from('workout_exercises')
          .delete()
          .eq('id', workoutExerciseId);
        if (err) throw err;
      } catch {
        localWorkouts.deleteExerciseFromSession(workoutExerciseId);
      }
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove exercise';
      return { error: message };
    }
  }, []);

  // ─── log set ──────────────────────────────────────────────────────────────

  const logSet = useCallback(async (
    workoutExerciseId: string,
    exerciseId: string,
    setData: {
      set_number: number;
      weight?: number | null;
      reps_target?: number | null;
      reps_done?: number | null;
      rir_target?: number | null;
      rir_done?: number | null;
    }
  ) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      let newSet: WorkoutSet;

      if (!supabase) {
        const { data, error: e } = localWorkouts.addSet(workoutExerciseId, setData as Record<string, unknown>);
        if (e) throw new Error(e);
        newSet = data as unknown as WorkoutSet;
      } else {
        try {
          const { data, error: err } = await supabase
            .from('workout_sets')
            .insert({ workout_exercise_id: workoutExerciseId, ...setData })
            .select()
            .single();
          if (err) throw err;
          newSet = data;
        } catch {
          // Supabase unavailable — fall back to localStorage
          const { data, error: e } = localWorkouts.addSet(workoutExerciseId, setData as Record<string, unknown>);
          if (e) throw new Error(e);
          newSet = data as unknown as WorkoutSet;
        }
      }

      await checkAndRecordPR(exerciseId, newSet);
      return { data: newSet, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log set';
      return { data: null, error: message };
    }
  }, [exercises]);

  // ─── add set to exercise (alias) ──────────────────────────────────────────

  const addSetToExercise = useCallback(async (
    workoutExerciseId: string,
    setData: {
      set_number: number;
      weight?: number | null;
      reps_target?: number | null;
      reps_done?: number | null;
      rir_target?: number | null;
      rir_done?: number | null;
    }
  ) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      let newSet: WorkoutSet;

      if (!supabase) {
        const { data, error: e } = localWorkouts.addSet(workoutExerciseId, setData as Record<string, unknown>);
        if (e) throw new Error(e);
        newSet = data as unknown as WorkoutSet;
        const { data: weData } = localWorkouts.getWorkoutExercise(workoutExerciseId);
        if (weData?.exercise_id) {
          await checkAndRecordPR(weData.exercise_id as string, newSet);
        }
      } else {
        try {
          const { data, error: err } = await supabase
            .from('workout_sets')
            .insert({ workout_exercise_id: workoutExerciseId, ...setData })
            .select()
            .single();
          if (err) throw err;
          newSet = data;
          const { data: weData } = await supabase
            .from('workout_exercises')
            .select('exercise_id')
            .eq('id', workoutExerciseId)
            .single();
          if (weData?.exercise_id) {
            await checkAndRecordPR(weData.exercise_id, newSet);
          }
        } catch {
          // Supabase unavailable — fall back to localStorage
          const { data, error: e } = localWorkouts.addSet(workoutExerciseId, setData as Record<string, unknown>);
          if (e) throw new Error(e);
          newSet = data as unknown as WorkoutSet;
          const { data: weData } = localWorkouts.getWorkoutExercise(workoutExerciseId);
          if (weData?.exercise_id) {
            await checkAndRecordPR(weData.exercise_id as string, newSet);
          }
        }
      }

      return { data: newSet, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log set';
      return { data: null, error: message };
    }
  }, [exercises]);

  // ─── update set ───────────────────────────────────────────────────────────

  const updateSet = useCallback(async (setId: string, updates: Partial<WorkoutSet>) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        const { data, error: e } = localWorkouts.updateSet(setId, updates as Record<string, unknown>);
        if (e) throw new Error(e);
        return { data, error: null };
      }
      try {
        const { data, error: err } = await supabase
          .from('workout_sets')
          .update(updates)
          .eq('id', setId)
          .select()
          .single();
        if (err) throw err;
        return { data, error: null };
      } catch {
        const { data, error: e } = localWorkouts.updateSet(setId, updates as Record<string, unknown>);
        if (e) throw new Error(e);
        return { data, error: null };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update set';
      return { data: null, error: message };
    }
  }, []);

  // ─── delete set ───────────────────────────────────────────────────────────

  const deleteSet = useCallback(async (setId: string) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        localWorkouts.deleteSet(setId);
        return { error: null };
      }
      try {
        const { error: err } = await supabase
          .from('workout_sets')
          .delete()
          .eq('id', setId);
        if (err) throw err;
      } catch {
        localWorkouts.deleteSet(setId);
      }
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete set';
      return { error: message };
    }
  }, []);

  // ─── finish session ───────────────────────────────────────────────────────

  const finishSession = useCallback(async (sessionId: string, durationMinutes: number) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        localWorkouts.updateSession(sessionId, { duration: durationMinutes });
        await fetchSessions();
        return { error: null };
      }
      try {
        const { error: err } = await supabase
          .from('workout_sessions')
          .update({ duration: durationMinutes })
          .eq('id', sessionId);
        if (err) throw err;
      } catch {
        localWorkouts.updateSession(sessionId, { duration: durationMinutes });
      }
      await fetchSessions();
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to finish session';
      return { error: message };
    }
  }, []);

  // ─── create custom exercise ───────────────────────────────────────────────

  const createCustomExercise = useCallback(async (exercise: {
    name: string;
    muscle_group: string;
    exercise_type: string;
  }) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    try {
      if (!supabase) {
        const { data, error: e } = localWorkouts.createExercise(exercise as Record<string, unknown>);
        if (e) throw new Error(e);
        const newEx = data as unknown as Exercise;
        setExercises((prev) => [...prev, newEx].sort((a, b) => a.name.localeCompare(b.name)));
        return { data: newEx, error: null };
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error: err } = await supabase
        .from('exercises')
        .insert({ ...exercise, user_id: user.id, is_default: false })
        .select()
        .single();
      if (err) throw err;
      setExercises((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return { data, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create exercise';
      return { data: null, error: message };
    }
  }, []);

  // ─── PR detection ─────────────────────────────────────────────────────────

  const checkAndRecordPR = async (exerciseId: string, newSet: WorkoutSet) => {
    const supabase = isSupabaseConfigured ? createClient() : null;
    if (!newSet.weight || !newSet.reps_done) return;

    try {
      if (!supabase) {
        const { data: existingPR } = localWorkouts.getPR(exerciseId, 'max_weight');
        const existingPRRecord = existingPR as Record<string, unknown> | null;
        const existingValue = existingPRRecord ? (existingPRRecord.value as number) : 0;
        if (!existingPRRecord || newSet.weight > existingValue) {
          localWorkouts.upsertPR({
            exercise_id: exerciseId,
            set_id: newSet.id,
            record_type: 'max_weight',
            value: newSet.weight,
            date: getTodayString(),
          });
          const exercise = exercises.find((e) => e.id === exerciseId);
          if (exercise) {
            const notification: PRNotification = {
              exercise_name: exercise.name,
              record_type: 'max_weight',
              value: newSet.weight,
              previous_value: existingPRRecord ? existingValue : undefined,
            };
            addPRNotification(notification);
          }
        }
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingPR } = await supabase
        .from('personal_records')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.id)
        .eq('record_type', 'max_weight')
        .maybeSingle();

      if (!existingPR || newSet.weight > existingPR.value) {
        await supabase.from('personal_records').upsert({
          exercise_id: exerciseId,
          user_id: user.id,
          set_id: newSet.id,
          record_type: 'max_weight',
          value: newSet.weight,
          date: getTodayString(),
        }, { onConflict: 'user_id,exercise_id,record_type' });

        const exercise = exercises.find((e) => e.id === exerciseId);
        if (exercise) {
          const notification: PRNotification = {
            exercise_name: exercise.name,
            record_type: 'max_weight',
            value: newSet.weight,
            previous_value: existingPR?.value,
          };
          addPRNotification(notification);
        }
      }
    } catch (err) {
      console.error('PR check failed:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchExercises();
  }, [fetchSessions, fetchExercises]);

  return {
    sessions,
    exercises,
    isLoading,
    error,
    fetchSessions,
    fetchExercises,
    fetchSessionById,
    createSession,
    updateSession,
    deleteSession,
    addExerciseToSession,
    deleteExerciseFromSession,
    addSetToExercise,
    logSet,
    updateSet,
    deleteSet,
    finishSession,
    createCustomExercise,
  };
}
