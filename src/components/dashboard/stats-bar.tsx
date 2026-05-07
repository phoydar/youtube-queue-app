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
      <div className="cw-stats">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="cw-stat">
            <div className="cw-skel" style={{ height: 24, width: 60 }} />
            <span className="lbl" style={{ visibility: 'hidden' }}>—</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="cw-stats">
      <div className="cw-stat">
        <span className="num">{stats.totalVideos}</span>
        <span className="lbl">Clips</span>
      </div>
      <div className="cw-stat">
        <span className="num ember">{stats.unwatchedCount}</span>
        <span className="lbl">Unwatched</span>
      </div>
      <div className="cw-stat">
        <span className="num">{stats.watchedThisWeek}</span>
        <span className="lbl">This week</span>
      </div>
      <div className="cw-stat">
        <span className="num">
          {stats.oldestUnwatchedDays !== null ? (
            <>
              {stats.oldestUnwatchedDays}
              <small>d</small>
            </>
          ) : (
            '—'
          )}
        </span>
        <span className="lbl">Oldest unread</span>
      </div>
    </div>
  );
}
