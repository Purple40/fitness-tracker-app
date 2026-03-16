'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MuscleVolumeData } from '@/types';
import { getMuscleGroupColor } from '@/lib/utils';

interface VolumeChartProps {
  data: MuscleVolumeData[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  // Get unique weeks and muscle groups
  const weeks = useMemo(() => [...new Set(data.map((d) => d.week))].sort(), [data]);
  const muscleGroups = useMemo(() => [...new Set(data.map((d) => d.muscle_group))], [data]);

  // Build chart data: one entry per week with muscle group keys
  const chartData = useMemo(() => {
    return weeks.map((week) => {
      const entry: Record<string, string | number> = {
        week: week.slice(5), // Show MM-DD
      };
      muscleGroups.forEach((mg) => {
        const found = data.find((d) => d.week === week && d.muscle_group === mg);
        entry[mg] = found?.total_sets || 0;
      });
      return entry;
    });
  }, [weeks, muscleGroups, data]);

  // Current week totals
  const latestWeek = weeks[weeks.length - 1];
  const latestWeekData = data.filter((d) => d.week === latestWeek);
  const totalSetsThisWeek = latestWeekData.reduce((acc, d) => acc + d.total_sets, 0);

  if (data.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* This Week Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">This Week — Sets per Muscle</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            {latestWeekData
              .sort((a, b) => b.total_sets - a.total_sets)
              .map((item) => (
                <div key={item.muscle_group} className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getMuscleGroupColor(item.muscle_group) }}
                  />
                  <span className="text-sm flex-1">{item.muscle_group}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.total_sets / Math.max(totalSetsThisWeek, 1)) * 100, 100)}%`,
                          backgroundColor: getMuscleGroupColor(item.muscle_group),
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{item.total_sets}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Volume Chart */}
      {weeks.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weekly Volume by Muscle Group</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                stackOffset="expand"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
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
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => [`${value} sets`, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                  iconSize={8}
                />
                {muscleGroups.map((mg) => (
                  <Bar
                    key={mg}
                    dataKey={mg}
                    stackId="a"
                    fill={getMuscleGroupColor(mg)}
                    radius={mg === muscleGroups[muscleGroups.length - 1] ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
