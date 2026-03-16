
-- ============================================================
-- FITNESS TRACKER - SUPABASE SCHEMA
-- ============================================================
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- MACRO TARGETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS macro_targets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calories INTEGER NOT NULL DEFAULT 2460,
  protein INTEGER NOT NULL DEFAULT 140,
  carbs INTEGER NOT NULL DEFAULT 340,
  fat INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- BODY METRICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight_fasted DECIMAL(5,2),
  steps INTEGER,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- NUTRITION LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  calories_consumed INTEGER,
  protein_consumed DECIMAL(6,1),
  carbs_consumed DECIMAL(6,1),
  fat_consumed DECIMAL(6,1),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- EXERCISES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  muscle_group VARCHAR(50) NOT NULL,
  exercise_type VARCHAR(50) NOT NULL DEFAULT 'Compound',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- WORKOUT SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  session_number INTEGER,
  duration INTEGER, -- in minutes
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- WORKOUT EXERCISES TABLE (junction between session and exercise)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- WORKOUT SETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  weight DECIMAL(6,2),
  reps_target INTEGER,
  reps_done INTEGER,
  rir_target INTEGER,
  rir_done INTEGER,
  is_pr BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PROGRESS PHOTOS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  front_photo_url TEXT,
  side_photo_url TEXT,
  back_photo_url TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- RECOVERY METRICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recovery_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  fatigue INTEGER CHECK (fatigue BETWEEN 1 AND 5),
  motivation INTEGER CHECK (motivation BETWEEN 1 AND 5),
  sleep_hours DECIMAL(4,1),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- PERSONAL RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  set_id UUID REFERENCES workout_sets(id) ON DELETE CASCADE,
  record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('max_weight', 'max_reps', 'max_volume')),
  value DECIMAL(8,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise_id, record_type)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE macro_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Macro Targets policies
CREATE POLICY "Users can view own macro targets" ON macro_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own macro targets" ON macro_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own macro targets" ON macro_targets FOR UPDATE USING (auth.uid() = user_id);

-- Body Metrics policies
CREATE POLICY "Users can view own body metrics" ON body_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body metrics" ON body_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own body metrics" ON body_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own body metrics" ON body_metrics FOR DELETE USING (auth.uid() = user_id);

-- Nutrition Logs policies
CREATE POLICY "Users can view own nutrition logs" ON nutrition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition logs" ON nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition logs" ON nutrition_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nutrition logs" ON nutrition_logs FOR DELETE USING (auth.uid() = user_id);

-- Exercises policies (default exercises visible to all, custom only to owner)
CREATE POLICY "Users can view all exercises" ON exercises FOR SELECT USING (is_default = TRUE OR auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE USING (auth.uid() = user_id AND is_default = FALSE);
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);

-- Workout Sessions policies
CREATE POLICY "Users can view own workout sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout sessions" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Workout Exercises policies
CREATE POLICY "Users can view own workout exercises" ON workout_exercises FOR SELECT
  USING (EXISTS (SELECT 1 FROM workout_sessions WHERE id = workout_exercises.session_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own workout exercises" ON workout_exercises FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM workout_sessions WHERE id = workout_exercises.session_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own workout exercises" ON workout_exercises FOR UPDATE
  USING (EXISTS (SELECT 1 FROM workout_sessions WHERE id = workout_exercises.session_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own workout exercises" ON workout_exercises FOR DELETE
  USING (EXISTS (SELECT 1 FROM workout_sessions WHERE id = workout_exercises.session_id AND user_id = auth.uid()));

-- Workout Sets policies
CREATE POLICY "Users can view own workout sets" ON workout_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_sets.workout_exercise_id AND ws.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own workout sets" ON workout_sets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_sets.workout_exercise_id AND ws.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own workout sets" ON workout_sets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_sets.workout_exercise_id AND ws.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own workout sets" ON workout_sets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_sets.workout_exercise_id AND ws.user_id = auth.uid()
  ));

-- Progress Photos policies
CREATE POLICY "Users can view own progress photos" ON progress_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress photos" ON progress_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress photos" ON progress_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress photos" ON progress_photos FOR DELETE USING (auth.uid() = user_id);

-- Recovery Metrics policies
CREATE POLICY "Users can view own recovery metrics" ON recovery_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recovery metrics" ON recovery_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recovery metrics" ON recovery_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recovery metrics" ON recovery_metrics FOR DELETE USING (auth.uid() = user_id);

-- Personal Records policies
CREATE POLICY "Users can view own personal records" ON personal_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personal records" ON personal_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personal records" ON personal_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own personal records" ON personal_records FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date ON body_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON workout_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_recovery_metrics_user_date ON recovery_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);

-- ============================================================
-- DEFAULT EXERCISES SEED DATA
-- ============================================================
INSERT INTO exercises (name, muscle_group, exercise_type, is_default, user_id) VALUES
  -- Chest
  ('Bench Press', 'Chest', 'Compound', TRUE, NULL),
  ('Incline Bench Press', 'Chest', 'Compound', TRUE, NULL),
  ('Decline Bench Press', 'Chest', 'Compound', TRUE, NULL),
  ('Dumbbell Fly', 'Chest', 'Isolation', TRUE, NULL),
  ('Cable Fly', 'Chest', 'Isolation', TRUE, NULL),
  ('Push Up', 'Chest', 'Bodyweight', TRUE, NULL),
  ('Dips', 'Chest', 'Bodyweight', TRUE, NULL),
  -- Back
  ('Deadlift', 'Back', 'Compound', TRUE, NULL),
  ('Pull Up', 'Back', 'Bodyweight', TRUE, NULL),
  ('Barbell Row', 'Back', 'Compound', TRUE, NULL),
  ('Seated Cable Row', 'Back', 'Compound', TRUE, NULL),
  ('Lat Pulldown', 'Back', 'Compound', TRUE, NULL),
  ('Single Arm Dumbbell Row', 'Back', 'Compound', TRUE, NULL),
  ('Face Pull', 'Back', 'Isolation', TRUE, NULL),
  -- Shoulders
  ('Overhead Press', 'Shoulders', 'Compound', TRUE, NULL),
  ('Dumbbell Shoulder Press', 'Shoulders', 'Compound', TRUE, NULL),
  ('Lateral Raise', 'Shoulders', 'Isolation', TRUE, NULL),
  ('Front Raise', 'Shoulders', 'Isolation', TRUE, NULL),
  ('Rear Delt Fly', 'Shoulders', 'Isolation', TRUE, NULL),
  -- Biceps
  ('Barbell Curl', 'Biceps', 'Isolation', TRUE, NULL),
  ('Dumbbell Curl', 'Biceps', 'Isolation', TRUE, NULL),
  ('Hammer Curl', 'Biceps', 'Isolation', TRUE, NULL),
  ('Preacher Curl', 'Biceps', 'Isolation', TRUE, NULL),
  ('Cable Curl', 'Biceps', 'Isolation', TRUE, NULL),
  -- Triceps
  ('Tricep Pushdown', 'Triceps', 'Isolation', TRUE, NULL),
  ('Skull Crusher', 'Triceps', 'Isolation', TRUE, NULL),
  ('Overhead Tricep Extension', 'Triceps', 'Isolation', TRUE, NULL),
  ('Close Grip Bench Press', 'Triceps', 'Compound', TRUE, NULL),
  -- Legs
  ('Squat', 'Legs', 'Compound', TRUE, NULL),
  ('Front Squat', 'Legs', 'Compound', TRUE, NULL),
  ('Leg Press', 'Legs', 'Compound', TRUE, NULL),
  ('Romanian Deadlift', 'Legs', 'Compound', TRUE, NULL),
  ('Leg Curl', 'Legs', 'Isolation', TRUE, NULL),
  ('Leg Extension', 'Legs', 'Isolation', TRUE, NULL),
  ('Lunges', 'Legs', 'Compound', TRUE, NULL),
  ('Bulgarian Split Squat', 'Legs', 'Compound', TRUE, NULL),
  -- Glutes
  ('Hip Thrust', 'Glutes', 'Compound', TRUE, NULL),
  ('Glute Bridge', 'Glutes', 'Isolation', TRUE, NULL),
  ('Cable Kickback', 'Glutes', 'Isolation', TRUE, NULL),
  -- Core
  ('Plank', 'Core', 'Bodyweight', TRUE, NULL),
  ('Crunch', 'Core', 'Bodyweight', TRUE, NULL),
  ('Ab Wheel Rollout', 'Core', 'Bodyweight', TRUE, NULL),
  ('Cable Crunch', 'Core', 'Isolation', TRUE, NULL),
  -- Calves
  ('Standing Calf Raise', 'Calves', 'Isolation', TRUE, NULL),
  ('Seated Calf Raise', 'Calves', 'Isolation', TRUE, NULL),
  -- Cardio
  ('Running', 'Cardio', 'Cardio', TRUE, NULL),
  ('Cycling', 'Cardio', 'Cardio', TRUE, NULL),
  ('Jump Rope', 'Cardio', 'Cardio', TRUE, NULL)
ON CONFLICT DO NOTHING;
