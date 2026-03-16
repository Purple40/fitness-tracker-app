'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BodyMetric } from '@/types';
import { formatDateShort } from '@/lib/utils';

interface StepsChartProps {
  metrics: BodyMetric[];
}

export function StepsChart({ metrics }: StepsChartProps) {
  const data = metrics
    .slice(0, 30)
    .reverse()
    .map((m) => ({
      date: formatDateShort(m.date),
      steps: m.steps,
    }))
    .filter((d) => d.steps !== null);

  if (data.length === 0) {
    return (
      <Card className="mt-2">
        <CardContent className="p-6 text-center text-muted-foreground">
          No steps data to display yet.
        </CardContent>
      </Card>
    );
  }

  const avgSteps =
    data.reduce((sum, d) => sum + (d.steps || 0), 0) / data.length;

  return (
    <Card className="mt-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Daily Steps (last 30 days)</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Steps']}
            />
            <ReferenceLine
              y={10000}
              stroke="#10b981"
              strokeDasharray="4 2"
              label={{ value: '10k goal', position: 'right', fontSize: 10, fill: '#10b981' }}
            />
            <ReferenceLine
              y={avgSteps}
              stroke="hsl(var(--primary))"
              strokeDasharray="4 2"
              label={{ value: 'avg', position: 'right', fontSize: 10, fill: 'hsl(var(--primary))' }}
            />
            <Bar
              dataKey="steps"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-2">
          <span>Avg: {Math.round(avgSteps).toLocaleString()} steps</span>
          <span>Goal: 10,000 steps</span>
        </div>
      </CardContent>
    </Card>
  );
}
