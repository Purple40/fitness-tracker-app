/**
 * localStorage-based database for demo/offline mode.
 * Used automatically when NEXT_PUBLIC_SUPABASE_URL is not configured.
 * Provides the same return shape as Supabase: { data, error }
 */

import { getTodayString } from '@/lib/utils';

const PREFIX = 'fittrack_demo_';
export const DEMO_USER_ID = 'demo-user-001';

// ─── helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getTable<T>(table: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PREFIX + table);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTable<T>(table: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + table, JSON.stringify(items));
  } catch {
    // storage full — ignore
  }
}

function ok<T>(data: T): { data: T; error: null } {
  return { data, error: null };
}

function fail(msg: string): { data: null; error: string } {
  return { data: null, error: msg };
}

// ─── default exercises ───────────────────────────────────────────────────────

const DEFAULT_EXERCISES = [
  { id: 'ex-1',  name: 'Bench Press',          muscle_group: 'Chest',     exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-2',  name: 'Incline Bench Press',   muscle_group: 'Chest',     exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-3',  name: 'Cable Fly',             muscle_group: 'Chest',     exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-4',  name: 'Pull Up',               muscle_group: 'Back',      exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-5',  name: 'Barbell Row',           muscle_group: 'Back',      exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-6',  name: 'Lat Pulldown',          muscle_group: 'Back',      exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-7',  name: 'Seated Cable Row',      muscle_group: 'Back',      exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-8',  name: 'Overhead Press',        muscle_group: 'Shoulders', exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-9',  name: 'Lateral Raise',         muscle_group: 'Shoulders', exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-10', name: 'Face Pull',             muscle_group: 'Shoulders', exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-11', name: 'Barbell Curl',          muscle_group: 'Biceps',    exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-12', name: 'Hammer Curl',           muscle_group: 'Biceps',    exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-13', name: 'Tricep Pushdown',       muscle_group: 'Triceps',   exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-14', name: 'Skull Crusher',         muscle_group: 'Triceps',   exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-15', name: 'Squat',                 muscle_group: 'Legs',      exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-16', name: 'Romanian Deadlift',     muscle_group: 'Legs',      exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-17', name: 'Leg Press',             muscle_group: 'Legs',      exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-18', name: 'Leg Curl',              muscle_group: 'Legs',      exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-19', name: 'Leg Extension',         muscle_group: 'Legs',      exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-20', name: 'Hip Thrust',            muscle_group: 'Glutes',    exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-21', name: 'Deadlift',              muscle_group: 'Back',      exercise_type: 'Compound',   is_default: true, user_id: null },
  { id: 'ex-22', name: 'Plank',                 muscle_group: 'Core',      exercise_type: 'Bodyweight', is_default: true, user_id: null },
  { id: 'ex-23', name: 'Cable Crunch',          muscle_group: 'Core',      exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-24', name: 'Calf Raise',            muscle_group: 'Calves',    exercise_type: 'Isolation',  is_default: true, user_id: null },
  { id: 'ex-25', name: 'Treadmill',             muscle_group: 'Cardio',    exercise_type: 'Cardio',     is_default: true, user_id: null },
];

function ensureExercises() {
  const existing = getTable('exercises');
  if (existing.length === 0) {
    saveTable('exercises', DEFAULT_EXERCISES);
  }
}

// ─── BODY METRICS ────────────────────────────────────────────────────────────

export const localBodyMetrics = {
  getAll() {
    const items = getTable<Record<string, unknown>>('body_metrics');
    return ok(items.sort((a, b) => String(b.date).localeCompare(String(a.date))));
  },

  upsert(data: Record<string, unknown>) {
    const items = getTable<Record<string, unknown>>('body_metrics');
    const date = data.date as string;
    const idx = items.findIndex((i) => i.date === date);
    const now = new Date().toISOString();

    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data, updated_at: now };
      saveTable('body_metrics', items);
      return ok(items[idx]);
    } else {
      const newItem = {
        id: generateId(),
        user_id: DEMO_USER_ID,
        created_at: now,
        ...data,
      };
      items.push(newItem);
      saveTable('body_metrics', items);
      return ok(newItem);
    }
  },

  delete(id: string) {
    const items = getTable<Record<string, unknown>>('body_metrics');
    saveTable('body_metrics', items.filter((i) => i.id !== id));
    return ok(null);
  },
};

// ─── NUTRITION ───────────────────────────────────────────────────────────────

export const localNutrition = {
  getLogs(limit = 30) {
    const items = getTable<Record<string, unknown>>('nutrition_logs');
    const sorted = items
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, limit);
    return ok(sorted);
  },

  getTodayLog() {
    const today = getTodayString();
    const items = getTable<Record<string, unknown>>('nutrition_logs');
    return ok(items.find((i) => i.date === today) || null);
  },

  upsert(data: Record<string, unknown>) {
    const items = getTable<Record<string, unknown>>('nutrition_logs');
    const date = data.date as string;
    const idx = items.findIndex((i) => i.date === date);
    const now = new Date().toISOString();

    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data, updated_at: now };
      saveTable('nutrition_logs', items);
      return ok(items[idx]);
    } else {
      const newItem = {
        id: generateId(),
        user_id: DEMO_USER_ID,
        created_at: now,
        ...data,
      };
      items.push(newItem);
      saveTable('nutrition_logs', items);
      return ok(newItem);
    }
  },

  delete(id: string) {
    const items = getTable<Record<string, unknown>>('nutrition_logs');
    saveTable('nutrition_logs', items.filter((i) => i.id !== id));
    return ok(null);
  },

  getMacroTargets() {
    const items = getTable<Record<string, unknown>>('macro_targets');
    return ok(items[0] || null);
  },

  upsertMacroTargets(data: Record<string, unknown>) {
    const items = getTable<Record<string, unknown>>('macro_targets');
    const now = new Date().toISOString();
    if (items.length > 0) {
      items[0] = { ...items[0], ...data, updated_at: now };
    } else {
      items.push({ id: generateId(), user_id: DEMO_USER_ID, updated_at: now, ...data });
    }
    saveTable('macro_targets', items);
    return ok(items[0]);
  },
};

// ─── WORKOUTS ────────────────────────────────────────────────────────────────

export const localWorkouts = {
  getSessions(limit = 20) {
    ensureExercises();
    const sessions = getTable<Record<string, unknown>>('workout_sessions')
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, limit);

    const workoutExercises = getTable<Record<string, unknown>>('workout_exercises');
    const sets = getTable<Record<string, unknown>>('workout_sets');
    const exercises = getTable<Record<string, unknown>>('exercises');

    const enriched = sessions.map((session) => {
      const sessionExercises = workoutExercises
        .filter((we) => we.session_id === session.id)
        .sort((a, b) => Number(a.order_index) - Number(b.order_index))
        .map((we) => ({
          ...we,
          exercise: exercises.find((e) => e.id === we.exercise_id) || null,
          sets: sets
            .filter((s) => s.workout_exercise_id === we.id)
            .sort((a, b) => Number(a.set_number) - Number(b.set_number)),
        }));
      return { ...session, exercises: sessionExercises };
    });

    return ok(enriched);
  },

  getSessionById(sessionId: string) {
    ensureExercises();
    const sessions = getTable<Record<string, unknown>>('workout_sessions');
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return fail('Session not found');

    const workoutExercises = getTable<Record<string, unknown>>('workout_exercises');
    const sets = getTable<Record<string, unknown>>('workout_sets');
    const exercises = getTable<Record<string, unknown>>('exercises');

    const sessionExercises = workoutExercises
      .filter((we) => we.session_id === sessionId)
      .sort((a, b) => Number(a.order_index) - Number(b.order_index))
      .map((we) => ({
        ...we,
        exercise: exercises.find((e) => e.id === we.exercise_id) || null,
        sets: sets
          .filter((s) => s.workout_exercise_id === we.id)
          .sort((a, b) => Number(a.set_number) - Number(b.set_number)),
      }));

    return ok({ ...session, exercises: sessionExercises });
  },

  createSession(data: Record<string, unknown>) {
    const sessions = getTable<Record<string, unknown>>('workout_sessions');
    const newSession = {
      id: generateId(),
      user_id: DEMO_USER_ID,
      created_at: new Date().toISOString(),
      ...data,
    };
    sessions.push(newSession);
    saveTable('workout_sessions', sessions);
    return ok({ ...newSession, exercises: [] });
  },

  updateSession(sessionId: string, updates: Record<string, unknown>) {
    const sessions = getTable<Record<string, unknown>>('workout_sessions');
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx < 0) return fail('Session not found');
    sessions[idx] = { ...sessions[idx], ...updates };
    saveTable('workout_sessions', sessions);
    return ok(sessions[idx]);
  },

  deleteSession(sessionId: string) {
    // Cascade delete exercises and sets
    const workoutExercises = getTable<Record<string, unknown>>('workout_exercises');
    const exerciseIds = workoutExercises
      .filter((we) => we.session_id === sessionId)
      .map((we) => we.id);

    const sets = getTable<Record<string, unknown>>('workout_sets');
    saveTable('workout_sets', sets.filter((s) => !exerciseIds.includes(s.workout_exercise_id as string)));
    saveTable('workout_exercises', workoutExercises.filter((we) => we.session_id !== sessionId));

    const sessions = getTable<Record<string, unknown>>('workout_sessions');
    saveTable('workout_sessions', sessions.filter((s) => s.id !== sessionId));
    return ok(null);
  },

  getExercises() {
    ensureExercises();
    const exercises = getTable<Record<string, unknown>>('exercises');
    return ok(exercises.sort((a, b) => String(a.name).localeCompare(String(b.name))));
  },

  createExercise(data: Record<string, unknown>) {
    ensureExercises();
    const exercises = getTable<Record<string, unknown>>('exercises');
    const newExercise = {
      id: generateId(),
      user_id: DEMO_USER_ID,
      created_at: new Date().toISOString(),
      is_default: false,
      ...data,
    };
    exercises.push(newExercise);
    saveTable('exercises', exercises);
    return ok(newExercise);
  },

  addExerciseToSession(sessionId: string, exerciseId: string, orderIndex: number) {
    ensureExercises();
    const workoutExercises = getTable<Record<string, unknown>>('workout_exercises');
    const exercises = getTable<Record<string, unknown>>('exercises');
    const newWE = {
      id: generateId(),
      session_id: sessionId,
      exercise_id: exerciseId,
      order_index: orderIndex,
      note: null,
      created_at: new Date().toISOString(),
    };
    workoutExercises.push(newWE);
    saveTable('workout_exercises', workoutExercises);
    const exercise = exercises.find((e) => e.id === exerciseId) || null;
    return ok({ ...newWE, exercise, sets: [] });
  },

  deleteExerciseFromSession(workoutExerciseId: string) {
    const sets = getTable<Record<string, unknown>>('workout_sets');
    saveTable('workout_sets', sets.filter((s) => s.workout_exercise_id !== workoutExerciseId));
    const workoutExercises = getTable<Record<string, unknown>>('workout_exercises');
    saveTable('workout_exercises', workoutExercises.filter((we) => we.id !== workoutExerciseId));
    return ok(null);
  },

  addSet(workoutExerciseId: string, setData: Record<string, unknown>) {
    const sets = getTable<Record<string, unknown>>('workout_sets');
    const newSet = {
      id: generateId(),
      workout_exercise_id: workoutExerciseId,
      is_pr: false,
      created_at: new Date().toISOString(),
      ...setData,
    };
    sets.push(newSet);
    saveTable('workout_sets', sets);
    return ok(newSet);
  },

  updateSet(setId: string, updates: Record<string, unknown>) {
    const sets = getTable<Record<string, unknown>>('workout_sets');
    const idx = sets.findIndex((s) => s.id === setId);
    if (idx < 0) return fail('Set not found');
    sets[idx] = { ...sets[idx], ...updates };
    saveTable('workout_sets', sets);
    return ok(sets[idx]);
  },

  deleteSet(setId: string) {
    const sets = getTable<Record<string, unknown>>('workout_sets');
    saveTable('workout_sets', sets.filter((s) => s.id !== setId));
    return ok(null);
  },

  getWorkoutExercise(workoutExerciseId: string) {
    const workoutExercises = getTable<Record<string, unknown>>('workout_exercises');
    return ok(workoutExercises.find((we) => we.id === workoutExerciseId) || null);
  },

  // Personal Records
  getPR(exerciseId: string, recordType: string) {
    const prs = getTable<Record<string, unknown>>('personal_records');
    return ok(prs.find((p) => p.exercise_id === exerciseId && p.record_type === recordType) || null);
  },

  upsertPR(data: Record<string, unknown>) {
    const prs = getTable<Record<string, unknown>>('personal_records');
    const idx = prs.findIndex(
      (p) => p.exercise_id === data.exercise_id && p.record_type === data.record_type
    );
    if (idx >= 0) {
      prs[idx] = { ...prs[idx], ...data };
    } else {
      prs.push({ id: generateId(), user_id: DEMO_USER_ID, ...data });
    }
    saveTable('personal_records', prs);
    return ok(prs[idx >= 0 ? idx : prs.length - 1]);
  },
};

// ─── RECOVERY ────────────────────────────────────────────────────────────────

export const localRecovery = {
  getLogs(limit = 30) {
    const items = getTable<Record<string, unknown>>('recovery_metrics')
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, limit);
    return ok(items);
  },

  upsert(data: Record<string, unknown>) {
    const items = getTable<Record<string, unknown>>('recovery_metrics');
    const date = data.date as string;
    const idx = items.findIndex((i) => i.date === date);
    const now = new Date().toISOString();

    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data, updated_at: now };
      saveTable('recovery_metrics', items);
      return ok(items[idx]);
    } else {
      const newItem = {
        id: generateId(),
        user_id: DEMO_USER_ID,
        created_at: now,
        ...data,
      };
      items.push(newItem);
      saveTable('recovery_metrics', items);
      return ok(newItem);
    }
  },

  delete(id: string) {
    const items = getTable<Record<string, unknown>>('recovery_metrics');
    saveTable('recovery_metrics', items.filter((i) => i.id !== id));
    return ok(null);
  },
};
