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
import { BodyMetric } from '@/types';
import { formatDateShort } from '@/lib/utils';

interface WeightProgressChartProps {
  data: BodyMetric[];
}

export function WeightProgressChart({ data }: WeightProgressChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map((m) => ({
    date: formatDateShort(m.date),
    weight: m.weight_fasted,
  }));

  const weights = data.map((m) => m.weight_fasted).filter(Boolean) as number[];
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
  const firstWeight = weights[0];
  const lastWeight = weights[weights.length - 1];
  const change = lastWeight - firstWeight;

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Starting Weight</p>
            <p className="text-xl font-bold">{firstWeight.toFixed(1)} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Current Weight</p>
            <p className="text-xl font-bold">{lastWeight.toFixed(1)} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Change</p>
            <p className={`text-xl font-bold ${change < 0 ? 'text-green-500' : change > 0 ? 'text-red-500' : ''}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)} kg
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Average Weight</p>
            <p className="text-xl font-bold">{avgWeight.toFixed(1)} kg</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Weight Over Time</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[Math.floor(minWeight - 2), Math.ceil(maxWeight + 2)]}
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
                formatter={(value: number) => [`${value} kg`, 'Weight']}
              />
              <ReferenceLine
                y={avgWeight}
                stroke="#f97316"
                strokeDasharray="4 2"
                label={{ value: 'avg', position: 'right', fontSize: 10, fill: '#f97316' }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
