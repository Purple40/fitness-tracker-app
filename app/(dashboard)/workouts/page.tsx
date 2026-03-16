'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell,
  Plus,
  ChevronRight,
  Clock,
  Calendar,
  Play,
  Trash2,
} from 'lucide-react';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { useWorkoutStore } from '@/store/workoutStore';
import { formatDate, getTodayString, formatDuration } from '@/lib/utils';
import { toast } from '@/lib/hooks/useToast';
import Link from 'next/link';

export default function WorkoutsPage() {
  const t = useTranslations('workouts');
  const tCommon = useTranslations('common');

  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const { sessions, isLoading, createSession, deleteSession } = useWorkouts();
  const { isWorkoutActive, activeSession } = useWorkoutStore();

  const handleStartWorkout = async () => {
    setIsStarting(true);
    const today = getTodayString();
    const todaySessions = sessions.filter((s) => s.date === today);
    const sessionNumber = todaySessions.length + 1;

    const { data, error } = await createSession({
      date: today,
      session_number: sessionNumber,
      note: null,
      duration: null,
    });

    setIsStarting(false);

    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else if (data) {
      router.push(`/workouts/${data.id}`);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t('deleteSession'))) return;
    const { error } = await deleteSession(id);
    if (error) {
      toast({ title: tCommon('error'), description: error, variant: 'destructive' });
    } else {
      toast({ title: '✓ ' + t('deleteSuccess'), variant: 'success' });
    }
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce<Record<string, typeof sessions>>((acc, session) => {
    const date = session.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="page-enter">
      <Header title={t('title')} />

      <div className="p-4 space-y-4">
        {/* Active Session Banner */}
        {isWorkoutActive && activeSession && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold text-sm">{t('inProgress')}</span>
                </div>
                <Link href={`/workouts/${activeSession.id}`}>
                  <Button size="sm" className="gap-1 h-8">
                    <Play className="h-3 w-3" />
                    {t('resume')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Workout Button — always visible */}
        <Button
          className="w-full h-14 text-base gap-2"
          onClick={handleStartWorkout}
          disabled={isStarting}
        >
          <Plus className="h-5 w-5" />
          {isStarting ? tCommon('loading') : t('startNew')}
        </Button>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">{t('totalSessions')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">
                {sessions.filter((s) => {
                  const d = new Date(s.date);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return d >= weekAgo;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">{t('thisWeek')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">
                {sessions.filter((s) => s.date === getTodayString()).length}
              </p>
              <p className="text-xs text-muted-foreground">{tCommon('today')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Session History */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t('sessionHistory')}
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{tCommon('loading')}</div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-1">{t('noWorkouts')}</p>
                <p className="text-sm text-muted-foreground mb-4">{t('noWorkoutsDesc')}</p>
                <Button onClick={handleStartWorkout} disabled={isStarting}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('startFirst')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((date) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {date === getTodayString()
                        ? tCommon('today')
                        : formatDate(date, 'EEEE, MMM d')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupedSessions[date].map((session) => (
                      <Link key={session.id} href={`/workouts/${session.id}`}>
                        <Card className="hover:bg-accent/50 transition-colors active:scale-[0.99]">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">
                                    {t('session')} #{session.session_number || '—'}
                                  </span>
                                  {session.date === getTodayString() && (
                                    <Badge variant="secondary" className="text-xs py-0">
                                      {tCommon('today')}
                                    </Badge>
                                  )}
                                  {isWorkoutActive && activeSession?.id === session.id && (
                                    <Badge variant="default" className="text-xs py-0 gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                      {t('active')}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {session.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(session.duration)}
                                    </span>
                                  )}
                                  <span>
                                    {session.exercises?.length || 0} {t('exercises')}
                                  </span>
                                  <span>
                                    {session.exercises?.reduce(
                                      (acc, ex) => acc + (ex.sets?.length || 0),
                                      0
                                    ) || 0}{' '}
                                    {tCommon('sets')}
                                  </span>
                                </div>
                                {session.exercises && session.exercises.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {session.exercises.slice(0, 3).map((ex) => (
                                      <Badge
                                        key={ex.id}
                                        variant="outline"
                                        className="text-xs py-0"
                                      >
                                        {ex.exercise?.name}
                                      </Badge>
                                    ))}
                                    {session.exercises.length > 3 && (
                                      <Badge variant="outline" className="text-xs py-0">
                                        +{session.exercises.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => handleDeleteSession(session.id, e)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
