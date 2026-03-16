'use client';

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useBodyMetrics } from '@/lib/hooks/useBodyMetrics';
import { toast } from '@/lib/hooks/useToast';
import { getTodayString, safeParseFloat, safeParseInt } from '@/lib/utils';

interface LogWeightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialDate?: string;
}

export function LogWeightDialog({
  open,
  onOpenChange,
  onSuccess,
  initialDate,
}: LogWeightDialogProps) {
  const [date, setDate] = useState(initialDate || getTodayString());
  const [weight, setWeight] = useState('');
  const [steps, setSteps] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { upsertMetric } = useBodyMetrics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight && !steps) {
      toast({
        title: 'Nothing to save',
        description: 'Please enter at least weight or steps.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await upsertMetric({
      date,
      weight_fasted: safeParseFloat(weight),
      steps: safeParseInt(steps),
      note: note || null,
    });

    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: 'Body metrics logged successfully.' });
      setWeight('');
      setSteps('');
      setNote('');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Log Body Metrics</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getTodayString()}
            />
          </div>
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
              className="text-lg"
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
              className="text-lg"
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
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
