'use client';

import { useEffect, useState } from 'react';
import type { DashboardStats } from '@/types';

export function StatsBar() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/videos/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) {
    return (
      <div className="flex gap-6 border-b border-border pb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-5 w-20 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  const items = [
    { label: 'videos', value: stats.totalVideos },
    { label: 'unwatched', value: stats.unwatchedCount },
    { label: 'this week', value: stats.watchedThisWeek },
    {
      label: 'oldest',
      value: stats.oldestUnwatchedDays !== null ? `${stats.oldestUnwatchedDays}d` : '\u2014',
    },
  ];

  return (
    <div className="flex items-baseline gap-6 border-b border-border pb-4">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-baseline gap-1.5">
          <span className={`text-lg font-semibold tabular-nums ${i === 0 ? 'text-foreground' : 'text-foreground/80'}`}>
            {item.value}
          </span>
          <span className="text-xs text-muted-foreground">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
