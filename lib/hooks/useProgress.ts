import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ExerciseProgressData, MuscleVolumeData, BodyMetric, PersonalRecord } from '@/types';
import { format, startOfWeek } from 'date-fns';

export function useProgress() {
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgressData[]>([]);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolumeData[]>([]);
  const [weightProgress, setWeightProgress] = useState<BodyMetric[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchExerciseProgress = useCallback(async (exerciseId: string, limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
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

      // Group by session date and find max weight per session
      const sessionMap = new Map<string, { max_weight: number; total_volume: number; max_reps: number }>();

      (data || []).forEach((set: any) => {
        const date = set.workout_exercise?.session?.date;
        if (!date || !set.weight) return;

        const existing = sessionMap.get(date) || { max_weight: 0, total_volume: 0, max_reps: 0 };
        const volume = (set.weight || 0) * (set.reps_done || 0);

        sessionMap.set(date, {
          max_weight: Math.max(existing.max_weight, set.weight || 0),
          total_volume: existing.total_volume + volume,
          max_reps: Math.max(existing.max_reps, set.reps_done || 0),
        });
      });

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
  }, []);

  const fetchMuscleVolume = useCallback(async (weeks = 8) => {
    setIsLoading(true);
    setError(null);
    try {
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

      // Group by week and muscle group
      const volumeMap = new Map<string, number>();

      (data || []).forEach((set: any) => {
        const date = set.workout_exercise?.session?.date;
        const muscleGroup = set.workout_exercise?.exercise?.muscle_group;
        if (!date || !muscleGroup) return;

        const weekStart = startOfWeek(new Date(date), { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        const key = `${weekKey}__${muscleGroup}`;

        volumeMap.set(key, (volumeMap.get(key) || 0) + 1);
      });

      const volumeData: MuscleVolumeData[] = [];
      volumeMap.forEach((sets, key) => {
        const [week, muscle_group] = key.split('__');
        volumeData.push({ week, muscle_group, total_sets: sets });
      });

      setMuscleVolume(
        volumeData
          .sort((a, b) => a.week.localeCompare(b.week))
          .slice(-(weeks * 15))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch muscle volume');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWeightProgress = useCallback(async (limit = 90) => {
    try {
      const { data, error: err } = await supabase
        .from('body_metrics')
        .select('*')
        .not('weight_fasted', 'is', null)
        .order('date', { ascending: true })
        .limit(limit);

      if (err) throw err;
      setWeightProgress(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weight progress');
    }
  }, []);

  const fetchPersonalRecords = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('personal_records')
        .select(`*, exercise:exercises(*)`)
        .order('date', { ascending: false });

      if (err) throw err;
      setPersonalRecords(data || []);
      return { data: data || [], error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch PRs';
      return { data: [], error: message };
    }
  }, []);

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
