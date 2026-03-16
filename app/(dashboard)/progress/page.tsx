'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Dumbbell, BarChart3, Trophy, Camera } from 'lucide-react';
import { useProgress } from '@/lib/hooks/useProgress';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { WeightProgressChart } from '@/components/progress/WeightProgressChart';
import { StrengthChart } from '@/components/progress/StrengthChart';
import { VolumeChart } from '@/components/progress/VolumeChart';
import { PRList } from '@/components/progress/PRList';

export default function ProgressPage() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  const { weightProgress, muscleVolume, personalRecords, isLoading } = useProgress();
  const { exercises } = useWorkouts();

  // Only show exercises that have been logged
  const loggedExerciseIds = new Set(personalRecords.map((pr) => pr.exercise_id));
  const loggedExercises = exercises.filter((ex) => loggedExerciseIds.has(ex.id));

  const displayExerciseId = selectedExerciseId || loggedExercises[0]?.id || '';

  return (
    <div className="page-enter">
      <Header title="Progress" showSettings />

      <div className="p-4 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{personalRecords.length}</p>
              <p className="text-xs text-muted-foreground">Total PRs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{loggedExercises.length}</p>
              <p className="text-xs text-muted-foreground">Exercises</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{weightProgress.length}</p>
              <p className="text-xs text-muted-foreground">Weigh-ins</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="weight">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="weight" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              Weight
            </TabsTrigger>
            <TabsTrigger value="strength" className="text-xs gap-1">
              <Dumbbell className="h-3 w-3" />
              Strength
            </TabsTrigger>
            <TabsTrigger value="volume" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />
              Volume
            </TabsTrigger>
            <TabsTrigger value="prs" className="text-xs gap-1">
              <Trophy className="h-3 w-3" />
              PRs
            </TabsTrigger>
          </TabsList>

          {/* Weight Progress Tab */}
          <TabsContent value="weight" className="mt-3">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading...
                </CardContent>
              </Card>
            ) : weightProgress.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No weight data yet. Start logging your weight in the Body section.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <WeightProgressChart data={weightProgress} />
            )}
          </TabsContent>

          {/* Strength Tab */}
          <TabsContent value="strength" className="mt-3 space-y-3">
            {loggedExercises.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No workout data yet. Log some workouts to see strength progress.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Exercise Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {loggedExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExerciseId(ex.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        displayExerciseId === ex.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-accent'
                      }`}
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
                {displayExerciseId && (
                  <StrengthChart exerciseId={displayExerciseId} />
                )}
              </>
            )}
          </TabsContent>

          {/* Volume Tab */}
          <TabsContent value="volume" className="mt-3">
            {muscleVolume.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No volume data yet. Log workouts to see muscle group volume.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <VolumeChart data={muscleVolume} />
            )}
          </TabsContent>

          {/* PRs Tab */}
          <TabsContent value="prs" className="mt-3">
            {personalRecords.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No personal records yet. Keep training to set new PRs!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <PRList records={personalRecords} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
