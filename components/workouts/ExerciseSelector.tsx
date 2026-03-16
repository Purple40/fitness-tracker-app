'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Dumbbell } from 'lucide-react';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { Exercise, MuscleGroup } from '@/types';
import { getMuscleGroupColor } from '@/lib/utils';
import { CreateExerciseDialog } from '@/components/workouts/CreateExerciseDialog';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Core', 'Calves', 'Cardio',
];

interface ExerciseSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
  excludeIds?: string[];
}

export function ExerciseSelector({
  open,
  onClose,
  onSelect,
  excludeIds = [],
}: ExerciseSelectorProps) {
  const t = useTranslations('workouts');

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { exercises, fetchExercises } = useWorkouts();

  useEffect(() => {
    if (open) {
      fetchExercises();
      setSearch('');
      setSelectedMuscle('All');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = selectedMuscle === 'All' || ex.muscle_group === selectedMuscle;
      const notExcluded = !excludeIds.includes(ex.id);
      return matchesSearch && matchesMuscle && notExcluded;
    });
  }, [exercises, search, selectedMuscle, excludeIds]);

  // Group by muscle group
  const grouped = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    filteredExercises.forEach((ex) => {
      if (!groups[ex.muscle_group]) groups[ex.muscle_group] = [];
      groups[ex.muscle_group].push(ex);
    });
    return groups;
  }, [filteredExercises]);

  // Translate muscle group name
  const tMuscle = (mg: string) => {
    try {
      return t(`muscleGroups.${mg}` as Parameters<typeof t>[0]);
    } catch {
      return mg;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t('selectExercise')}</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchExercises')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Muscle Group Filter */}
          <div className="px-4 pt-2">
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              <Badge
                variant={selectedMuscle === 'All' ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap flex-shrink-0 text-xs px-2.5 py-1"
                onClick={() => setSelectedMuscle('All')}
              >
                {t('allMuscles')}
              </Badge>
              {MUSCLE_GROUPS.map((mg) => (
                <Badge
                  key={mg}
                  variant={selectedMuscle === mg ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap flex-shrink-0 text-xs px-2.5 py-1"
                  style={
                    selectedMuscle === mg
                      ? {}
                      : { borderColor: getMuscleGroupColor(mg) + '60' }
                  }
                  onClick={() => setSelectedMuscle(mg)}
                >
                  {tMuscle(mg)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-y-auto px-4 pb-2">
            {filteredExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Dumbbell className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">{t('noResults')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('createCustom')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {Object.entries(grouped).map(([muscleGroup, exList]) => (
                  <div key={muscleGroup}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getMuscleGroupColor(muscleGroup) }}
                      />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {tMuscle(muscleGroup)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {exList.map((exercise) => (
                        <button
                          key={exercise.id}
                          onClick={() => onSelect(exercise.id)}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-medium">{exercise.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tExerciseType(exercise.exercise_type, t)}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Custom Button */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              {t('createNew')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateExerciseDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(exercise) => {
          setShowCreateDialog(false);
          onSelect(exercise.id);
        }}
      />
    </>
  );
}

// Helper to translate exercise type
function tExerciseType(
  type: string,
  t: (key: string) => string
): string {
  try {
    return t(`exerciseTypes.${type}` as Parameters<typeof t>[0]);
  } catch {
    return type;
  }
}
