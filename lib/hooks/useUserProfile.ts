'use client';

import { useState, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/index';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch profile ────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured) return null;

    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProfile(data ?? null);
      return data ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Create profile (onboarding) ──────────────────────────────────────────
  const createProfile = useCallback(async (
    profileData: Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { data, error: insertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...profileData,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setProfile(data);
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      setError(msg);
      return { error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Update profile (settings) ────────────────────────────────────────────
  const updateProfile = useCallback(async (
    updates: Partial<Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setProfile(data);
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setError(msg);
      return { error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    createProfile,
    updateProfile,
  };
}

// ── BMI helpers (pure functions, no hook needed) ─────────────────────────────

export function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export function getBMICategoryLabel(category: BMICategory): string {
  const labels: Record<BMICategory, string> = {
    underweight: 'Underweight',
    normal: 'Normal weight',
    overweight: 'Overweight',
    obese: 'Obese',
  };
  return labels[category];
}

export function getBMICategoryColor(category: BMICategory): string {
  const colors: Record<BMICategory, string> = {
    underweight: 'text-blue-400',
    normal: 'text-green-400',
    overweight: 'text-yellow-400',
    obese: 'text-red-400',
  };
  return colors[category];
}

// ── Calorie preset calculator ─────────────────────────────────────────────────

export interface MacroPreset {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function calculateMacroPreset(
  weightKg: number,
  gender: 'male' | 'female' | 'other',
  experience: 'beginner' | 'intermediate' | 'advanced'
): MacroPreset {
  // Activity multiplier based on experience
  const multipliers = {
    male:   { beginner: 30, intermediate: 33, advanced: 36 },
    female: { beginner: 27, intermediate: 30, advanced: 33 },
    other:  { beginner: 28, intermediate: 31, advanced: 34 },
  };

  const multiplier = multipliers[gender][experience];
  const calories = Math.round(weightKg * multiplier);

  // Protein: 2g per kg (male/advanced) → 1.8g (female/beginner)
  const proteinMultiplier = gender === 'male'
    ? (experience === 'advanced' ? 2.2 : experience === 'intermediate' ? 2.0 : 1.8)
    : (experience === 'advanced' ? 2.0 : experience === 'intermediate' ? 1.8 : 1.6);

  const protein = Math.round(weightKg * proteinMultiplier);

  // Fat: 0.8g per kg
  const fat = Math.round(weightKg * 0.8);

  // Carbs: fill remaining calories
  const remainingCalories = calories - (protein * 4) - (fat * 9);
  const carbs = Math.max(0, Math.round(remainingCalories / 4));

  return { calories, protein, carbs, fat };
}
