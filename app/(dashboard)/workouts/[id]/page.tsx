'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Trophy,
  X,
  Edit2,
  Eye,
} from 'lucide-react';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { useWorkoutStore, ActiveSet } from '@/store/workoutStore';
import { ExerciseSelector } from '@/components/workouts/ExerciseSelector';
import { PRNotificationBanner } from '@/components/workouts/PRNotificationBanner';
import { formatDuration, getMuscleGroupColor } from '@/lib/utils';
import { WorkoutExercise, WorkoutSet, WorkoutSession } from '@/types';
import { toast } from '@/lib/hooks/useToast';

const emptySetInput: ActiveSet = {
  weight: '',
  reps_done: '',
  rir_done: '',
  reps_target: '',
  rir_target: '',
};

export default function WorkoutSessionPage() {
  const t = useTranslations('workouts');
  const tCommon = useTranslations('common');

  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // ── Local state for completed sessions ──────────────────────────────────
  const [sessionData, setSessionData] = useState<WorkoutSession | null>(null);
  const [localExercises, setLocalExercises] = useState<WorkoutExercise[]>([]);
  const [localSetInputs, setLocalSetInputs] = useState<Record<string, ActiveSet>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // ── Shared UI state ──────────────────────────────────────────────────────
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const {
    fetchSessionById,
    addExerciseToSession,
    addSetToExercise,
    deleteSet,
    deleteExerciseFromSession,
    finishSession,
  } = useWorkouts();

  const {
    activeSession,
    activeExercises,
    isWorkoutActive,
    workoutStartTime,
    startSession,
    addExercise,
    addSet,
    removeSet,
    removeExercise,
    activeSetInputs,
    updateSetInput,
    resetSetInput,
    prNotifications,
    dismissPRNotification,
    endSession,
  } = useWorkoutStore();

  // A session is "completed" when it has a duration saved
  const isCompleted =
    sessionData !== null &&
    sessionData.duration !== null &&
    sessionData.duration !== undefined;

  // ── Load session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      setPageLoading(true);
      const { data } = await fetchSessionById(sessionId);

      if (data) {
        setSessionData(data as WorkoutSession);
        const completed =
          (data as WorkoutSession).duration !== null &&
          (data as WorkoutSession).duration !== undefined;

        if (completed) {
          // ── Completed session: use local state, never touch the store ──
          const exList = ((data as WorkoutSession).exercises || []) as WorkoutExercise[];
          setLocalExercises(exList);
          setExpandedExercises(new Set(exList.map((e) => e.id)));
          const inputs: Record<string, ActiveSet> = {};
          exList.forEach((e) => {
            inputs[e.id] = { ...emptySetInput };
          });
          setLocalSetInputs(inputs);
        } else {
          // ── Active session: use workout store ──
          if (!isWorkoutActive || activeSession?.id !== sessionId) {
            startSession(data as WorkoutSession);
          }
          const exList =
            isWorkoutActive && activeSession?.id === sessionId
              ? activeExercises
              : (((data as WorkoutSession).exercises || []) as WorkoutExercise[]);
          setExpandedExercises(new Set(exList.map((e) => e.id)));
        }
      }
      setPageLoading(false);
    };
    loadSession();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer — only for active sessions ────────────────────────────────────
  useEffect(() => {
    if (isCompleted || !isWorkoutActive || !workoutStartTime) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - workoutStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, isWorkoutActive, workoutStartTime]);

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleExercise = (id: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Which data to display
  const displayExercises = isCompleted ? localExercises : activeExercises;
  const displaySetInputs = isCompleted ? localSetInputs : activeSetInputs;
  const canEdit = !isCompleted || isEditMode;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAddExercise = async (exerciseId: string) => {
    const { data, error } = await addExerciseToSession(
      sessionId,
      exerciseId,
      displayExercises.length
    );
    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else if (data) {
      if (isCompleted) {
        const newEx = { ...data, sets: [] } as WorkoutExercise;
        setLocalExercises((prev) => [...prev, newEx]);
        setLocalSetInputs((prev) => ({ ...prev, [data.id]: { ...emptySetInput } }));
      } else {
        addExercise(data);
      }
      setExpandedExercises((prev) => new Set([...prev, data.id]));
      setShowExerciseSelector(false);
    }
  };

  const handleAddSet = async (workoutExercise: WorkoutExercise) => {
    const input = displaySetInputs[workoutExercise.id];
    if (!input?.weight && !input?.reps_done) {
      toast({ title: t('enterWeightReps'), variant: 'destructive' });
      return;
    }

    const setNumber = (workoutExercise.sets?.length || 0) + 1;
    const { data, error } = await addSetToExercise(workoutExercise.id, {
      set_number: setNumber,
      weight: input.weight ? parseFloat(input.weight) : null,
      reps_done: input.reps_done ? parseInt(input.reps_done) : null,
      rir_done: input.rir_done ? parseInt(input.rir_done) : null,
      reps_target: input.reps_target ? parseInt(input.reps_target) : null,
      rir_target: input.rir_target ? parseInt(input.rir_target) : null,
    });

    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else if (data) {
      if (isCompleted) {
        setLocalExercises((prev) =>
          prev.map((ex) =>
            ex.id === workoutExercise.id
              ? { ...ex, sets: [...(ex.sets || []), data] }
              : ex
          )
        );
        setLocalSetInputs((prev) => ({
          ...prev,
          [workoutExercise.id]: { ...emptySetInput },
        }));
      } else {
        addSet(workoutExercise.id, data);
        resetSetInput(workoutExercise.id);
      }
    }
  };

  const handleDeleteSet = async (workoutExerciseId: string, setId: string) => {
    const { error } = await deleteSet(setId);
    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else {
      if (isCompleted) {
        setLocalExercises((prev) =>
          prev.map((ex) =>
            ex.id === workoutExerciseId
              ? { ...ex, sets: (ex.sets || []).filter((s) => s.id !== setId) }
              : ex
          )
        );
      } else {
        removeSet(workoutExerciseId, setId);
      }
    }
  };

  const handleDeleteExercise = async (workoutExerciseId: string) => {
    if (!confirm(t('removeExercise'))) return;
    const { error } = await deleteExerciseFromSession(workoutExerciseId);
    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else {
      if (isCompleted) {
        setLocalExercises((prev) => prev.filter((e) => e.id !== workoutExerciseId));
      } else {
        removeExercise(workoutExerciseId);
      }
    }
  };

  const handleFinishWorkout = async () => {
    setIsSaving(true);
    const durationMinutes = Math.floor(elapsedTime / 60);
    const { error } = await finishSession(sessionId, durationMinutes);
    setIsSaving(false);

    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else {
      endSession();
      toast({
        title: t('finishSuccess'),
        description: `${t('finishDesc')} ${formatDuration(durationMinutes)}`,
      });
      router.push('/workouts');
    }
  };

  const updateLocalSetInput = (
    exerciseId: string,
    field: keyof ActiveSet,
    value: string
  ) => {
    setLocalSetInputs((prev) => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] || emptySetInput), [field]: value },
    }));
  };

  const totalSets = displayExercises.reduce(
    (acc, ex) => acc + (ex.sets?.length || 0),
    0
  );

  // ── Loading state ────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-enter min-h-screen">
      {/* PR Notifications (active sessions only) */}
      {!isCompleted &&
        prNotifications.map((pr, i) => (
          <PRNotificationBanner
            key={i}
            notification={pr}
            onDismiss={() => dismissPRNotification(i)}
          />
        ))}

      <Header
        title={
          sessionData
            ? `${t('session')} #${sessionData.session_number}`
            : t('title')
        }
        showBack
        rightElement={
          <div className="flex items-center gap-2">
            {/* Timer — active sessions */}
            {!isCompleted && isWorkoutActive && (
              <div className="flex items-center gap-1 text-sm font-mono bg-primary/10 px-2 py-1 rounded-md">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-semibold">
                  {formatElapsed(elapsedTime)}
                </span>
              </div>
            )}
            {/* Edit / View toggle — completed sessions */}
            {isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-8 px-2"
                onClick={() => setIsEditMode((v) => !v)}
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    {t('viewMode')}
                  </>
                ) : (
                  <>
                    <Edit2 className="h-3.5 w-3.5" />
                    {t('editMode')}
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />

      <div className="p-4 space-y-4 pb-32">
        {/* ── Session Stats ── */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{displayExercises.length}</p>
              <p className="text-xs text-muted-foreground">{t('exercises')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{totalSets}</p>
              <p className="text-xs text-muted-foreground">{tCommon('sets')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              {isCompleted ? (
                <>
                  <p className="text-xl font-bold font-mono">
                    {sessionData?.duration
                      ? formatDuration(sessionData.duration)
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('duration')}</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold font-mono">
                    {formatElapsed(elapsedTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('timer')}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Completed badge ── */}
        {isCompleted && (
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">
              {t('completedOn')} · {sessionData?.date}
            </span>
            {isEditMode && (
              <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                {t('editingSession')}
              </span>
            )}
          </div>
        )}

        {/* ── Exercises ── */}
        {displayExercises.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">{t('noExercises')}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('noExercisesDesc')}
              </p>
              {canEdit && (
                <Button
                  onClick={() => setShowExerciseSelector(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('addExercise')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayExercises.map((workoutExercise) => (
              <ExerciseCard
                key={workoutExercise.id}
                workoutExercise={workoutExercise}
                isExpanded={expandedExercises.has(workoutExercise.id)}
                onToggle={() => toggleExercise(workoutExercise.id)}
                onAddSet={() => handleAddSet(workoutExercise)}
                onDeleteSet={(setId) =>
                  handleDeleteSet(workoutExercise.id, setId)
                }
                onDeleteExercise={() =>
                  handleDeleteExercise(workoutExercise.id)
                }
                setInput={
                  displaySetInputs[workoutExercise.id] || emptySetInput
                }
                onInputChange={(field, value) => {
                  if (isCompleted) {
                    updateLocalSetInput(workoutExercise.id, field, value);
                  } else {
                    updateSetInput(workoutExercise.id, field, value);
                  }
                }}
                tWorkouts={t}
                tCommon={tCommon}
                readOnly={isCompleted && !isEditMode}
              />
            ))}
          </div>
        )}

        {/* ── Add Exercise button (active or edit mode) ── */}
        {canEdit && (
          <Button
            variant="outline"
            className="w-full gap-2 border-dashed"
            onClick={() => setShowExerciseSelector(true)}
          >
            <Plus className="h-4 w-4" />
            {t('addExercise')}
          </Button>
        )}
      </div>

      {/* ── Finish Workout — active sessions only ── */}
      {!isCompleted && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t max-w-lg mx-auto">
          <Button
            className="w-full h-12 gap-2 text-base"
            onClick={handleFinishWorkout}
            disabled={isSaving}
          >
            {isSaving ? (
              tCommon('saving')
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                {t('finishWorkout')}
              </>
            )}
          </Button>
        </div>
      )}

      {/* ── Exercise Selector ── */}
      <ExerciseSelector
        open={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelect={handleAddExercise}
        excludeIds={displayExercises.map((e) => e.exercise_id)}
      />
    </div>
  );
}

// ============================================================
// EXERCISE CARD COMPONENT
// ============================================================
interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  isExpanded: boolean;
  onToggle: () => void;
  onAddSet: () => void;
  onDeleteSet: (setId: string) => void;
  onDeleteExercise: () => void;
  setInput: ActiveSet;
  onInputChange: (field: keyof ActiveSet, value: string) => void;
  tWorkouts: (key: string) => string;
  tCommon: (key: string) => string;
  readOnly?: boolean;
}

function ExerciseCard({
  workoutExercise,
  isExpanded,
  onToggle,
  onAddSet,
  onDeleteSet,
  onDeleteExercise,
  setInput,
  onInputChange,
  tWorkouts,
  tCommon,
  readOnly = false,
}: ExerciseCardProps) {
  const exercise = workoutExercise.exercise;
  const sets = workoutExercise.sets || [];
  const muscleColor = getMuscleGroupColor(exercise?.muscle_group || '');

  return (
    <Card className="overflow-hidden">
      {/* Exercise Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer active:bg-accent/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: muscleColor }}
          />
          <div>
            <p className="font-semibold text-sm">{exercise?.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {exercise?.muscle_group}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {sets.length} {tCommon('sets')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteExercise();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t">
          {/* Logged Sets Table */}
          {sets.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <div className="grid grid-cols-12 gap-1 text-xs text-muted-foreground mb-2 px-1">
                <span className="col-span-1">#</span>
                <span className="col-span-3">{tWorkouts('weight')}</span>
                <span className="col-span-3">{tWorkouts('reps')}</span>
                <span className="col-span-3">{tWorkouts('rir')}</span>
                <span className="col-span-2" />
              </div>
              <div className="space-y-1.5">
                {sets.map((set) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    onDelete={() => onDeleteSet(set.id)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Set Input — hidden in read-only mode */}
          {!readOnly && (
            <div className="p-4 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                {tWorkouts('logSet')} {sets.length + 1}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <Label className="text-xs mb-1 block">{tWorkouts('weight')}</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={setInput.weight || ''}
                    onChange={(e) => onInputChange('weight', e.target.value)}
                    inputMode="decimal"
                    className="text-center text-lg font-bold h-12"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">{tWorkouts('reps')}</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={setInput.reps_done || ''}
                    onChange={(e) => onInputChange('reps_done', e.target.value)}
                    inputMode="numeric"
                    className="text-center text-lg font-bold h-12"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">{tWorkouts('rir')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="0"
                    value={setInput.rir_done || ''}
                    onChange={(e) => onInputChange('rir_done', e.target.value)}
                    inputMode="numeric"
                    className="text-center text-lg font-bold h-12"
                  />
                </div>
              </div>
              <Button className="w-full gap-2" onClick={onAddSet}>
                <Plus className="h-4 w-4" />
                {tWorkouts('addSet')}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// SET ROW COMPONENT
// ============================================================
function SetRow({
  set,
  onDelete,
  readOnly = false,
}: {
  set: WorkoutSet;
  onDelete: () => void;
  readOnly?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-12 gap-1 items-center py-1.5 px-1 rounded-md ${
        set.is_pr ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''
      }`}
    >
      <span className="col-span-1 text-xs text-muted-foreground font-medium">
        {set.set_number}
      </span>
      <span className="col-span-3 text-sm font-semibold">
        {set.weight ? `${set.weight}kg` : '—'}
      </span>
      <span className="col-span-3 text-sm font-semibold">
        {set.reps_done ?? '—'}
        {set.reps_target && (
          <span className="text-xs text-muted-foreground">
            /{set.reps_target}
          </span>
        )}
      </span>
      <span className="col-span-3 text-sm font-semibold">
        {set.rir_done !== null && set.rir_done !== undefined ? set.rir_done : '—'}
        {set.rir_target !== null && set.rir_target !== undefined && (
          <span className="text-xs text-muted-foreground">
            /{set.rir_target}
          </span>
        )}
      </span>
      <div className="col-span-2 flex items-center justify-end gap-1">
        {set.is_pr && <Trophy className="h-3.5 w-3.5 text-yellow-500" />}
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
