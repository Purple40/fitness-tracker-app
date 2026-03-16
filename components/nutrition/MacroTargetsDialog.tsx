'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useNutrition } from '@/lib/hooks/useNutrition';
import { toast } from '@/lib/hooks/useToast';
import { MacroTarget } from '@/types';

interface MacroTargetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTargets: MacroTarget;
  onSuccess?: () => void;
}

export function MacroTargetsDialog({
  open,
  onOpenChange,
  currentTargets,
  onSuccess,
}: MacroTargetsDialogProps) {
  const [calories, setCalories] = useState(currentTargets.calories.toString());
  const [protein, setProtein] = useState(currentTargets.protein.toString());
  const [carbs, setCarbs] = useState(currentTargets.carbs.toString());
  const [fat, setFat] = useState(currentTargets.fat.toString());
  const [isLoading, setIsLoading] = useState(false);

  const { updateMacroTargets } = useNutrition();

  useEffect(() => {
    if (open) {
      setCalories(currentTargets.calories.toString());
      setProtein(currentTargets.protein.toString());
      setCarbs(currentTargets.carbs.toString());
      setFat(currentTargets.fat.toString());
    }
  }, [open, currentTargets]);

  // Auto-calculate calories from macros
  const calculatedCalories = Math.round(
    (parseFloat(protein) || 0) * 4 +
    (parseFloat(carbs) || 0) * 4 +
    (parseFloat(fat) || 0) * 9
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await updateMacroTargets({
      calories: parseInt(calories) || calculatedCalories,
      protein: parseInt(protein),
      carbs: parseInt(carbs),
      fat: parseInt(fat),
    });

    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Targets updated!', description: 'Your macro targets have been saved.' });
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Macro Targets</DialogTitle>
          <DialogDescription>
            Set your daily nutrition targets.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="target-protein">Protein (g)</Label>
            <Input
              id="target-protein"
              type="number"
              min="0"
              max="500"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              inputMode="numeric"
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-carbs">Carbs (g)</Label>
            <Input
              id="target-carbs"
              type="number"
              min="0"
              max="1000"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              inputMode="numeric"
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-fat">Fat (g)</Label>
            <Input
              id="target-fat"
              type="number"
              min="0"
              max="500"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              inputMode="numeric"
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="target-calories">Calories (kcal)</Label>
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => setCalories(calculatedCalories.toString())}
              >
                Auto-calculate ({calculatedCalories} kcal)
              </button>
            </div>
            <Input
              id="target-calories"
              type="number"
              min="0"
              max="10000"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              inputMode="numeric"
              className="text-lg"
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
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Targets'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
