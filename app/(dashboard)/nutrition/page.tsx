'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Trash2, Utensils } from 'lucide-react';
import { useNutrition } from '@/lib/hooks/useNutrition';
import { formatDate, getTodayString, calculateMacroPercentage } from '@/lib/utils';
import { LogMacrosDialog } from '@/components/nutrition/LogMacrosDialog';
import { MacroTargetsDialog } from '@/components/nutrition/MacroTargetsDialog';
import { NutritionChart } from '@/components/nutrition/NutritionChart';
import { toast } from '@/lib/hooks/useToast';

export default function NutritionPage() {
  const t = useTranslations('nutrition');
  const tCommon = useTranslations('common');

  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showTargetsDialog, setShowTargetsDialog] = useState(false);

  const {
    logs,
    todayLog,
    macroTargets,
    isLoading,
    fetchLogs,
    fetchMacroTargets,
    deleteLog,
  } = useNutrition();

  const handleDeleteLog = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    const { error } = await deleteLog(id);
    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else {
      toast({ title: '✓ ' + t('deleteSuccess'), variant: 'success' });
    }
  };

  const caloriesPct = calculateMacroPercentage(
    todayLog?.calories_consumed ?? null,
    macroTargets.calories
  );
  const proteinPct = calculateMacroPercentage(
    todayLog?.protein_consumed ?? null,
    macroTargets.protein
  );
  const carbsPct = calculateMacroPercentage(
    todayLog?.carbs_consumed ?? null,
    macroTargets.carbs
  );
  const fatPct = calculateMacroPercentage(
    todayLog?.fat_consumed ?? null,
    macroTargets.fat
  );

  return (
    <div className="page-enter">
      <Header
        title={t('title')}
        rightElement={
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowTargetsDialog(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowLogDialog(true)}
              className="gap-1 h-8"
            >
              <Plus className="h-4 w-4" />
              {t('addMealButton')}
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Today's Macros */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('todayNutrition')}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowLogDialog(true)}
              >
                <Plus className="h-3 w-3" />
                {t('addMealButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calories */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-semibold">{t('calories')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {todayLog?.calories_consumed ?? 0}
                    <span className="text-muted-foreground font-normal">
                      {' '}/ {macroTargets.calories} {tCommon('kcal')}
                    </span>
                  </span>
                  <Badge
                    variant={
                      caloriesPct >= 90
                        ? 'success'
                        : caloriesPct >= 70
                        ? 'warning'
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {caloriesPct}%
                  </Badge>
                </div>
              </div>
              <MacroProgressBar value={caloriesPct} color="bg-orange-500" />
            </div>

            {/* Protein */}
            <MacroRow
              label={t('protein')}
              consumed={todayLog?.protein_consumed ?? 0}
              target={macroTargets.protein}
              unit={tCommon('grams')}
              percentage={proteinPct}
              color="bg-red-500"
            />

            {/* Carbs */}
            <MacroRow
              label={t('carbs')}
              consumed={todayLog?.carbs_consumed ?? 0}
              target={macroTargets.carbs}
              unit={tCommon('grams')}
              percentage={carbsPct}
              color="bg-yellow-500"
            />

            {/* Fat */}
            <MacroRow
              label={t('fat')}
              consumed={todayLog?.fat_consumed ?? 0}
              target={macroTargets.fat}
              unit={tCommon('grams')}
              percentage={fatPct}
              color="bg-blue-500"
            />

            {!todayLog && (
              <Button className="w-full" onClick={() => setShowLogDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addFirstMeal')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Macro Targets Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">{t('macroTargetsTitle')}</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowTargetsDialog(true)}
              >
                <Settings className="h-3 w-3" />
                {tCommon('edit')}
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <TargetBadge
                label={t('calories')}
                value={macroTargets.calories}
                unit={tCommon('kcal')}
                color="text-orange-600"
              />
              <TargetBadge
                label={t('protein')}
                value={macroTargets.protein}
                unit={tCommon('grams')}
                color="text-red-600"
              />
              <TargetBadge
                label={t('carbs')}
                value={macroTargets.carbs}
                unit={tCommon('grams')}
                color="text-yellow-600"
              />
              <TargetBadge
                label={t('fat')}
                value={macroTargets.fat}
                unit={tCommon('grams')}
                color="text-blue-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Chart + History Tabs */}
        <Tabs defaultValue="compliance">
          <TabsList className="w-full">
            <TabsTrigger value="compliance" className="flex-1 text-xs">
              {t('complianceTab')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 text-xs">
              {t('historyTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="compliance">
            <NutritionChart logs={logs} macroTargets={macroTargets} />
          </TabsContent>
          <TabsContent value="history">
            <div className="space-y-2 mt-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {tCommon('loading')}
                </div>
              ) : logs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Utensils className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('noLogs')}</p>
                  </CardContent>
                </Card>
              ) : (
                logs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold">
                              {formatDate(log.date, 'EEE, MMM d')}
                            </p>
                            {log.date === getTodayString() && (
                              <Badge variant="secondary" className="text-xs py-0">
                                {tCommon('today')}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-xs">
                            <span className="text-orange-400 font-medium">
                              {log.calories_consumed ?? '—'} {tCommon('kcal')}
                            </span>
                            <span className="text-red-400 font-medium">
                              {log.protein_consumed ?? '—'}{tCommon('grams')} P
                            </span>
                            <span className="text-yellow-400 font-medium">
                              {log.carbs_consumed ?? '—'}{tCommon('grams')} C
                            </span>
                            <span className="text-blue-400 font-medium">
                              {log.fat_consumed ?? '—'}{tCommon('grams')} F
                            </span>
                          </div>
                          {log.note && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {log.note}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive ml-2"
                          onClick={() => handleDeleteLog(log.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <LogMacrosDialog
        open={showLogDialog}
        onOpenChange={setShowLogDialog}
        onSuccess={() => fetchLogs()}
        macroTargets={macroTargets}
        todayLog={todayLog}
      />
      <MacroTargetsDialog
        open={showTargetsDialog}
        onOpenChange={setShowTargetsDialog}
        currentTargets={macroTargets}
        onSuccess={() => fetchMacroTargets()}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MacroProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function MacroRow({
  label,
  consumed,
  target,
  unit,
  percentage,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  percentage: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm">
          <span className="font-semibold">{consumed}</span>
          <span className="text-muted-foreground">
            {' '}/ {target}{unit}
          </span>
        </span>
      </div>
      <MacroProgressBar value={percentage} color={color} />
    </div>
  );
}

function TargetBadge({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div>
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{unit}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
