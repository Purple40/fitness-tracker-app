'use client';

import {
  BarChart,
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
import { NutritionLog, MacroTarget } from '@/types';
import { formatDateShort } from '@/lib/utils';

interface NutritionChartProps {
  logs: NutritionLog[];
  macroTargets: MacroTarget;
}

export function NutritionChart({ logs, macroTargets }: NutritionChartProps) {
  const data = logs
    .slice(0, 14)
    .reverse()
    .map((log) => ({
      date: formatDateShort(log.date),
      protein: log.protein_consumed ?? 0,
      carbs: log.carbs_consumed ?? 0,
      fat: log.fat_consumed ?? 0,
      calories: log.calories_consumed ?? 0,
      proteinPct: log.protein_consumed
        ? Math.min(Math.round((log.protein_consumed / macroTargets.protein) * 100), 100)
        : 0,
      carbsPct: log.carbs_consumed
        ? Math.min(Math.round((log.carbs_consumed / macroTargets.carbs) * 100), 100)
        : 0,
      fatPct: log.fat_consumed
        ? Math.min(Math.round((log.fat_consumed / macroTargets.fat) * 100), 100)
        : 0,
    }));

  if (data.length === 0) {
    return (
      <Card className="mt-2">
        <CardContent className="p-6 text-center text-muted-foreground">
          No nutrition data to display yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 mt-2">
      {/* Macro Compliance Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Macro Compliance % (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === 'proteinPct' ? 'Protein' : name === 'carbsPct' ? 'Carbs' : 'Fat',
                ]}
              />
              <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 2" />
              <Bar dataKey="proteinPct" name="Protein" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="carbsPct" name="Carbs" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="fatPct" name="Fat" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Calories Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Daily Calories</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={160}>
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
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value} kcal`, 'Calories']}
              />
              <ReferenceLine
                y={macroTargets.calories}
                stroke="#f97316"
                strokeDasharray="4 2"
                label={{ value: 'target', position: 'right', fontSize: 10, fill: '#f97316' }}
              />
              <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
