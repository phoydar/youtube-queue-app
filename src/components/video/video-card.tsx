'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ExternalLink,
  StickyNote,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { formatDuration, timeAgo } from '@/lib/utils';
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
    summary?: string | null;
    keyTopics?: string[] | null;
    aiProcessedAt?: Date | string | null;
    aiError?: string | null;
  };
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onUpdate?: () => void;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { icon: typeof ArrowUp; label: string; cls: string; next: Priority }
> = {
  HIGH: { icon: ArrowUp, label: 'High', cls: 'high', next: 'MEDIUM' },
  MEDIUM: { icon: ArrowRight, label: 'Medium', cls: 'med', next: 'LOW' },
  LOW: { icon: ArrowDown, label: 'Low', cls: 'low', next: 'HIGH' },
};

function thumbGlyphFor(title: string) {
  const words = title.split(/\s+/).filter((w) => w.length > 2);
  return (words[0] || title || '?')[0]?.toUpperCase() ?? '?';
}

export function VideoCard({ video, selectable, selected, onSelect, onUpdate }: VideoCardProps) {
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(video.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const hasSummary = Boolean(video.summary);
  const priorityCfg = PRIORITY_CONFIG[video.priority];
  const PriorityIcon = priorityCfg.icon;
  const watchStatus = video.watchStatus || (video.watched ? 'WATCHED' : 'UNWATCHED');
  const wsClass =
    watchStatus === 'IN_PROGRESS' ? 'in_progress'
    : watchStatus === 'WATCHED' ? 'watched' : 'unwatched';

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

  async function reprocessAi() {
    setReprocessing(true);
    try {
      await fetch(`/api/ai/videos/${video.id}/process?force=true`, { method: 'POST' });
      onUpdate?.();
    } finally {
      setReprocessing(false);
    }
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

  const resumePct =
    video.resumeTimestamp && video.durationSeconds
      ? Math.min(100, Math.round((video.resumeTimestamp / video.durationSeconds) * 100))
      : 0;

  const cardClass = [
    'cw-video',
    watchStatus === 'WATCHED' ? 'is-watched' : '',
    selected ? 'is-selected' : '',
    loading ? 'is-loading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className={cardClass}>
        {/* Status mark or bulk checkbox */}
        {selectable ? (
          <input
            type="checkbox"
            className="cw-check"
            checked={selected ?? false}
            onChange={() => onSelect?.(video.id)}
            aria-label={`Select ${video.title}`}
          />
        ) : (
          <button
            className={`cw-ws-mark ${wsClass}`}
            onClick={cycleWatchStatus}
            title={watchStatus.toLowerCase().replace('_', ' ')}
            aria-label={`Status: ${watchStatus}`}
          />
        )}

        {/* Thumbnail */}
        <a className="cw-thumb" href={youtubeUrl} target="_blank" rel="noopener noreferrer">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              sizes="160px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="cw-thumb-fallback">{thumbGlyphFor(video.title)}</div>
          )}
          {resumePct > 0 && watchStatus !== 'WATCHED' ? (
            <span className="resume" style={{ width: `${resumePct}%` }} />
          ) : null}
          <span className="dur">{formatDuration(video.durationSeconds)}</span>
        </a>

        {/* Body */}
        <div className="cw-body">
          <a className="cw-v-title" href={youtubeUrl} target="_blank" rel="noopener noreferrer">
            {video.title}
          </a>
          <div className="cw-v-meta">
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.channelName}</span>
            <span className="dot">·</span>
            <span>{timeAgo(video.addedAt)}</span>
            {watchStatus === 'IN_PROGRESS' ? (
              <>
                <span className="dot">·</span>
                <span className="amber">watching</span>
              </>
            ) : null}
            {hasSummary ? (
              <>
                <span className="dot">·</span>
                <span className="moss">summarized</span>
              </>
            ) : null}
            {!hasSummary && video.aiError ? (
              <>
                <span className="dot">·</span>
                <span className="danger">AI error</span>
              </>
            ) : null}
          </div>

          {video.tags && video.tags.length > 0 ? (
            <div className="cw-v-tags">
              {video.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="cw-actions">
          <button
            className={`cw-icon-btn ${priorityCfg.cls}`}
            onClick={cyclePriority}
            title={`Priority: ${priorityCfg.label}`}
            aria-label={`Priority ${priorityCfg.label}`}
          >
            <PriorityIcon size={14} strokeWidth={1.75} />
          </button>
          {hasSummary ? (
            <button
              className={`cw-icon-btn summary ${showSummary ? 'active' : ''}`}
              onClick={() => setShowSummary((s) => !s)}
              title="AI summary"
              aria-pressed={showSummary}
            >
              <Sparkles size={14} strokeWidth={1.75} />
            </button>
          ) : null}
          {!hasSummary && video.aiError ? (
            <button
              className="cw-icon-btn danger"
              onClick={reprocessAi}
              disabled={reprocessing}
              title={`AI error: ${video.aiError}`}
            >
              <RefreshCw size={14} strokeWidth={1.75} className={reprocessing ? 'cw-spin' : ''} />
            </button>
          ) : null}
          <button
            className={`cw-icon-btn ${video.notes ? 'notes-active' : ''} ${showNotes ? 'active' : ''}`}
            onClick={() => setShowNotes((s) => !s)}
            title="Notes"
            aria-pressed={showNotes}
          >
            <StickyNote size={14} strokeWidth={1.75} />
          </button>
          <a
            className="cw-icon-btn"
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in YouTube"
          >
            <ExternalLink size={14} strokeWidth={1.75} />
          </a>
          {typeof video.score === 'number' ? (
            <span className="cw-score">{Math.round(video.score)}</span>
          ) : null}
        </div>
      </div>

      {showSummary && hasSummary ? (
        <div className="cw-summary-panel">
          <div className="cw-summary-head">
            <span className="cw-summary-eyebrow">Summary</span>
            <span className="cw-summary-age">
              {video.aiProcessedAt ? `generated ${timeAgo(video.aiProcessedAt)}` : 'generated'}
            </span>
          </div>
          <p className="cw-summary-text">{video.summary}</p>
          {video.keyTopics && video.keyTopics.length > 0 ? (
            <div className="cw-summary-topics">
              {video.keyTopics.map((t, i) => {
                const c = `topic-${(i % 5) + 1}`;
                return (
                  <span
                    key={t}
                    className="cw-topic"
                    style={{
                      background: `var(--${c}-soft)`,
                      color: `var(--${c})`,
                    }}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
          ) : null}
          <div className="cw-summary-foot">
            <button className="cw-btn-ghost" onClick={reprocessAi} disabled={reprocessing}>
              <RefreshCw size={11} className={reprocessing ? 'cw-spin' : ''} />
              {reprocessing ? 'Re-processing…' : 'Re-summarize'}
            </button>
          </div>
        </div>
      ) : null}

      {showNotes ? (
        <div className="cw-notes-panel">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why you saved this, key takeaways, timestamps…"
            rows={3}
          />
          <div className="cw-notes-foot">
            <span className="count">{notes.length > 0 ? `${notes.length} chars` : ''}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cw-btn-ghost" onClick={() => setShowNotes(false)}>
                Close
              </button>
              <button className="cw-btn-primary" onClick={saveNotes} disabled={savingNotes}>
                {savingNotes ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
