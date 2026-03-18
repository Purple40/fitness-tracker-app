'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LogOut,
  Target,
  User,
  ChevronRight,
  Save,
  Dumbbell,
  Camera,
  Heart,
  Globe,
  Activity,
} from 'lucide-react';
import { useNutrition } from '@/lib/hooks/useNutrition';
import { useUserStore } from '@/store/userStore';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/hooks/useToast';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useLocale } from '@/components/providers/LocaleProvider';
import { localeNames } from '@/lib/i18n';
import {
  useUserProfile,
  calculateBMI,
  getBMICategory,
  getBMICategoryLabel,
  getBMICategoryColor,
} from '@/lib/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/index';

type Gender = 'male' | 'female' | 'other';
type Experience = 'beginner' | 'intermediate' | 'advanced';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const router = useRouter();
  const { macroTargets, updateMacroTargets } = useNutrition();
  const { userEmail } = useUserStore();
  const { locale } = useLocale();
  const { fetchProfile, updateProfile } = useUserProfile();

  const [calories, setCalories] = useState(String(macroTargets?.calories || 2460));
  const [protein, setProtein] = useState(String(macroTargets?.protein || 140));
  const [carbs, setCarbs] = useState(String(macroTargets?.carbs || 340));
  const [fat, setFat] = useState(String(macroTargets?.fat || 60));
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Profile fields
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileGender, setProfileGender] = useState<Gender | ''>('');
  const [profileHeight, setProfileHeight] = useState('');
  const [profileWeight, setProfileWeight] = useState('');
  const [profileExperience, setProfileExperience] = useState<Experience | ''>('');

  useEffect(() => {
    fetchProfile().then((p: UserProfile | null) => {
      if (!p) return;
      setProfileName(p.name ?? '');
      setProfileAge(p.age ? String(p.age) : '');
      setProfileGender((p.gender as Gender | '') ?? '');
      setProfileHeight(p.height_cm ? String(p.height_cm) : '');
      setProfileWeight(p.starting_weight_kg ? String(p.starting_weight_kg) : '');
      setProfileExperience((p.training_experience as Experience | '') ?? '');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live BMI
  const bmi = calculateBMI(parseFloat(profileWeight), parseFloat(profileHeight));
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  const supabase = createClient();

  const handleSaveMacros = async () => {
    setIsSaving(true);
    const { error } = await updateMacroTargets({
      calories: parseInt(calories) || 2460,
      protein: parseInt(protein) || 140,
      carbs: parseInt(carbs) || 340,
      fat: parseInt(fat) || 60,
    });
    setIsSaving(false);
    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else {
      toast({ title: t('saveSuccess') });
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setIsSavingProfile(true);
    const { error } = await updateProfile({
      name: profileName.trim(),
      age: parseInt(profileAge) || null,
      gender: (profileGender as Gender) || null,
      height_cm: parseFloat(profileHeight) || null,
      starting_weight_kg: parseFloat(profileWeight) || null,
      training_experience: (profileExperience as Experience) || null,
    });
    setIsSavingProfile(false);
    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated ✓' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const autoCalc = () => {
    const p = parseInt(protein) || 0;
    const c = parseInt(carbs) || 0;
    const f = parseInt(fat) || 0;
    setCalories(String(p * 4 + c * 4 + f * 9));
  };

  return (
    <div className="page-enter">
      <Header title={t('title')} />

      <div className="p-4 space-y-4">
        {/* Profile */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Age</Label>
                <Input
                  type="number"
                  value={profileAge}
                  onChange={(e) => setProfileAge(e.target.value)}
                  placeholder="e.g. 25"
                  inputMode="numeric"
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gender</Label>
                <div className="flex gap-1">
                  {(['male', 'female', 'other'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setProfileGender(g)}
                      className={cn(
                        'flex-1 h-10 rounded-md border text-xs font-medium capitalize transition-all',
                        profileGender === g
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      {g === 'male' ? '♂' : g === 'female' ? '♀' : '⚧'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height (cm)</Label>
                <Input
                  type="number"
                  value={profileHeight}
                  onChange={(e) => setProfileHeight(e.target.value)}
                  placeholder="e.g. 178"
                  inputMode="decimal"
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Starting weight (kg)</Label>
                <Input
                  type="number"
                  value={profileWeight}
                  onChange={(e) => setProfileWeight(e.target.value)}
                  placeholder="e.g. 80"
                  inputMode="decimal"
                  className="h-10"
                />
              </div>
            </div>

            {/* BMI display */}
            {bmi && bmiCategory && (
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">BMI</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-bold', getBMICategoryColor(bmiCategory))}>
                    {bmi}
                  </span>
                  <span className={cn('text-xs', getBMICategoryColor(bmiCategory))}>
                    {getBMICategoryLabel(bmiCategory)}
                  </span>
                </div>
              </div>
            )}

            {/* Experience */}
            <div className="space-y-1">
              <Label className="text-xs">Training experience</Label>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as Experience[]).map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setProfileExperience(exp)}
                    className={cn(
                      'flex-1 h-9 rounded-md border text-xs font-medium capitalize transition-all',
                      profileExperience === exp
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                    )}
                  >
                    {exp === 'beginner' ? '🌱' : exp === 'intermediate' ? '💪' : '🏆'} {exp.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              className="w-full gap-1"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
            >
              <Save className="h-3.5 w-3.5" />
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('account')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('email')}</p>
              <p className="text-sm font-medium">{userEmail || '—'}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </Button>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('language')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{localeNames[locale]}</p>
                <p className="text-xs text-muted-foreground">{t('languageDesc')}</p>
              </div>
              <LanguageSwitcher />
            </div>
          </CardContent>
        </Card>

        {/* Macro Targets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('macroTargets')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('calories')}</Label>
                <Input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  inputMode="numeric"
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('protein')}</Label>
                <Input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  inputMode="numeric"
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('carbs')}</Label>
                <Input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  inputMode="numeric"
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('fat')}</Label>
                <Input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  inputMode="numeric"
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={autoCalc}
              >
                {t('autoCalc')}
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1"
                onClick={handleSaveMacros}
                disabled={isSaving}
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? tCommon('saving') : t('saveTargets')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('macroFormula')}</p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('more')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Link href="/settings/exercises">
              <div className="flex items-center justify-between p-4 hover:bg-accent transition-colors border-b">
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('manageExercises')}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/settings/photos">
              <div className="flex items-center justify-between p-4 hover:bg-accent transition-colors border-b">
                <div className="flex items-center gap-3">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('progressPhotos')}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/settings/recovery">
              <div className="flex items-center justify-between p-4 hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('recoveryLog')}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('appVersion')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('appSubtitle')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
