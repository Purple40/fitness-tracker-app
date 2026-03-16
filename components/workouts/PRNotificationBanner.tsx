'use client';

import { Trophy, X } from 'lucide-react';
import { PRNotification } from '@/types';

interface PRNotificationBannerProps {
  notification: PRNotification;
  onDismiss: () => void;
}

export function PRNotificationBanner({ notification, onDismiss }: PRNotificationBannerProps) {
  const getLabel = () => {
    switch (notification.record_type) {
      case 'max_weight':
        return `New weight PR: ${notification.value}kg`;
      case 'max_reps':
        return `New reps PR: ${notification.value} reps`;
      case 'max_volume':
        return `New volume PR: ${notification.value}kg`;
      default:
        return `New PR: ${notification.value}`;
    }
  };

  return (
    <div className="fixed top-14 left-0 right-0 z-50 px-4 pt-2 max-w-lg mx-auto animate-slide-in-from-bottom">
      <div className="flex items-center gap-3 bg-yellow-500 text-yellow-950 rounded-xl px-4 py-3 shadow-lg">
        <Trophy className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Personal Record! 🎉</p>
          <p className="text-xs font-medium truncate">
            {notification.exercise_name} — {getLabel()}
          </p>
          {notification.previous_value && (
            <p className="text-xs opacity-75">
              Previous: {notification.previous_value}kg
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-yellow-600/30 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
