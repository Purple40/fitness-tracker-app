'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, CheckCircle2 } from 'lucide-react';
import { useBodyMetrics } from '@/lib/hooks/useBodyMetrics';
import { toast } from '@/lib/hooks/useToast';
import { getTodayString, safeParseFloat, safeParseInt, formatDate } from '@/lib/utils';

interface LogWeightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LogWeightDialog({
  open,
  onOpenChange,
  onSuccess,
}: LogWeightDialogProps) {
  // Always log for today — no date picker needed
  const today = getTodayString();
  const [weight, setWeight] = useState('');
  const [steps, setSteps] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { upsertMetric, metrics } = useBodyMetrics();

  // Pre-fill with existing today's data if available
  useEffect(() => {
    if (open) {
      const todayMetric = metrics.find((m) => m.date === today);
      if (todayMetric) {
        setWeight(todayMetric.weight_fasted?.toString() || '');
        setSteps(todayMetric.steps?.toString() || '');
        setNote(todayMetric.note || '');
      } else {
        setWeight('');
        setSteps('');
        setNote('');
      }
    }
  }, [open, metrics, today]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight && !steps) {
      toast({
        title: 'Nothing to save',
        description: 'Enter at least weight or steps.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await upsertMetric({
      date: today,
      weight_fasted: safeParseFloat(weight),
      steps: safeParseInt(steps),
      note: note || null,
    });

    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({
        title: '✓ Saved!',
        description: `Body metrics logged for today.`,
        variant: 'success',
      });
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Log Body Metrics
          </DialogTitle>
        </DialogHeader>

        {/* Today's date — shown as label, not editable */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Today — {formatDate(today, 'EEEE, MMMM d')}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Fasted Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="30"
              max="300"
              placeholder="e.g. 75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              inputMode="decimal"
              className="text-xl h-14 font-semibold"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">Steps</Label>
            <Input
              id="steps"
              type="number"
              min="0"
              max="100000"
              placeholder="e.g. 8500"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              inputMode="numeric"
              className="text-xl h-14 font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Any notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
