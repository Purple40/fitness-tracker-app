// ============================================================
// DATABASE TYPES
// ============================================================

export interface UserProfile {
  user_id: string;
  name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  starting_weight_kg: number | null;
  training_experience: 'beginner' | 'intermediate' | 'advanced' | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileFormData {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  height_cm: string;
  starting_weight_kg: string;
  training_experience: 'beginner' | 'intermediate' | 'advanced' | '';
  goal_calories: string;
  goal_protein: string;
  goal_carbs: string;
  goal_fat: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface BodyMetric {
  id: string;
  user_id: string;
  date: string;
  weight_fasted: number | null;
  steps: number | null;
  note: string | null;
  created_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  calories_consumed: number | null;
  protein_consumed: number | null;
  carbs_consumed: number | null;
  fat_consumed: number | null;
  note: string | null;
  created_at: string;
}

export interface MacroTarget {
  id: string;
  user_id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  date: string;
  session_number: number | null;
  duration: number | null; // in minutes
  note: string | null;
  created_at: string;
  exercises?: WorkoutExercise[];
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: MuscleGroup;
  exercise_type: ExerciseType;
  is_default: boolean;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  order_index: number;
  note: string | null;
  exercise?: Exercise;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number | null;
  reps_target: number | null;
  reps_done: number | null;
  rir_target: number | null;
  rir_done: number | null;
  is_pr: boolean;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string;
  front_photo_url: string | null;
  side_photo_url: string | null;
  back_photo_url: string | null;
  note: string | null;
  created_at: string;
}

export interface RecoveryMetric {
  id: string;
  user_id: string;
  date: string;
  energy: number; // 1-5
  fatigue: number; // 1-5
  motivation: number; // 1-5
  sleep_hours: number | null;
  note: string | null;
  created_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  set_id: string;
  record_type: 'max_weight' | 'max_reps' | 'max_volume';
  value: number;
  date: string;
  created_at: string;
  exercise?: Exercise;
}

// ============================================================
// ENUMS / UNION TYPES
// ============================================================

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Glutes'
  | 'Core'
  | 'Calves'
  | 'Full Body'
  | 'Cardio';

export type ExerciseType = 'Compound' | 'Isolation' | 'Cardio' | 'Bodyweight';

export type NavTab = 'dashboard' | 'body' | 'nutrition' | 'workouts' | 'progress';

// ============================================================
// FORM TYPES
// ============================================================

export interface BodyMetricFormData {
  date: string;
  weight_fasted: string;
  steps: string;
  note: string;
}

export interface NutritionFormData {
  date: string;
  calories_consumed: string;
  protein_consumed: string;
  carbs_consumed: string;
  fat_consumed: string;
  note: string;
}

export interface WorkoutSetFormData {
  weight: string;
  reps_done: string;
  rir_done: string;
  reps_target: string;
  rir_target: string;
}

export interface RecoveryFormData {
  date: string;
  energy: number;
  fatigue: number;
  motivation: number;
  sleep_hours: string;
  note: string;
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface WeeklyBodyStats {
  week: string;
  avg_weight: number;
  min_weight: number;
  max_weight: number;
  avg_steps: number;
}

export interface ExerciseProgressData {
  date: string;
  max_weight: number;
  total_volume: number;
  max_reps: number;
}

export interface MuscleVolumeData {
  muscle_group: string;
  total_sets: number;
  week: string;
}

export interface MacroComplianceData {
  date: string;
  calories_pct: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

// ============================================================
// UI TYPES
// ============================================================

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export interface PRNotification {
  exercise_name: string;
  record_type: 'max_weight' | 'max_reps' | 'max_volume';
  value: number;
  previous_value?: number;
}
