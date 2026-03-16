# FitTrack — Personal Fitness Tracker PWA

A mobile-first Progressive Web App for tracking body metrics, nutrition, and gym workouts. Built with Next.js 14, Supabase, TypeScript, and TailwindCSS.

---

## Features

- **Dashboard** — Daily overview: weight, steps, macros, workout status
- **Body Tracking** — Fasted weight, steps, weekly averages, trend charts
- **Nutrition** — Macro tracking with progress bars, compliance charts
- **Workout Logging** — Fast set/rep/RIR logging, exercise library, PR detection
- **Progress Analytics** — Weight trend, strength progression, muscle volume charts
- **Personal Records** — Auto-detected PRs with notifications
- **PWA** — Installable on iPhone/Android, offline support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | TailwindCSS, shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth) |
| Charts | Recharts |
| State | Zustand |
| PWA | next-pwa |

---

## Project Structure

```
fitness-tracker/
├── app/
│   ├── (auth)/login/          # Login / Sign-up page
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Dashboard shell with BottomNav
│   │   ├── dashboard/         # Main dashboard
│   │   ├── body/              # Body metrics module
│   │   ├── nutrition/         # Nutrition tracking module
│   │   ├── workouts/          # Workout sessions list
│   │   ├── workouts/[id]/     # Active workout session
│   │   ├── progress/          # Analytics & charts
│   │   └── settings/          # App settings
│   ├── auth/callback/         # Supabase auth callback
│   ├── layout.tsx             # Root layout
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── layout/                # Header, BottomNav
│   ├── body/                  # Body tracking components
│   ├── nutrition/             # Nutrition components
│   ├── workouts/              # Workout components
│   └── progress/              # Chart components
├── lib/
│   ├── supabase/              # Supabase client (browser + server)
│   └── hooks/                 # Data hooks (useBodyMetrics, useNutrition, etc.)
├── store/                     # Zustand stores
├── types/                     # TypeScript types
├── supabase/
│   └── schema.sql             # Full database schema + seed data
└── public/
    ├── manifest.json          # PWA manifest
    └── icons/                 # PWA icons
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd fitness-tracker
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. This creates all tables, RLS policies, indexes, and seeds default exercises

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in your Supabase project under:
**Settings → API → Project URL & anon public key**

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Supabase Setup Details

### Authentication

1. In Supabase Dashboard → **Authentication → Providers**
2. Enable **Email** provider
3. Optionally disable "Confirm email" for easier testing:
   **Authentication → Settings → Disable email confirmations**

### Storage (for Progress Photos)

1. Go to **Storage** in Supabase Dashboard
2. Create a bucket named `progress-photos`
3. Set it to **Private**
4. Add this RLS policy:

```sql
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `body_metrics` | Daily weight + steps |
| `nutrition_logs` | Daily macro intake |
| `macro_targets` | User's macro goals |
| `workout_sessions` | Workout session records |
| `exercises` | Exercise library (default + custom) |
| `workout_exercises` | Exercises within a session |
| `workout_sets` | Individual sets (weight/reps/RIR) |
| `personal_records` | Auto-tracked PRs |
| `progress_photos` | Progress photo URLs |
| `recovery_metrics` | Daily energy/fatigue/motivation |

---

## PWA Installation

### Generate Icons

Before deploying, generate PWA icons (see `public/icons/generate-icons.md`):

```bash
# Using a 512x512 source image:
npx pwa-asset-generator source-icon.png public/icons --manifest public/manifest.json
```

### Install on iPhone (Safari)
1. Open the app in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**

### Install on Android (Chrome)
1. Open the app in Chrome
2. Tap the **⋮** menu
3. Tap **Add to Home Screen** or **Install App**

---

## Deployment

### Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Update Supabase Redirect URLs

In Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

---

## Usage Guide

### First Time Setup

1. Open the app and **Sign Up** with your email
2. Go to **Settings** and configure your **macro targets**
3. Start logging!

### Daily Workflow

**Morning:**
- Log fasted weight in **Body** tab
- Log steps at end of day

**Meals:**
- Log macros in **Nutrition** tab

**Gym:**
1. Tap **Start Workout** on Dashboard or Workouts tab
2. Add exercises from the library
3. Log each set: weight → reps → RIR → **Add Set**
4. Tap **Finish Workout** when done

### Workout Logging Tips

- **RIR** = Reps In Reserve (how many reps you had left)
- Sets are logged instantly — no save button needed
- PRs are detected automatically and shown as notifications
- The timer runs while you're in the workout screen

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Only needed for admin operations |
| `NEXT_PUBLIC_APP_URL` | ❌ | Your app's public URL |

---

## Development Notes

### TypeScript Errors Before Install

All "Cannot find module" errors in the editor are **pre-install** issues. They resolve after:

```bash
npm install
```

### Adding New Exercises

Default exercises are seeded via `supabase/schema.sql`. Users can also create custom exercises from the workout screen → **Create Custom Exercise**.

### Extending the App

- **New metrics**: Add columns to `body_metrics` table + update `useBodyMetrics` hook
- **New charts**: Add components in `components/progress/` using Recharts
- **New exercises**: Add `INSERT` statements to `supabase/schema.sql`

---

## License

MIT — Personal use project.
