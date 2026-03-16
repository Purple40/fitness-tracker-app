'use client';

import { useState, useEffect, useMemo } from 'react';
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

export function ExerciseSelector({ open, onClose, onSelect, excludeIds = [] }: ExerciseSelectorProps) {
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
  }, [open]);

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

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Select Exercise</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Muscle Group Filter */}
          <div className="px-4 pt-2">
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedMuscle('All')}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedMuscle === 'All'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                All
              </button>
              {MUSCLE_GROUPS.map((mg) => (
                <button
                  key={mg}
                  onClick={() => setSelectedMuscle(mg)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedMuscle === mg
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No exercises found</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Custom
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
                        {muscleGroup}
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
                            <p className="text-xs text-muted-foreground">{exercise.exercise_type}</p>
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
              Create Custom Exercise
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
