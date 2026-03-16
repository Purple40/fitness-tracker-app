'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  Footprints,
  Utensils,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useBodyMetrics } from '@/lib/hooks/useBodyMetrics';
import { useNutrition } from '@/lib/hooks/useNutrition';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { useRecovery } from '@/lib/hooks/useRecovery';
import { formatDate, getTodayString, calculateMacroPercentage, formatDuration } from '@/lib/utils';
import Link from 'next/link';
import { LogWeightDialog } from '@/components/body/LogWeightDialog';
import { LogMacrosDialog } from '@/components/nutrition/LogMacrosDialog';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState('');
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [showLogMacros, setShowLogMacros] = useState(false);

  const { todayMetric, weeklyStats, fetchMetrics } = useBodyMetrics();
  const { todayLog, macroTargets, fetchLogs } = useNutrition();
  const { sessions } = useWorkouts();
  const { todayMetric: recoveryToday } = useRecovery();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }
    };
    getUser();
  }, []);

  const today = getTodayString();
  const todaySession = sessions.find((s) => s.date === today);

  // Weekly average weight
  const thisWeekStats = weeklyStats[weeklyStats.length - 1];
  const lastWeekStats = weeklyStats[weeklyStats.length - 2];
  const weightTrend = thisWeekStats && lastWeekStats
    ? thisWeekStats.avg_weight - lastWeekStats.avg_weight
    : null;

  // Macro compliance
  const caloriesPct = calculateMacroPercentage(todayLog?.calories_consumed ?? null, macroTargets.calories);
  const proteinPct = calculateMacroPercentage(todayLog?.protein_consumed ?? null, macroTargets.protein);
  const carbsPct = calculateMacroPercentage(todayLog?.carbs_consumed ?? null, macroTargets.carbs);
  const fatPct = calculateMacroPercentage(todayLog?.fat_consumed ?? null, macroTargets.fat);
  const overallMacroPct = Math.round((caloriesPct + proteinPct + carbsPct + fatPct) / 4);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  return (
    <div className="page-enter">
      <Header
        title={t('title')}
        showSettings
        rightElement={
          <div className="flex items-center gap-2 mr-1">
            <span className="text-sm text-muted-foreground">
              {formatDate(today, 'EEE, MMM d')}
            </span>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-bold">
            {greeting()}{userName ? `, ${userName}` : ''}! 👋
          </h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Weight Card */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                  <Scale className="h-4 w-4 text-blue-400" />
                </div>
                {weightTrend !== null && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${
                    weightTrend < 0 ? 'text-green-600' : weightTrend > 0 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {weightTrend < 0 ? <TrendingDown className="h-3 w-3" /> :
                     weightTrend > 0 ? <TrendingUp className="h-3 w-3" /> :
                     <Minus className="h-3 w-3" />}
                    {Math.abs(weightTrend).toFixed(1)}
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold">
                {todayMetric?.weight_fasted
                  ? `${todayMetric.weight_fasted}${tCommon('kg')}`
                  : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t('weightToday')}</p>
              {thisWeekStats && (
                <p className="text-xs text-muted-foreground">
                  {t('weeklyAvg')}: {thisWeekStats.avg_weight}{tCommon('kg')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Steps Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 mb-2">
                <Footprints className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold">
                {todayMetric?.steps
                  ? todayMetric.steps.toLocaleString()
                  : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t('stepsToday')}</p>
              {todayMetric?.steps && (
                <div className="mt-1">
                  <Progress
                    value={Math.min((todayMetric.steps / 10000) * 100, 100)}
                    className="h-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Math.round((todayMetric.steps / 10000) * 100)}% {t('stepsGoal')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Macros Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
                  <Utensils className="h-4 w-4 text-orange-400" />
                </div>
                {t('nutritionToday')}
              </CardTitle>
              <Link href="/nutrition">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  {tCommon('details')} <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayLog ? (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{t('overallCompliance')}</span>
                  <span className="font-bold text-primary">{overallMacroPct}%</span>
                </div>
                <div className="space-y-2">
                  <MacroBar
                    label="Calories"
                    consumed={todayLog.calories_consumed ?? 0}
                    target={macroTargets.calories}
                    unit="kcal"
                    color="bg-orange-500"
                    percentage={caloriesPct}
                  />
                  <MacroBar
                    label="Protein"
                    consumed={todayLog.protein_consumed ?? 0}
                    target={macroTargets.protein}
                    unit="g"
                    color="bg-red-500"
                    percentage={proteinPct}
                  />
                  <MacroBar
                    label="Carbs"
                    consumed={todayLog.carbs_consumed ?? 0}
                    target={macroTargets.carbs}
                    unit="g"
                    color="bg-yellow-500"
                    percentage={carbsPct}
                  />
                  <MacroBar
                    label="Fat"
                    consumed={todayLog.fat_consumed ?? 0}
                    target={macroTargets.fat}
                    unit="g"
                    color="bg-blue-500"
                    percentage={fatPct}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">{t('noMacros')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                  <Dumbbell className="h-4 w-4 text-purple-400" />
                </div>
                {t('todayWorkout')}
              </CardTitle>
              {todaySession && (
                <Badge variant="success" className="text-xs">
                  {t('completed')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {todaySession ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('session')} #{todaySession.session_number}
                  </span>
                  {todaySession.duration && (
                    <span className="font-medium">{formatDuration(todaySession.duration)}</span>
                  )}
                </div>
                {todaySession.exercises && todaySession.exercises.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {todaySession.exercises.slice(0, 4).map((ex) => (
                      <Badge key={ex.id} variant="secondary" className="text-xs">
                        {ex.exercise?.name}
                      </Badge>
                    ))}
                    {todaySession.exercises.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{todaySession.exercises.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
                <Link href={`/workouts/${todaySession.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-1">
                    {t('viewSession')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-1">
                <p className="text-sm text-muted-foreground mb-3">{t('noWorkout')}</p>
                <Link href="/workouts">
                  <Button className="w-full gap-2">
                    <Dumbbell className="h-4 w-4" />
                    {t('startWorkout')}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recovery Card */}
        {recoveryToday && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20">
                  <Zap className="h-4 w-4 text-teal-400" />
                </div>
                <span className="font-semibold">{t('recoveryToday')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <RecoveryBadge label="Energy" value={recoveryToday.energy} />
                <RecoveryBadge label="Fatigue" value={recoveryToday.fatigue} />
                <RecoveryBadge label="Motivation" value={recoveryToday.motivation} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {t('quickActions')}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="flex flex-col h-16 gap-1 text-xs"
              onClick={() => setShowLogWeight(true)}
            >
              <Scale className="h-5 w-5" />
              {t('logWeight')}
            </Button>
            <Link href="/workouts" className="contents">
              <Button variant="outline" className="flex flex-col h-16 gap-1 text-xs">
                <Dumbbell className="h-5 w-5" />
                {t('workout')}
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex flex-col h-16 gap-1 text-xs"
              onClick={() => setShowLogMacros(true)}
            >
              <Utensils className="h-5 w-5" />
              {t('logMacros')}
            </Button>
          </div>
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('recentWorkouts')}
              </h3>
              <Link href="/workouts">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  {tCommon('seeAll')}
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {sessions.slice(0, 3).map((session) => (
                <Link key={session.id} href={`/workouts/${session.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {formatDate(session.date, 'EEE, MMM d')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.exercises?.length || 0} {t('exercises')}
                          {session.duration ? ` · ${formatDuration(session.duration)}` : ''}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <LogWeightDialog
        open={showLogWeight}
        onOpenChange={setShowLogWeight}
        onSuccess={() => fetchMetrics()}
      />
      <LogMacrosDialog
        open={showLogMacros}
        onOpenChange={setShowLogMacros}
        onSuccess={() => fetchLogs()}
        macroTargets={macroTargets}
      />
    </div>
  );
}

function MacroBar({
  label,
  consumed,
  target,
  unit,
  color,
  percentage,
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
  percentage: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {consumed}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RecoveryBadge({ label, value }: { label: string; value: number | null }) {
  const colors = [
    '',
    'bg-red-500/20 text-red-400',
    'bg-orange-500/20 text-orange-400',
    'bg-yellow-500/20 text-yellow-400',
    'bg-lime-500/20 text-lime-400',
    'bg-green-500/20 text-green-400',
  ];
  const v = value ?? 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center ${colors[v] || ''}`}>
        {v}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
