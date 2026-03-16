import { useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { localBodyMetrics, localWorkouts } from '@/lib/localDb';
import { ExerciseProgressData, MuscleVolumeData, BodyMetric, PersonalRecord } from '@/types';
import { format, startOfWeek } from 'date-fns';

export function useProgress() {
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgressData[]>([]);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolumeData[]>([]);
  const [weightProgress, setWeightProgress] = useState<BodyMetric[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = isSupabaseConfigured ? createClient() : null;

  // ── Weight Progress ──────────────────────────────────────────────────────
  const fetchWeightProgress = useCallback(async (limit = 90) => {
    try {
      let data: BodyMetric[];

      if (!supabase) {
        const { data: localData } = localBodyMetrics.getAll();
        data = ((localData || []) as unknown as BodyMetric[])
          .filter((m) => m.weight_fasted != null)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-limit);
      } else {
        const { data: remoteData, error: err } = await supabase
          .from('body_metrics')
          .select('*')
          .not('weight_fasted', 'is', null)
          .order('date', { ascending: true })
          .limit(limit);
        if (err) throw err;
        data = remoteData || [];
      }

      setWeightProgress(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weight progress');
    }
  }, []); // eslint-disable-line

  // ── Exercise Progress (per exercise) ────────────────────────────────────
  const fetchExerciseProgress = useCallback(async (exerciseId: string, limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionMap = new Map<string, { max_weight: number; total_volume: number; max_reps: number }>();

      if (!supabase) {
        const { data: sessions } = localWorkouts.getSessions(200);
        (sessions || []).forEach((session: Record<string, unknown>) => {
          const date = session.date as string;
          if (!date) return;
          const exList = (session.exercises as Record<string, unknown>[]) || [];
          exList.forEach((we: Record<string, unknown>) => {
            if (we.exercise_id !== exerciseId) return;
            const sets = (we.sets as Record<string, unknown>[]) || [];
            sets.forEach((set: Record<string, unknown>) => {
              if (!set.weight) return;
              const existing = sessionMap.get(date) || { max_weight: 0, total_volume: 0, max_reps: 0 };
              const weight = Number(set.weight) || 0;
              const reps = Number(set.reps_done) || 0;
              sessionMap.set(date, {
                max_weight: Math.max(existing.max_weight, weight),
                total_volume: existing.total_volume + weight * reps,
                max_reps: Math.max(existing.max_reps, reps),
              });
            });
          });
        });
      } else {
        const { data, error: err } = await supabase
          .from('workout_sets')
          .select(`
            *,
            workout_exercise:workout_exercises(
              *,
              session:workout_sessions(date)
            )
          `)
          .eq('workout_exercise.exercise_id', exerciseId)
          .order('created_at', { ascending: true })
          .limit(limit * 10);
        if (err) throw err;

        (data || []).forEach((set: Record<string, unknown>) => {
          const we = set.workout_exercise as Record<string, unknown> | null;
          const sess = we?.session as Record<string, unknown> | null;
          const date = sess?.date as string | undefined;
          if (!date || !set.weight) return;
          const existing = sessionMap.get(date) || { max_weight: 0, total_volume: 0, max_reps: 0 };
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps_done) || 0;
          sessionMap.set(date, {
            max_weight: Math.max(existing.max_weight, weight),
            total_volume: existing.total_volume + weight * reps,
            max_reps: Math.max(existing.max_reps, reps),
          });
        });
      }

      const progress: ExerciseProgressData[] = [];
      sessionMap.forEach((stats, date) => {
        progress.push({ date, ...stats });
      });
      setExerciseProgress(progress.sort((a, b) => a.date.localeCompare(b.date)).slice(-limit));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exercise progress');
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line

  // ── Muscle Volume ────────────────────────────────────────────────────────
  const fetchMuscleVolume = useCallback(async (weeks = 8) => {
    setIsLoading(true);
    setError(null);
    try {
      const volumeMap = new Map<string, number>();

      if (!supabase) {
        const { data: sessions } = localWorkouts.getSessions(200);
        (sessions || []).forEach((session: Record<string, unknown>) => {
          const date = session.date as string;
          if (!date) return;
          const exList = (session.exercises as Record<string, unknown>[]) || [];
          exList.forEach((we: Record<string, unknown>) => {
            const exercise = we.exercise as Record<string, unknown> | null;
            const muscleGroup = exercise?.muscle_group as string | undefined;
            if (!muscleGroup) return;
            const weekStart = startOfWeek(new Date(date), { weekStartsOn: 1 });
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            const key = `${weekKey}__${muscleGroup}`;
            const sets = (we.sets as unknown[]) || [];
            volumeMap.set(key, (volumeMap.get(key) || 0) + sets.length);
          });
        });
      } else {
        const { data, error: err } = await supabase
          .from('workout_sets')
          .select(`
            *,
            workout_exercise:workout_exercises(
              *,
              exercise:exercises(muscle_group),
              session:workout_sessions(date)
            )
          `)
          .order('created_at', { ascending: true });
        if (err) throw err;

        (data || []).forEach((set: Record<string, unknown>) => {
          const we = set.workout_exercise as Record<string, unknown> | null;
          const exercise = we?.exercise as Record<string, unknown> | null;
          const sess = we?.session as Record<string, unknown> | null;
          const date = sess?.date as string | undefined;
          const muscleGroup = exercise?.muscle_group as string | undefined;
          if (!date || !muscleGroup) return;
          const weekStart = startOfWeek(new Date(date), { weekStartsOn: 1 });
          const weekKey = format(weekStart, 'yyyy-MM-dd');
          const key = `${weekKey}__${muscleGroup}`;
          volumeMap.set(key, (volumeMap.get(key) || 0) + 1);
        });
      }

      const volumeData: MuscleVolumeData[] = [];
      volumeMap.forEach((sets, key) => {
        const [week, muscle_group] = key.split('__');
        volumeData.push({ week, muscle_group, total_sets: sets });
      });
      setMuscleVolume(volumeData.sort((a, b) => a.week.localeCompare(b.week)).slice(-(weeks * 15)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch muscle volume');
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line

  // ── Personal Records ─────────────────────────────────────────────────────
  const fetchPersonalRecords = useCallback(async () => {
    try {
      let data: PersonalRecord[];

      if (!supabase) {
        const { data: localData } = localWorkouts.getAllPRs();
        data = (localData || []) as unknown as PersonalRecord[];
      } else {
        const { data: remoteData, error: err } = await supabase
          .from('personal_records')
          .select(`*, exercise:exercises(*)`)
          .order('date', { ascending: false });
        if (err) throw err;
        data = remoteData || [];
      }

      setPersonalRecords(data);
      return { data, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch PRs';
      return { data: [] as PersonalRecord[], error: message };
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchWeightProgress();
    fetchMuscleVolume();
    fetchPersonalRecords();
  }, [fetchWeightProgress, fetchMuscleVolume, fetchPersonalRecords]);

  return {
    exerciseProgress,
    muscleVolume,
    weightProgress,
    personalRecords,
    isLoading,
    error,
    fetchExerciseProgress,
    fetchMuscleVolume,
    fetchWeightProgress,
    fetchPersonalRecords,
  };
}
