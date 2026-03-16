'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { PersonalRecord } from '@/types';
import { formatDate } from '@/lib/utils';

interface PRListProps {
  records: PersonalRecord[];
}

export function PRList({ records }: PRListProps) {
  // Group by exercise
  const grouped = records.reduce<Record<string, PersonalRecord[]>>((acc, pr) => {
    const name = pr.exercise?.name || pr.exercise_id;
    if (!acc[name]) acc[name] = [];
    acc[name].push(pr);
    return acc;
  }, {});

  const getRecordLabel = (type: string, value: number) => {
    switch (type) {
      case 'max_weight':
        return `${value} kg`;
      case 'max_reps':
        return `${value} reps`;
      case 'max_volume':
        return `${value} kg vol`;
      default:
        return `${value}`;
    }
  };

  const getRecordBadgeColor = (type: string) => {
    switch (type) {
      case 'max_weight':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'max_reps':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'max_volume':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return '';
    }
  };

  const getRecordTypeName = (type: string) => {
    switch (type) {
      case 'max_weight': return 'Max Weight';
      case 'max_reps': return 'Max Reps';
      case 'max_volume': return 'Max Volume';
      default: return type;
    }
  };

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([exerciseName, prs]) => (
        <Card key={exerciseName}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold text-sm">{exerciseName}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {prs[0]?.exercise?.muscle_group}
              </span>
            </div>
            <div className="space-y-2">
              {prs.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRecordBadgeColor(pr.record_type)}`}
                    >
                      {getRecordTypeName(pr.record_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">
                      {getRecordLabel(pr.record_type, pr.value)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(pr.date, 'MMM d')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
