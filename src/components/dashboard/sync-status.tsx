'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

interface SyncStatusProps {
  lastSyncAt: Date | string | null;
  onSyncComplete?: () => void;
}

export function SyncStatus({ lastSyncAt, onSyncComplete }: SyncStatusProps) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sync failed');
      }
      onSyncComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-muted-foreground/60">
        {lastSyncAt ? `Synced ${timeAgo(lastSyncAt)}` : 'Never synced'}
      </span>
      <button
        onClick={handleSync}
        disabled={syncing}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          syncing && 'cursor-not-allowed opacity-60'
        )}
      >
        <RefreshCw className={cn('h-3 w-3', syncing && 'animate-spin')} />
        {syncing ? 'Syncing' : 'Sync'}
      </button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  );
}
