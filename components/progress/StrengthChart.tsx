'use client';

import { useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProgress } from '@/lib/hooks/useProgress';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { formatDateShort } from '@/lib/utils';

interface StrengthChartProps {
  exerciseId: string;
}

export function StrengthChart({ exerciseId }: StrengthChartProps) {
  const { exerciseProgress, fetchExerciseProgress, isLoading } = useProgress();
  const { exercises } = useWorkouts();

  const exercise = exercises.find((e) => e.id === exerciseId);

  useEffect(() => {
    if (exerciseId) {
      fetchExerciseProgress(exerciseId);
    }
  }, [exerciseId]);

  const chartData = exerciseProgress.map((p) => ({
    date: formatDateShort(p.date),
    weight: p.max_weight,
    volume: Math.round(p.total_volume),
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          No data for this exercise yet.
        </CardContent>
      </Card>
    );
  }

  const maxWeight = Math.max(...exerciseProgress.map((p) => p.max_weight));
  const firstWeight = exerciseProgress[0]?.max_weight || 0;
  const lastWeight = exerciseProgress[exerciseProgress.length - 1]?.max_weight || 0;
  const change = lastWeight - firstWeight;

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Best</p>
            <p className="text-lg font-bold">{maxWeight}kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-bold">{lastWeight}kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className={`text-lg font-bold ${change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : ''}`}>
              {change > 0 ? '+' : ''}{change}kg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Max Weight Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {exercise?.name || 'Exercise'} — Max Weight (kg)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `${value}${name === 'weight' ? 'kg' : ''}`,
                  name === 'weight' ? 'Max Weight' : 'Volume',
                ]}
              />
              <Bar dataKey="volume" fill="#e2e8f0" radius={[2, 2, 0, 0]} yAxisId={0} opacity={0.4} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
