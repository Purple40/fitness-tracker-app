'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Scale, Footprints, TrendingDown, TrendingUp, Minus, Trash2 } from 'lucide-react';
import { useBodyMetrics } from '@/lib/hooks/useBodyMetrics';
import { formatDate, formatDateShort, getTodayString } from '@/lib/utils';
import { LogWeightDialog } from '@/components/body/LogWeightDialog';
import { WeightChart } from '@/components/body/WeightChart';
import { StepsChart } from '@/components/body/StepsChart';
import { BodyMetric } from '@/types';
import { toast } from '@/lib/hooks/useToast';

export default function BodyPage() {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [editingMetric, setEditingMetric] = useState<BodyMetric | null>(null);

  const { metrics, todayMetric, weeklyStats, isLoading, fetchMetrics, deleteMetric } =
    useBodyMetrics();

  const thisWeekStats = weeklyStats[weeklyStats.length - 1];
  const lastWeekStats = weeklyStats[weeklyStats.length - 2];
  const weightTrend =
    thisWeekStats && lastWeekStats
      ? thisWeekStats.avg_weight - lastWeekStats.avg_weight
      : null;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    const { error } = await deleteMetric(id);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Entry removed.' });
    }
  };

  return (
    <div className="page-enter">
      <Header
        title="Body Tracking"
        rightElement={
          <Button size="sm" onClick={() => setShowLogDialog(true)} className="gap-1 h-8">
            <Plus className="h-4 w-4" />
            Log
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Today</p>
              <p className="text-xl font-bold">
                {todayMetric?.weight_fasted ? `${todayMetric.weight_fasted}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Week Avg</p>
              <p className="text-xl font-bold">
                {thisWeekStats?.avg_weight || '—'}
              </p>
              <p className="text-xs text-muted-foreground">kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Trend</p>
              <div className="flex items-center justify-center gap-1">
                {weightTrend !== null ? (
                  <>
                    {weightTrend < 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : weightTrend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-400" />
                    )}
                    <span
                      className={`text-xl font-bold ${
                        weightTrend < 0
                          ? 'text-green-600'
                          : weightTrend > 0
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {weightTrend > 0 ? '+' : ''}
                      {weightTrend.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-muted-foreground">—</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">kg/week</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Stats */}
        {thisWeekStats && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">This Week</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold">{thisWeekStats.avg_weight}</p>
                  <p className="text-xs text-muted-foreground">Average</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{thisWeekStats.min_weight}</p>
                  <p className="text-xs text-muted-foreground">Min</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-500">{thisWeekStats.max_weight}</p>
                  <p className="text-xs text-muted-foreground">Max</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <Tabs defaultValue="weight">
          <TabsList className="w-full">
            <TabsTrigger value="weight" className="flex-1">
              <Scale className="h-4 w-4 mr-1" /> Weight
            </TabsTrigger>
            <TabsTrigger value="steps" className="flex-1">
              <Footprints className="h-4 w-4 mr-1" /> Steps
            </TabsTrigger>
          </TabsList>
          <TabsContent value="weight">
            <WeightChart metrics={metrics} weeklyStats={weeklyStats} />
          </TabsContent>
          <TabsContent value="steps">
            <StepsChart metrics={metrics} />
          </TabsContent>
        </Tabs>

        {/* History */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            History
          </h3>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : metrics.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Scale className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No entries yet</p>
                <Button
                  className="mt-3"
                  onClick={() => setShowLogDialog(true)}
                >
                  Log your first entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {metrics.map((metric) => (
                <Card key={metric.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">
                              {formatDate(metric.date, 'EEE, MMM d')}
                            </p>
                            {metric.date === getTodayString() && (
                              <Badge variant="secondary" className="text-xs py-0">
                                Today
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {metric.weight_fasted && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Scale className="h-3 w-3" />
                                {metric.weight_fasted}kg
                              </span>
                            )}
                            {metric.steps && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Footprints className="h-3 w-3" />
                                {metric.steps.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {metric.note && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              {metric.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(metric.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <LogWeightDialog
        open={showLogDialog}
        onOpenChange={setShowLogDialog}
        onSuccess={() => fetchMetrics()}
      />
    </div>
  );
}
