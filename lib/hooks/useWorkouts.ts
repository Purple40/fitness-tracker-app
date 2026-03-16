import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
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

  const supabase = createClient();
  const { addPRNotification } = useWorkoutStore();

  const fetchSessions = useCallback(async (limit = 20) => {
    setIsLoading(true);
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchExercises = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (err) throw err;
      setExercises(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
    }
  }, []);

  const fetchSessionById = useCallback(async (sessionId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercises:workout_exercises (
            *,
            exercise:exercises(*),
            sets:workout_sets(* )
          )
        `)
        .eq('id', sessionId)
        .single();

      if (err) throw err;
      return { data: data as WorkoutSession, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch session';
      return { data: null, error: message };
    }
  }, []);

  const createSession = useCallback(async (sessionData: {
    date: string;
    session_number: number;
    note: string | null;
    duration: number | null;
  }) => {
    try {
      const { data, error: err } = await supabase
        .from('workout_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (err) throw err;
      await fetchSessions();
      return { data: data as WorkoutSession, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      return { data: null, error: message };
    }
  }, []);

  const updateSession = useCallback(async (
    sessionId: string,
    updates: Partial<Pick<WorkoutSession, 'duration' | 'note'>>
  ) => {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update session';
      return { data: null, error: message };
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error: err } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId);

      if (err) throw err;
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      return { error: message };
    }
  }, []);

  const addExerciseToSession = useCallback(async (
    sessionId: string,
    exerciseId: string,
    orderIndex: number
  ) => {
    try {
      const { data, error: err } = await supabase
        .from('workout_exercises')
        .insert({
          session_id: sessionId,
          exercise_id: exerciseId,
          order_index: orderIndex,
        })
        .select(`*, exercise:exercises(*)`)
        .single();

      if (err) throw err;
      return { data: { ...data, sets: [] } as WorkoutExercise, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add exercise';
      return { data: null, error: message };
    }
  }, []);

  const deleteExerciseFromSession = useCallback(async (workoutExerciseId: string) => {
    try {
      const { error: err } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', workoutExerciseId);

      if (err) throw err;
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove exercise';
      return { error: message };
    }
  }, []);

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
    try {
      const { data, error: err } = await supabase
        .from('workout_sets')
        .insert({
          workout_exercise_id: workoutExerciseId,
          ...setData,
        })
        .select()
        .single();

      if (err) throw err;

      // Get exercise_id for PR check
      const { data: weData } = await supabase
        .from('workout_exercises')
        .select('exercise_id')
        .eq('id', workoutExerciseId)
        .single();

      if (weData?.exercise_id) {
        await checkAndRecordPR(weData.exercise_id, data);
      }

      return { data: data as WorkoutSet, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log set';
      return { data: null, error: message };
    }
  }, []);

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
    try {
      const { data, error: err } = await supabase
        .from('workout_sets')
        .insert({
          workout_exercise_id: workoutExerciseId,
          ...setData,
        })
        .select()
        .single();

      if (err) throw err;
      await checkAndRecordPR(exerciseId, data);
      return { data, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log set';
      return { data: null, error: message };
    }
  }, []);

  const finishSession = useCallback(async (sessionId: string, durationMinutes: number) => {
    try {
      const { error: err } = await supabase
        .from('workout_sessions')
        .update({ duration: durationMinutes })
        .eq('id', sessionId);

      if (err) throw err;
      await fetchSessions();
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to finish session';
      return { error: message };
    }
  }, []);

  const updateSet = useCallback(async (
    setId: string,
    updates: Partial<WorkoutSet>
  ) => {
    try {
      const { data, error: err } = await supabase
        .from('workout_sets')
        .update(updates)
        .eq('id', setId)
        .select()
        .single();

      if (err) throw err;
      return { data, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update set';
      return { data: null, error: message };
    }
  }, []);

  const deleteSet = useCallback(async (setId: string) => {
    try {
      const { error: err } = await supabase
        .from('workout_sets')
        .delete()
        .eq('id', setId);

      if (err) throw err;
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete set';
      return { error: message };
    }
  }, []);

  const createCustomExercise = useCallback(async (exercise: {
    name: string;
    muscle_group: string;
    exercise_type: string;
  }) => {
    try {
      const { data, error: err } = await supabase
        .from('exercises')
        .insert({ ...exercise, is_default: false })
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

  const checkAndRecordPR = async (exerciseId: string, newSet: WorkoutSet) => {
    if (!newSet.weight || !newSet.reps_done) return;

    try {
      // Check max weight PR
      const { data: existingPR } = await supabase
        .from('personal_records')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('record_type', 'max_weight')
        .single();

      const newVolume = newSet.weight * newSet.reps_done;

      if (!existingPR || newSet.weight > existingPR.value) {
        // New weight PR
        await supabase.from('personal_records').upsert({
          exercise_id: exerciseId,
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
