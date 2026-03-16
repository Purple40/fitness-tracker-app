'use client';

import { useState } from 'react';
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
import { NutritionLog } from '@/types';
import { toast } from '@/lib/hooks/useToast';
import { createClient } from '@/lib/supabase/client';

export default function NutritionPage() {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showTargetsDialog, setShowTargetsDialog] = useState(false);
  const [editingLog, setEditingLog] = useState<NutritionLog | null>(null);

  const { logs, todayLog, macroTargets, isLoading, fetchLogs, fetchMacroTargets } = useNutrition();
  const supabase = createClient();

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Delete this nutrition log?')) return;
    const { error } = await supabase.from('nutrition_logs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      fetchLogs();
    }
  };

  const caloriesPct = calculateMacroPercentage(todayLog?.calories_consumed ?? null, macroTargets.calories);
  const proteinPct = calculateMacroPercentage(todayLog?.protein_consumed ?? null, macroTargets.protein);
  const carbsPct = calculateMacroPercentage(todayLog?.carbs_consumed ?? null, macroTargets.carbs);
  const fatPct = calculateMacroPercentage(todayLog?.fat_consumed ?? null, macroTargets.fat);

  return (
    <div className="page-enter">
      <Header
        title="Nutrition"
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
            <Button size="sm" onClick={() => { setEditingLog(null); setShowLogDialog(true); }} className="gap-1 h-8">
              <Plus className="h-4 w-4" />
              Log
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Today's Macros */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Today's Nutrition</CardTitle>
              {todayLog && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => { setEditingLog(todayLog); setShowLogDialog(true); }}
                >
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calories */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-semibold">Calories</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {todayLog?.calories_consumed ?? 0}
                    <span className="text-muted-foreground font-normal"> / {macroTargets.calories} kcal</span>
                  </span>
                  <Badge
                    variant={caloriesPct >= 90 ? 'success' : caloriesPct >= 70 ? 'warning' : 'secondary'}
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
              label="Protein"
              consumed={todayLog?.protein_consumed ?? 0}
              target={macroTargets.protein}
              unit="g"
              percentage={proteinPct}
              color="bg-red-500"
            />

            {/* Carbs */}
            <MacroRow
              label="Carbs"
              consumed={todayLog?.carbs_consumed ?? 0}
              target={macroTargets.carbs}
              unit="g"
              percentage={carbsPct}
              color="bg-yellow-500"
            />

            {/* Fat */}
            <MacroRow
              label="Fat"
              consumed={todayLog?.fat_consumed ?? 0}
              target={macroTargets.fat}
              unit="g"
              percentage={fatPct}
              color="bg-blue-500"
            />

            {!todayLog && (
              <Button
                className="w-full"
                onClick={() => { setEditingLog(null); setShowLogDialog(true); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Today's Nutrition
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Macro Targets Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Macro Targets</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowTargetsDialog(true)}
              >
                <Settings className="h-3 w-3" />
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <TargetBadge label="Calories" value={macroTargets.calories} unit="kcal" color="text-orange-600" />
              <TargetBadge label="Protein" value={macroTargets.protein} unit="g" color="text-red-600" />
              <TargetBadge label="Carbs" value={macroTargets.carbs} unit="g" color="text-yellow-600" />
              <TargetBadge label="Fat" value={macroTargets.fat} unit="g" color="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Tabs defaultValue="compliance">
          <TabsList className="w-full">
            <TabsTrigger value="compliance" className="flex-1 text-xs">Compliance</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 text-xs">History</TabsTrigger>
          </TabsList>
          <TabsContent value="compliance">
            <NutritionChart logs={logs} macroTargets={macroTargets} />
          </TabsContent>
          <TabsContent value="history">
            <div className="space-y-2 mt-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : logs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Utensils className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No nutrition logs yet</p>
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
                              <Badge variant="secondary" className="text-xs py-0">Today</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-xs">
                            <span className="text-orange-600 font-medium">{log.calories_consumed ?? '—'} kcal</span>
                            <span className="text-red-600 font-medium">{log.protein_consumed ?? '—'}g P</span>
                            <span className="text-yellow-600 font-medium">{log.carbs_consumed ?? '—'}g C</span>
                            <span className="text-blue-600 font-medium">{log.fat_consumed ?? '—'}g F</span>
                          </div>
                          {log.note && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{log.note}</p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditingLog(log); setShowLogDialog(true); }}
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteLog(log.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
        existingLog={editingLog}
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

function MacroProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${value}%` }}
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
          <span className="text-muted-foreground"> / {target}{unit}</span>
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
