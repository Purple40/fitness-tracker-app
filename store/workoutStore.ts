import { create } from 'zustand';
import { WorkoutSession, WorkoutExercise, WorkoutSet, Exercise, PRNotification } from '@/types';

export interface ActiveSet {
  weight: string;
  reps_done: string;
  rir_done: string;
  reps_target: string;
  rir_target: string;
}

interface WorkoutState {
  // Active session
  activeSession: WorkoutSession | null;
  activeExercises: WorkoutExercise[];
  isWorkoutActive: boolean;
  workoutStartTime: Date | null;

  // PR notifications
  prNotifications: PRNotification[];

  // UI state
  selectedExerciseId: string | null;
  activeSetInputs: Record<string, ActiveSet>; // keyed by workout_exercise_id

  // Actions
  startSession: (session: WorkoutSession) => void;
  endSession: () => void;
  addExercise: (exercise: WorkoutExercise) => void;
  removeExercise: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string, set: WorkoutSet) => void;
  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  setSelectedExercise: (exerciseId: string | null) => void;
  updateSetInput: (workoutExerciseId: string, field: keyof ActiveSet, value: string) => void;
  resetSetInput: (workoutExerciseId: string) => void;
  addPRNotification: (pr: PRNotification) => void;
  dismissPRNotification: (index: number) => void;
  clearPRNotifications: () => void;
  updateSessionDuration: () => void;
}

const defaultSetInput: ActiveSet = {
  weight: '',
  reps_done: '',
  rir_done: '',
  reps_target: '',
  rir_target: '',
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeSession: null,
  activeExercises: [],
  isWorkoutActive: false,
  workoutStartTime: null,
  prNotifications: [],
  selectedExerciseId: null,
  activeSetInputs: {},

  startSession: (session) =>
    set({
      activeSession: session,
      activeExercises: [],
      isWorkoutActive: true,
      workoutStartTime: new Date(),
      prNotifications: [],
    }),

  endSession: () =>
    set({
      activeSession: null,
      activeExercises: [],
      isWorkoutActive: false,
      workoutStartTime: null,
      selectedExerciseId: null,
      activeSetInputs: {},
    }),

  addExercise: (exercise) =>
    set((state) => ({
      activeExercises: [...state.activeExercises, { ...exercise, sets: [] }],
      activeSetInputs: {
        ...state.activeSetInputs,
        [exercise.id]: { ...defaultSetInput },
      },
    })),

  removeExercise: (workoutExerciseId) =>
    set((state) => {
      const newInputs = { ...state.activeSetInputs };
      delete newInputs[workoutExerciseId];
      return {
        activeExercises: state.activeExercises.filter((e) => e.id !== workoutExerciseId),
        activeSetInputs: newInputs,
      };
    }),

  addSet: (workoutExerciseId, newSet) =>
    set((state) => ({
      activeExercises: state.activeExercises.map((ex) =>
        ex.id === workoutExerciseId
          ? { ...ex, sets: [...(ex.sets || []), newSet] }
          : ex
      ),
    })),

  updateSet: (workoutExerciseId, setId, updates) =>
    set((state) => ({
      activeExercises: state.activeExercises.map((ex) =>
        ex.id === workoutExerciseId
          ? {
              ...ex,
              sets: (ex.sets || []).map((s) =>
                s.id === setId ? { ...s, ...updates } : s
              ),
            }
          : ex
      ),
    })),

  removeSet: (workoutExerciseId, setId) =>
    set((state) => ({
      activeExercises: state.activeExercises.map((ex) =>
        ex.id === workoutExerciseId
          ? { ...ex, sets: (ex.sets || []).filter((s) => s.id !== setId) }
          : ex
      ),
    })),

  setSelectedExercise: (exerciseId) => set({ selectedExerciseId: exerciseId }),

  updateSetInput: (workoutExerciseId, field, value) =>
    set((state) => ({
      activeSetInputs: {
        ...state.activeSetInputs,
        [workoutExerciseId]: {
          ...(state.activeSetInputs[workoutExerciseId] || defaultSetInput),
          [field]: value,
        },
      },
    })),

  resetSetInput: (workoutExerciseId) =>
    set((state) => ({
      activeSetInputs: {
        ...state.activeSetInputs,
        [workoutExerciseId]: { ...defaultSetInput },
      },
    })),

  addPRNotification: (pr) =>
    set((state) => ({
      prNotifications: [...state.prNotifications, pr],
    })),

  dismissPRNotification: (index) =>
    set((state) => ({
      prNotifications: state.prNotifications.filter((_, i) => i !== index),
    })),

  clearPRNotifications: () => set({ prNotifications: [] }),

  updateSessionDuration: () => {
    const { workoutStartTime, activeSession } = get();
    if (!workoutStartTime || !activeSession) return;
    const durationMinutes = Math.floor(
      (new Date().getTime() - workoutStartTime.getTime()) / 60000
    );
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, duration: durationMinutes }
        : null,
    }));
  },
}));
