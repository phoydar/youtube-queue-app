'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

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
    <>
      <span className={`cw-sync-pill ${lastSyncAt ? '' : 'never'}`}>
        <span className="dot" />
        <span>{lastSyncAt ? `Synced ${timeAgo(lastSyncAt)}` : 'Never synced'}</span>
      </span>
      <button className="cw-btn-ghost" onClick={handleSync} disabled={syncing}>
        <RefreshCw size={11} className={syncing ? 'cw-spin' : ''} />
        {syncing ? 'Syncing' : 'Sync'}
      </button>
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
    </>
  );
}
