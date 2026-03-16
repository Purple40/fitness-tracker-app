'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useNutrition } from '@/lib/hooks/useNutrition';
import { toast } from '@/lib/hooks/useToast';
import { getTodayString, safeParseFloat, safeParseInt } from '@/lib/utils';
import { MacroTarget, NutritionLog } from '@/types';

interface LogMacrosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  macroTargets: MacroTarget;
  existingLog?: NutritionLog | null;
  initialDate?: string;
}

export function LogMacrosDialog({
  open,
  onOpenChange,
  onSuccess,
  macroTargets,
  existingLog,
  initialDate,
}: LogMacrosDialogProps) {
  const [date, setDate] = useState(initialDate || getTodayString());
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { upsertLog } = useNutrition();

  // Pre-fill with existing log data
  useEffect(() => {
    if (existingLog) {
      setDate(existingLog.date);
      setCalories(existingLog.calories_consumed?.toString() || '');
      setProtein(existingLog.protein_consumed?.toString() || '');
      setCarbs(existingLog.carbs_consumed?.toString() || '');
      setFat(existingLog.fat_consumed?.toString() || '');
      setNote(existingLog.note || '');
    }
  }, [existingLog, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await upsertLog({
      date,
      calories_consumed: safeParseInt(calories),
      protein_consumed: safeParseFloat(protein),
      carbs_consumed: safeParseFloat(carbs),
      fat_consumed: safeParseFloat(fat),
      note: note || null,
    });

    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: 'Nutrition logged successfully.' });
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const MacroInputRow = ({
    id,
    label,
    value,
    onChange,
    target,
    unit,
    placeholder,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    target: number;
    unit: string;
    placeholder: string;
  }) => {
    const pct = value ? Math.min(Math.round((parseFloat(value) / target) * 100), 100) : 0;
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Label htmlFor={id}>{label}</Label>
          <span className="text-xs text-muted-foreground">
            Target: {target}{unit}
            {value && ` · ${pct}%`}
          </span>
        </div>
        <Input
          id={id}
          type="number"
          min="0"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          className="text-lg"
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Nutrition</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="macro-date">Date</Label>
            <Input
              id="macro-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getTodayString()}
            />
          </div>

          <MacroInputRow
            id="calories"
            label="Calories"
            value={calories}
            onChange={setCalories}
            target={macroTargets.calories}
            unit="kcal"
            placeholder={`Target: ${macroTargets.calories}`}
          />
          <MacroInputRow
            id="protein"
            label="Protein"
            value={protein}
            onChange={setProtein}
            target={macroTargets.protein}
            unit="g"
            placeholder={`Target: ${macroTargets.protein}g`}
          />
          <MacroInputRow
            id="carbs"
            label="Carbs"
            value={carbs}
            onChange={setCarbs}
            target={macroTargets.carbs}
            unit="g"
            placeholder={`Target: ${macroTargets.carbs}g`}
          />
          <MacroInputRow
            id="fat"
            label="Fat"
            value={fat}
            onChange={setFat}
            target={macroTargets.fat}
            unit="g"
            placeholder={`Target: ${macroTargets.fat}g`}
          />

          <div className="space-y-2">
            <Label htmlFor="macro-note">Note (optional)</Label>
            <Textarea
              id="macro-note"
              placeholder="Any notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
