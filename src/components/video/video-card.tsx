'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  Check,
  Undo2,
  ExternalLink,
  Play,
  StickyNote,
  X,
} from 'lucide-react';
import { cn, formatDuration, timeAgo } from '@/lib/utils';
import type { Priority, WatchStatus } from '@/types';
import { TagBadge } from '@/components/tags/tag-badge';

interface VideoCardProps {
  video: {
    id: string;
    youtubeVideoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    durationSeconds: number;
    publishedAt: Date | string;
    priority: Priority;
    watched: boolean;
    watchStatus?: WatchStatus;
    resumeTimestamp?: number | null;
    notes?: string;
    addedAt: Date | string;
    score?: number;
    tags?: { id: string; name: string; color: string }[];
  };
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onUpdate?: () => void;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { icon: typeof ArrowUpCircle; label: string; color: string; next: Priority }
> = {
  HIGH: { icon: ArrowUpCircle, label: 'High', color: 'text-red-400', next: 'MEDIUM' },
  MEDIUM: { icon: ArrowRightCircle, label: 'Med', color: 'text-amber-400', next: 'LOW' },
  LOW: { icon: ArrowDownCircle, label: 'Low', color: 'text-sky-400', next: 'HIGH' },
};

export function VideoCard({ video, selectable, selected, onSelect, onUpdate }: VideoCardProps) {
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(video.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[video.priority];
  const watchStatus = video.watchStatus || (video.watched ? 'WATCHED' : 'UNWATCHED');

  async function updateVideo(data: Record<string, unknown>) {
    setLoading(true);
    try {
      await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  }

  function cyclePriority() {
    updateVideo({ priority: priorityCfg.next });
  }

  function cycleWatchStatus() {
    const cycle: Record<WatchStatus, WatchStatus> = {
      UNWATCHED: 'IN_PROGRESS',
      IN_PROGRESS: 'WATCHED',
      WATCHED: 'UNWATCHED',
    };
    updateVideo({ watchStatus: cycle[watchStatus] });
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
    } finally {
      setSavingNotes(false);
    }
  }

  const youtubeUrl = video.resumeTimestamp
    ? `https://www.youtube.com/watch?v=${video.youtubeVideoId}&t=${video.resumeTimestamp}`
    : `https://www.youtube.com/watch?v=${video.youtubeVideoId}`;

  return (
    <div
      className={cn(
        'group relative',
        watchStatus === 'WATCHED' && 'opacity-50',
        selected && 'ring-1 ring-primary/50',
        loading && 'pointer-events-none opacity-40'
      )}
    >
      <div className="flex gap-4 py-3">
        {/* Checkbox for bulk select */}
        {selectable && (
          <div className="flex flex-shrink-0 items-center pl-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect?.(video.id)}
              className="h-3.5 w-3.5 rounded border-muted-foreground/30 accent-primary"
            />
          </div>
        )}

        {/* Thumbnail */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex-shrink-0"
        >
          <div className="relative h-[72px] w-[128px] overflow-hidden rounded bg-muted">
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No thumbnail
              </div>
            )}
            <span className="absolute bottom-1 right-1 rounded-sm bg-black/75 px-1 py-px text-[10px] font-medium tabular-nums text-white">
              {formatDuration(video.durationSeconds)}
            </span>
            {watchStatus === 'IN_PROGRESS' && video.resumeTimestamp && (
              <span className="absolute bottom-1 left-1 rounded-sm bg-amber-500/90 px-1 py-px text-[10px] font-medium text-black">
                {formatDuration(video.resumeTimestamp)}
              </span>
            )}
          </div>
        </a>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-1 text-[13px] font-medium leading-snug text-foreground transition-colors hover:text-primary"
          >
            {video.title}
          </a>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="truncate">{video.channelName}</span>
            <span className="text-border">&middot;</span>
            <span className="whitespace-nowrap">{timeAgo(video.addedAt)}</span>
            {watchStatus === 'IN_PROGRESS' && (
              <>
                <span className="text-border">&middot;</span>
                <span className="text-amber-400">watching</span>
              </>
            )}
          </div>

          {/* Tags row */}
          {((video.tags && video.tags.length > 0) || video.notes) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              {video.tags && video.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
              {video.notes && !showNotes && (
                <button
                  onClick={() => setShowNotes(true)}
                  className="inline-flex items-center text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
                  title="Has notes"
                >
                  <StickyNote className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions — right side */}
        <div className="flex flex-shrink-0 items-center gap-0.5 opacity-40 transition-opacity group-hover:opacity-100">
          <button
            onClick={cyclePriority}
            title={`Priority: ${priorityCfg.label}`}
            className="rounded-md p-1.5 transition-colors hover:bg-secondary"
          >
            <priorityCfg.icon className={cn('h-4 w-4', priorityCfg.color)} />
          </button>
          <button
            onClick={cycleWatchStatus}
            title={`Status: ${watchStatus.toLowerCase().replace('_', ' ')}`}
            className="rounded-md p-1.5 transition-colors hover:bg-secondary"
          >
            {watchStatus === 'WATCHED' ? (
              <Undo2 className="h-4 w-4 text-muted-foreground" />
            ) : watchStatus === 'IN_PROGRESS' ? (
              <Play className="h-4 w-4 text-amber-400 fill-amber-400" />
            ) : (
              <Check className="h-4 w-4 text-emerald-400" />
            )}
          </button>
          <button
            onClick={() => setShowNotes(!showNotes)}
            title="Notes"
            className={cn(
              'rounded-md p-1.5 transition-colors hover:bg-secondary',
              showNotes && 'bg-secondary'
            )}
          >
            <StickyNote className={cn('h-3.5 w-3.5', video.notes ? 'text-primary' : 'text-muted-foreground')} />
          </button>
          {video.score !== undefined && (
            <span className="ml-1 min-w-[2ch] text-right text-[10px] tabular-nums text-muted-foreground/50">
              {Math.round(video.score)}
            </span>
          )}
        </div>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div className="ml-[144px] border-t border-border/50 pb-3 pt-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why you saved this, key takeaways, timestamps..."
            className="w-full resize-none rounded bg-secondary/50 p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            rows={3}
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/50">
              {notes.length > 0 ? `${notes.length} chars` : ''}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowNotes(false)}
                className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {savingNotes ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Divider between cards */}
      <div className="border-b border-border/40" />
    </div>
  );
}
