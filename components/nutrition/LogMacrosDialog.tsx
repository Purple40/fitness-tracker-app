'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Utensils, Plus, RotateCcw } from 'lucide-react';
import { useNutrition } from '@/lib/hooks/useNutrition';
import { toast } from '@/lib/hooks/useToast';
import { MacroTarget, NutritionLog } from '@/types';

interface LogMacrosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  macroTargets: MacroTarget;
  todayLog?: NutritionLog | null;
}

// Quick meal presets for fast logging
const MEAL_PRESETS = [
  { label: 'Breakfast', emoji: '🌅' },
  { label: 'Lunch', emoji: '☀️' },
  { label: 'Dinner', emoji: '🌙' },
  { label: 'Snack', emoji: '🍎' },
  { label: 'Pre-workout', emoji: '💪' },
  { label: 'Post-workout', emoji: '🥤' },
];

export function LogMacrosDialog({
  open,
  onOpenChange,
  onSuccess,
  macroTargets,
  todayLog,
}: LogMacrosDialogProps) {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { addToTodayLog, resetTodayLog } = useNutrition();

  // Running totals already logged today
  const currentCalories = todayLog?.calories_consumed ?? 0;
  const currentProtein = todayLog?.protein_consumed ?? 0;
  const currentCarbs = todayLog?.carbs_consumed ?? 0;
  const currentFat = todayLog?.fat_consumed ?? 0;

  // Preview what totals will be after adding
  const previewCalories = currentCalories + (parseFloat(calories) || 0);
  const previewProtein = currentProtein + (parseFloat(protein) || 0);
  const previewCarbs = currentCarbs + (parseFloat(carbs) || 0);
  const previewFat = currentFat + (parseFloat(fat) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calories && !protein && !carbs && !fat) {
      toast({
        title: 'Nothing to add',
        description: 'Enter at least one macro value.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await addToTodayLog({
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      mealName: mealName || undefined,
    });
    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({
        title: `✓ ${mealName || 'Meal'} added!`,
        description: `+${calories || 0} kcal · +${protein || 0}g protein`,
        variant: 'success',
      });
      // Clear fields for next entry
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setMealName('');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all of today\'s nutrition to zero?')) return;
    setIsResetting(true);
    const { error } = await resetTodayLog();
    setIsResetting(false);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: '✓ Reset', description: 'Today\'s nutrition cleared.', variant: 'success' });
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const pct = (val: number, target: number) =>
    target > 0 ? Math.min(Math.round((val / target) * 100), 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Add Meal
          </DialogTitle>
        </DialogHeader>

        {/* Today's running total */}
        <div className="rounded-lg bg-muted/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Today so far
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <TodayMacro
              label="kcal"
              current={currentCalories}
              target={macroTargets.calories}
              color="text-orange-400"
            />
            <TodayMacro
              label="Protein"
              current={currentProtein}
              target={macroTargets.protein}
              color="text-red-400"
              unit="g"
            />
            <TodayMacro
              label="Carbs"
              current={currentCarbs}
              target={macroTargets.carbs}
              color="text-yellow-400"
              unit="g"
            />
            <TodayMacro
              label="Fat"
              current={currentFat}
              target={macroTargets.fat}
              color="text-blue-400"
              unit="g"
            />
          </div>
          {/* Progress bars */}
          <div className="space-y-1">
            <MiniBar value={pct(currentCalories, macroTargets.calories)} color="bg-orange-500" />
            <MiniBar value={pct(currentProtein, macroTargets.protein)} color="bg-red-500" />
            <MiniBar value={pct(currentCarbs, macroTargets.carbs)} color="bg-yellow-500" />
            <MiniBar value={pct(currentFat, macroTargets.fat)} color="bg-blue-500" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meal name presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Meal (optional)</Label>
            <div className="flex flex-wrap gap-1.5">
              {MEAL_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setMealName(mealName === preset.label ? '' : preset.label)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    mealName === preset.label
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {preset.emoji} {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Macro inputs — large touch targets */}
          <div className="grid grid-cols-2 gap-3">
            <MacroField
              id="add-calories"
              label="Calories"
              unit="kcal"
              value={calories}
              onChange={setCalories}
              preview={previewCalories}
              target={macroTargets.calories}
              color="text-orange-400"
            />
            <MacroField
              id="add-protein"
              label="Protein"
              unit="g"
              value={protein}
              onChange={setProtein}
              preview={previewProtein}
              target={macroTargets.protein}
              color="text-red-400"
            />
            <MacroField
              id="add-carbs"
              label="Carbs"
              unit="g"
              value={carbs}
              onChange={setCarbs}
              preview={previewCarbs}
              target={macroTargets.carbs}
              color="text-yellow-400"
            />
            <MacroField
              id="add-fat"
              label="Fat"
              unit="g"
              value={fat}
              onChange={setFat}
              preview={previewFat}
              target={macroTargets.fat}
              color="text-blue-400"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={handleReset}
              disabled={isResetting}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-1 h-11" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TodayMacro({
  label,
  current,
  target,
  color,
  unit = '',
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return (
    <div>
      <p className={`text-sm font-bold ${color}`}>
        {Math.round(current)}{unit}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{pct}%</p>
    </div>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function MacroField({
  id,
  label,
  unit,
  value,
  onChange,
  preview,
  target,
  color,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  preview: number;
  target: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-xs">
          {label}
        </Label>
        <span className={`text-xs font-medium ${color}`}>
          → {Math.round(preview)}/{target}{unit}
        </span>
      </div>
      <Input
        id={id}
        type="number"
        min="0"
        step="1"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="text-xl h-14 font-bold text-center"
      />
    </div>
  );
}
