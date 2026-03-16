import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// DATE UTILITIES
// ============================================================

export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'MMM d');
}

export function formatDateInput(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function getTodayString(): string {
  return formatDateInput(new Date());
}

export function getWeekDates(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getWeekLabel(date: Date = new Date()): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
}

// ============================================================
// NUMBER UTILITIES
// ============================================================

export function roundToOne(num: number): number {
  return Math.round(num * 10) / 10;
}

export function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

export function safeParseFloat(value: string): number | null {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

export function safeParseInt(value: string): number | null {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

// ============================================================
// MACRO UTILITIES
// ============================================================

export function calculateMacroPercentage(consumed: number | null, target: number): number {
  if (!consumed || target === 0) return 0;
  return Math.min(Math.round((consumed / target) * 100), 100);
}

export function calculateCaloriesFromMacros(
  protein: number,
  carbs: number,
  fat: number
): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

// ============================================================
// WEIGHT UTILITIES
// ============================================================

export function calculateWeeklyAverage(weights: number[]): number {
  if (weights.length === 0) return 0;
  const sum = weights.reduce((acc, w) => acc + w, 0);
  return roundToOne(sum / weights.length);
}

export function calculateWeeklyMin(weights: number[]): number {
  if (weights.length === 0) return 0;
  return Math.min(...weights);
}

export function calculateWeeklyMax(weights: number[]): number {
  if (weights.length === 0) return 0;
  return Math.max(...weights);
}

// ============================================================
// WORKOUT UTILITIES
// ============================================================

export function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getMuscleGroupColor(muscleGroup: string): string {
  const colors: Record<string, string> = {
    Chest: '#ef4444',
    Back: '#3b82f6',
    Shoulders: '#8b5cf6',
    Biceps: '#f59e0b',
    Triceps: '#f97316',
    Legs: '#10b981',
    Glutes: '#ec4899',
    Core: '#06b6d4',
    Calves: '#84cc16',
    'Full Body': '#6366f1',
    Cardio: '#14b8a6',
  };
  return colors[muscleGroup] || '#6b7280';
}

// ============================================================
// RECOVERY UTILITIES
// ============================================================

export function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Moderate',
    4: 'High',
    5: 'Very High',
  };
  return labels[rating] || 'Unknown';
}

export function getRatingColor(rating: number): string {
  if (rating <= 1) return 'text-red-500';
  if (rating <= 2) return 'text-orange-500';
  if (rating <= 3) return 'text-yellow-500';
  if (rating <= 4) return 'text-lime-500';
  return 'text-green-500';
}

// ============================================================
// CHART UTILITIES
// ============================================================

export function generateChartColors(count: number): string[] {
  const baseColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#f59e0b', '#10b981', '#14b8a6',
    '#3b82f6', '#06b6d4', '#84cc16', '#a855f7',
  ];
  return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
}
