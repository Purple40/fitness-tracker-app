# Onboarding Feature — Implementation Checklist

## Files to Create
- [x] supabase/add_user_profiles.sql — SQL migration (run in Supabase SQL Editor)
- [x] lib/hooks/useUserProfile.ts — profile CRUD hook + BMI helpers + macro calculator
- [x] app/(onboarding)/layout.tsx — clean layout (no bottom nav)
- [x] app/(onboarding)/onboarding/page.tsx — 3-step onboarding form

## Files to Modify
- [x] types/index.ts — added UserProfile + UserProfileFormData interfaces
- [x] middleware.ts — added /onboarding to protected paths
- [x] app/(dashboard)/dashboard/page.tsx — profile check + useRouter + real name display
- [x] app/(dashboard)/settings/page.tsx — Edit Profile section with BMI display + experience selector

## Steps
1. [x] Create branch blackboxai/onboarding
2. [x] SQL migration file (supabase/add_user_profiles.sql)
3. [x] UserProfile type (types/index.ts)
4. [x] useUserProfile hook (lib/hooks/useUserProfile.ts)
5. [x] Onboarding layout (app/(onboarding)/layout.tsx)
6. [x] Onboarding page — 3 steps: Personal Info → Body Measurements → Training & Goals
7. [x] Middleware update — /onboarding added to protectedPaths
8. [x] Dashboard update — useRouter + profile check + real name
9. [x] Settings update — Profile card with BMI + experience (fixed TSX `e`→`exp` parser bug)
10. [ ] Commit + push branch → user runs SQL migration → merge to main → Vercel deploy

## ⚠️ User Action Required Before Testing
Run `supabase/add_user_profiles.sql` in the Supabase SQL Editor:
- Creates `user_profiles` table with RLS
- Enables row-level security (policy: user_id = auth.uid())
