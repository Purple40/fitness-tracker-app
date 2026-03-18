'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, ChevronRight, ChevronLeft, Check, User, Ruler, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  useUserProfile,
  calculateBMI,
  getBMICategory,
  getBMICategoryLabel,
  getBMICategoryColor,
  calculateMacroPreset,
} from '@/lib/hooks/useUserProfile';
import { useNutrition } from '@/lib/hooks/useNutrition';
import { toast } from '@/lib/hooks/useToast';

// ── Types ────────────────────────────────────────────────────────────────────

type Gender = 'male' | 'female' | 'other';
type Experience = 'beginner' | 'intermediate' | 'advanced';

interface FormState {
  // Step 1
  name: string;
  age: string;
  gender: Gender | '';
  // Step 2
  height_cm: string;
  starting_weight_kg: string;
  // Step 3
  training_experience: Experience | '';
  goal_calories: string;
  goal_protein: string;
  goal_carbs: string;
  goal_fat: string;
}

const TOTAL_STEPS = 3;

// ── Step indicators ──────────────────────────────────────────────────────────

const STEPS = [
  { icon: User,   label: 'About You' },
  { icon: Ruler,  label: 'Body' },
  { icon: Target, label: 'Goals' },
];

// ── Main component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { createProfile, isLoading } = useUserProfile();
  const { updateMacroTargets } = useNutrition();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    name: '',
    age: '',
    gender: '',
    height_cm: '',
    starting_weight_kg: '',
    training_experience: '',
    goal_calories: '',
    goal_protein: '',
    goal_carbs: '',
    goal_fat: '',
  });

  // ── Auto-calculate macros when experience/weight/gender changes ──────────
  useEffect(() => {
    if (
      form.training_experience &&
      form.starting_weight_kg &&
      form.gender
    ) {
      const weight = parseFloat(form.starting_weight_kg);
      if (weight > 0) {
        const preset = calculateMacroPreset(
          weight,
          form.gender as Gender,
          form.training_experience as Experience
        );
        setForm((prev) => ({
          ...prev,
          goal_calories: String(preset.calories),
          goal_protein: String(preset.protein),
          goal_carbs: String(preset.carbs),
          goal_fat: String(preset.fat),
        }));
      }
    }
  }, [form.training_experience, form.starting_weight_kg, form.gender]);

  // ── BMI live calculation ─────────────────────────────────────────────────
  const bmi = calculateBMI(
    parseFloat(form.starting_weight_kg),
    parseFloat(form.height_cm)
  );
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  // ── Field updater ────────────────────────────────────────────────────────
  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Validation per step ──────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return form.name.trim().length >= 2 && form.age && form.gender;
    if (step === 2) return form.height_cm && form.starting_weight_kg;
    if (step === 3) return form.training_experience && form.goal_calories && form.goal_protein;
    return false;
  };

  // ── Navigation ───────────────────────────────────────────────────────────
  const next = () => { if (step < TOTAL_STEPS) setStep((s) => s + 1); };
  const back = () => { if (step > 1) setStep((s) => s - 1); };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const { error } = await createProfile({
      name: form.name.trim(),
      age: parseInt(form.age) || null,
      gender: (form.gender as Gender) || null,
      height_cm: parseFloat(form.height_cm) || null,
      starting_weight_kg: parseFloat(form.starting_weight_kg) || null,
      training_experience: (form.training_experience as Experience) || null,
      onboarding_completed: true,
    });

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      return;
    }

    // Also save macro targets
    await updateMacroTargets({
      calories: parseInt(form.goal_calories) || 2000,
      protein: parseInt(form.goal_protein) || 120,
      carbs: parseInt(form.goal_carbs) || 250,
      fat: parseInt(form.goal_fat) || 55,
    });

    toast({ title: `Welcome, ${form.name}! 🎉`, description: 'Your profile is set up.' });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 pt-10 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Dumbbell className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">FitTrack</span>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-6">
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isDone = stepNum < step;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                  isDone  ? 'bg-primary border-primary text-primary-foreground' :
                  isActive ? 'border-primary text-primary' :
                             'border-muted text-muted-foreground'
                )}>
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={cn(
                  'text-xs',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                )}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 pb-6">
        {step === 1 && <Step1 form={form} set={set} />}
        {step === 2 && <Step2 form={form} set={set} bmi={bmi} bmiCategory={bmiCategory} />}
        {step === 3 && <Step3 form={form} set={set} />}
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-10 flex gap-3">
        {step > 1 && (
          <Button variant="outline" className="flex-1 h-12" onClick={back}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button
            className="flex-1 h-12 text-base"
            onClick={next}
            disabled={!canProceed()}
          >
            Continue <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="flex-1 h-12 text-base"
            onClick={handleSubmit}
            disabled={!canProceed() || isLoading}
          >
            {isLoading ? 'Saving...' : "Let's go! 🚀"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Personal Info ────────────────────────────────────────────────────

function Step1({ form, set }: { form: FormState; set: (f: keyof FormState, v: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hey there! 👋</h1>
        <p className="text-muted-foreground mt-1">Let's set up your profile. This takes 2 minutes.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Your name</Label>
          <Input
            id="name"
            placeholder="e.g. Felipe"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="h-12 text-base"
            autoFocus
            autoComplete="given-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age" className="text-sm font-medium">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="e.g. 25"
            value={form.age}
            onChange={(e) => set('age', e.target.value)}
            inputMode="numeric"
            min={10}
            max={100}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Gender</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['male', 'female', 'other'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set('gender', g)}
                className={cn(
                  'h-12 rounded-lg border-2 text-sm font-medium capitalize transition-all',
                  form.gender === g
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Body Measurements ────────────────────────────────────────────────

function Step2({
  form, set, bmi, bmiCategory,
}: {
  form: FormState;
  set: (f: keyof FormState, v: string) => void;
  bmi: number | null;
  bmiCategory: ReturnType<typeof getBMICategory> | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Body measurements</h1>
        <p className="text-muted-foreground mt-1">Used to calculate your BMI and calorie needs.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="height" className="text-sm font-medium">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            placeholder="e.g. 178"
            value={form.height_cm}
            onChange={(e) => set('height_cm', e.target.value)}
            inputMode="decimal"
            min={100}
            max={250}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight" className="text-sm font-medium">Current weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            placeholder="e.g. 80"
            value={form.starting_weight_kg}
            onChange={(e) => set('starting_weight_kg', e.target.value)}
            inputMode="decimal"
            min={30}
            max={300}
            className="h-12 text-base"
          />
        </div>

        {/* BMI Preview */}
        {bmi && bmiCategory && (
          <Card className="border-2 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">BMI</p>
                  <p className={cn('text-3xl font-bold mt-0.5', getBMICategoryColor(bmiCategory))}>
                    {bmi}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-semibold', getBMICategoryColor(bmiCategory))}>
                    {getBMICategoryLabel(bmiCategory)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {bmiCategory === 'normal' ? 'Great range! 💪' :
                     bmiCategory === 'underweight' ? 'Consider gaining weight' :
                     bmiCategory === 'overweight' ? 'Slight excess' :
                     'Health risk — consult a doctor'}
                  </p>
                </div>
              </div>

              {/* BMI scale bar */}
              <div className="mt-3">
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div className="flex-1 bg-blue-400" />
                  <div className="flex-[2] bg-green-400" />
                  <div className="flex-1 bg-yellow-400" />
                  <div className="flex-1 bg-red-400" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Step 3: Training & Goals ─────────────────────────────────────────────────

const EXPERIENCE_OPTIONS: { value: Experience; label: string; desc: string; emoji: string }[] = [
  { value: 'beginner',     label: 'Beginner',     emoji: '🌱', desc: 'Less than 1 year training' },
  { value: 'intermediate', label: 'Intermediate',  emoji: '💪', desc: '1–3 years of consistent training' },
  { value: 'advanced',     label: 'Advanced',      emoji: '🏆', desc: '3+ years, structured programming' },
];

function Step3({ form, set }: { form: FormState; set: (f: keyof FormState, v: string) => void }) {
  const autoCalc = () => {
    const p = parseInt(form.goal_protein) || 0;
    const c = parseInt(form.goal_carbs) || 0;
    const f = parseInt(form.goal_fat) || 0;
    set('goal_calories', String(p * 4 + c * 4 + f * 9));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Training & Goals</h1>
        <p className="text-muted-foreground mt-1">We'll suggest a calorie target based on your level.</p>
      </div>

      {/* Experience selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Training experience</Label>
        <div className="space-y-2">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('training_experience', opt.value)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all',
                form.training_experience === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div>
                <p className={cn(
                  'text-sm font-semibold',
                  form.training_experience === opt.value ? 'text-primary' : ''
                )}>
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              {form.training_experience === opt.value && (
                <Check className="h-4 w-4 text-primary ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Macro targets */}
      {form.training_experience && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Daily targets</Label>
            <span className="text-xs text-muted-foreground">Auto-calculated · editable</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Calories (kcal)</Label>
              <Input
                type="number"
                value={form.goal_calories}
                onChange={(e) => set('goal_calories', e.target.value)}
                inputMode="numeric"
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Protein (g)</Label>
              <Input
                type="number"
                value={form.goal_protein}
                onChange={(e) => set('goal_protein', e.target.value)}
                inputMode="numeric"
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Carbs (g)</Label>
              <Input
                type="number"
                value={form.goal_carbs}
                onChange={(e) => set('goal_carbs', e.target.value)}
                inputMode="numeric"
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fat (g)</Label>
              <Input
                type="number"
                value={form.goal_fat}
                onChange={(e) => set('goal_fat', e.target.value)}
                inputMode="numeric"
                className="h-10"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={autoCalc}>
            Recalculate calories from macros
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            You can adjust these anytime in Settings.
          </p>
        </div>
      )}
    </div>
  );
}
