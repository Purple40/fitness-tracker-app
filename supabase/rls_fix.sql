-- Run this in Supabase SQL Editor
-- Goal: keep RLS enabled and fix 403 Forbidden for nutrition_logs + workout_sessions

-- 1) Ensure RLS is enabled
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- 2) Remove old conflicting policies (safe if they don't exist)
DROP POLICY IF EXISTS "Users can view own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can insert own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can update own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can delete own nutrition logs" ON nutrition_logs;

DROP POLICY IF EXISTS "Users can view own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can insert own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can update own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can delete own workout sessions" ON workout_sessions;

-- 3) Recreate strict owner-based policies
CREATE POLICY "Users can view own nutrition logs"
ON nutrition_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition logs"
ON nutrition_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition logs"
ON nutrition_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition logs"
ON nutrition_logs
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workout sessions"
ON workout_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions"
ON workout_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions"
ON workout_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions"
ON workout_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- 4) Diagnostic checks
-- Verify current authenticated uid and policy behavior in SQL editor context:
-- select auth.uid();
-- select * from nutrition_logs where user_id = auth.uid() limit 5;
-- select * from workout_sessions where user_id = auth.uid() limit 5;
