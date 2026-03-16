'use client';

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
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BodyMetric, WeeklyBodyStats } from '@/types';
import { formatDateShort } from '@/lib/utils';

interface WeightChartProps {
  metrics: BodyMetric[];
  weeklyStats: WeeklyBodyStats[];
}

export function WeightChart({ metrics, weeklyStats }: WeightChartProps) {
  // Prepare daily data (last 30 entries)
  const dailyData = metrics
    .slice(0, 30)
    .reverse()
    .map((m) => ({
      date: formatDateShort(m.date),
      weight: m.weight_fasted,
    }))
    .filter((d) => d.weight !== null);

  // Prepare weekly average data
  const weeklyData = weeklyStats.slice(-8).map((w) => ({
    week: formatDateShort(w.week),
    avg: w.avg_weight,
    min: w.min_weight,
    max: w.max_weight,
  }));

  if (dailyData.length === 0) {
    return (
      <Card className="mt-2">
        <CardContent className="p-6 text-center text-muted-foreground">
          No weight data to display yet.
        </CardContent>
      </Card>
    );
  }

  // Calculate Y axis domain with padding
  const weights = dailyData.map((d) => d.weight as number);
  const minWeight = Math.min(...weights) - 1;
  const maxWeight = Math.max(...weights) + 1;

  return (
    <div className="space-y-3 mt-2">
      {/* Daily Weight Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Daily Weight (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minWeight, maxWeight]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value} kg`, 'Weight']}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Average Chart */}
      {weeklyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weekly Averages</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} kg`,
                    name === 'avg' ? 'Average' : name === 'min' ? 'Min' : 'Max',
                  ]}
                />
                <Bar dataKey="avg" fill="hsl(var(--primary))" opacity={0.8} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="min" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
