'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { Exercise, MuscleGroup, ExerciseType } from '@/types';
import { toast } from '@/lib/hooks/useToast';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Core', 'Calves', 'Full Body', 'Cardio',
];

const EXERCISE_TYPES: ExerciseType[] = ['Compound', 'Isolation', 'Cardio', 'Bodyweight'];

interface CreateExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (exercise: Exercise) => void;
}

export function CreateExerciseDialog({
  open,
  onClose,
  onCreated,
}: CreateExerciseDialogProps) {
  const t = useTranslations('workouts');
  const tCommon = useTranslations('common');

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Chest');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('Compound');
  const [isLoading, setIsLoading] = useState(false);

  const { createCustomExercise } = useWorkouts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    const { data, error } = await createCustomExercise({
      name: name.trim(),
      muscle_group: muscleGroup,
      exercise_type: exerciseType,
    });
    setIsLoading(false);

    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else if (data) {
      toast({ title: t('exerciseCreated') });
      setName('');
      onCreated(data as Exercise);
    }
  };

  // Translate muscle group
  const tMuscle = (mg: string) => {
    try {
      return t(`muscleGroups.${mg}` as Parameters<typeof t>[0]);
    } catch {
      return mg;
    }
  };

  // Translate exercise type
  const tType = (et: string) => {
    try {
      return t(`exerciseTypes.${et}` as Parameters<typeof t>[0]);
    } catch {
      return et;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>{t('createNew')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Exercise Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-name">{t('exerciseName')}</Label>
            <Input
              id="ex-name"
              placeholder={t('exerciseNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Muscle Group */}
          <div className="space-y-1.5">
            <Label>{t('muscleGroup')}</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {MUSCLE_GROUPS.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => setMuscleGroup(mg)}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                    muscleGroup === mg
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                >
                  {tMuscle(mg)}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Type */}
          <div className="space-y-1.5">
            <Label>{t('exerciseType')}</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {EXERCISE_TYPES.map((et) => (
                <button
                  key={et}
                  type="button"
                  onClick={() => setExerciseType(et)}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                    exerciseType === et
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                >
                  {tType(et)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? t('creating') : t('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
