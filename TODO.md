# FitTrack - Bug Fixes TODO

## Issues to Fix

- [x] Understand all files and plan fixes
- [ ] Fix 1: Completed workout session view (shows empty active view instead of session data)
- [ ] Fix 2: Login page - demo mode bypass + translations
- [ ] Fix 3: Spanish translations - ExerciseSelector hardcoded strings
- [ ] Fix 4: Spanish translations - CreateExerciseDialog hardcoded strings
- [ ] Fix 5: Update en.json + es.json with missing keys
- [ ] Fix 6: Push to Vercel via git

## Root Causes

### Fix 1 - Session View Bug
- `startSession()` in workoutStore resets `activeExercises: []` and sets `isWorkoutActive: true`
- Completed sessions (duration !== null) should use local state, not the workout store
- Need: read-only view for completed sessions + Edit toggle

### Fix 2 - Login
- Login always tries Supabase even in demo mode
- Need: `isSupabaseConfigured` check → "Continue as Demo" button
- Need: useTranslations for i18n

### Fix 3 & 4 - Translations
- ExerciseSelector: hardcoded "Select Exercise", "Search exercises...", "All", muscle names, etc.
- CreateExerciseDialog: hardcoded "Create Custom Exercise", "Exercise Name", etc.
