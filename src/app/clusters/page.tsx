'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { RefreshCw, Copy, ExternalLink, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SampleVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
}

interface ClusterSummary {
  id: string;
  label: string;
  description: string;
  videoCount: number;
  sampleVideos: SampleVideo[];
}

interface ClusterMember {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  summary?: string | null;
  keyTopics?: string[] | null;
  similarity: number;
}

interface ClusterDetail {
  id: string;
  label: string;
  description: string;
  videoCount: number;
  members: ClusterMember[];
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ClusterDetail>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadClusters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/clusters');
      if (!res.ok) throw new Error('Failed to load clusters');
      const data = await res.json();
      setClusters(data.clusters || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClusters();
  }, [loadClusters]);

  async function recompute() {
    setRecomputing(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/clusters/recompute', { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Recompute failed');
      }
      await loadClusters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recompute failed');
    } finally {
      setRecomputing(false);
    }
  }

  async function toggleOpen(clusterId: string) {
    if (openId === clusterId) {
      setOpenId(null);
      return;
    }
    setOpenId(clusterId);
    if (!details[clusterId]) {
      try {
        const res = await fetch(`/api/ai/clusters/${clusterId}`);
        if (!res.ok) throw new Error('Failed to load cluster');
        const data = (await res.json()) as ClusterDetail;
        setDetails((prev) => ({ ...prev, [clusterId]: data }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cluster');
      }
    }
  }

  async function copyUrlsForNotebookLM(clusterId: string) {
    const detail = details[clusterId];
    if (!detail) return;
    const urls = detail.members
      .map((m) => `https://www.youtube.com/watch?v=${m.youtubeVideoId}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(urls);
      setCopiedId(clusterId);
      setTimeout(() => setCopiedId((id) => (id === clusterId ? null : id)), 2000);
    } catch {
      setError('Clipboard write failed — copy manually from the member list.');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Clusters</h1>
          <p className="text-xs text-muted-foreground">
            Videos grouped by semantic similarity. Paste a cluster&apos;s URLs into NotebookLM
            to build a knowledge base.
          </p>
        </div>
        <button
          onClick={recompute}
          disabled={recomputing}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', recomputing && 'animate-spin')} />
          {recomputing ? 'Recomputing...' : 'Recompute clusters'}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-muted-foreground">Loading...</div>
      ) : clusters.length === 0 ? (
        <div className="rounded border border-border/60 bg-secondary/30 p-4 text-xs text-muted-foreground">
          No clusters yet. Process some videos through the AI pipeline, then click &quot;Recompute
          clusters&quot;.
        </div>
      ) : (
        <ul className="space-y-2">
          {clusters.map((cluster) => {
            const isOpen = openId === cluster.id;
            const detail = details[cluster.id];
            return (
              <li
                key={cluster.id}
                className="rounded-md border border-border/60 bg-secondary/20"
              >
                <button
                  onClick={() => toggleOpen(cluster.id)}
                  className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-secondary/40"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {cluster.label}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {cluster.videoCount}
                      </span>
                    </div>
                    {cluster.description && (
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {cluster.description}
                      </p>
                    )}
                    <div className="mt-1 flex gap-1">
                      {cluster.sampleVideos.map((sv) => (
                        <div
                          key={sv.id}
                          className="relative h-8 w-14 overflow-hidden rounded-sm bg-muted"
                          title={sv.title}
                        >
                          {sv.thumbnailUrl && (
                            <Image
                              src={sv.thumbnailUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-border/60 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <button
                        onClick={() => copyUrlsForNotebookLM(cluster.id)}
                        disabled={!detail}
                        className="inline-flex items-center gap-1.5 rounded bg-primary/90 px-2.5 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary disabled:opacity-50"
                      >
                        {copiedId === cluster.id ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy URLs for NotebookLM
                          </>
                        )}
                      </button>
                      <a
                        href="https://notebooklm.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        Open NotebookLM <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {!detail ? (
                      <div className="text-[11px] text-muted-foreground">Loading members...</div>
                    ) : (
                      <ul className="space-y-2">
                        {detail.members.map((m) => (
                          <li key={m.id} className="flex gap-3">
                            <a
                              href={`https://www.youtube.com/watch?v=${m.youtubeVideoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative h-10 w-[72px] flex-shrink-0 overflow-hidden rounded-sm bg-muted"
                            >
                              {m.thumbnailUrl && (
                                <Image
                                  src={m.thumbnailUrl}
                                  alt={m.title}
                                  fill
                                  className="object-cover"
                                  sizes="72px"
                                />
                              )}
                            </a>
                            <div className="min-w-0 flex-1">
                              <a
                                href={`https://www.youtube.com/watch?v=${m.youtubeVideoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="line-clamp-1 text-xs text-foreground hover:text-primary"
                              >
                                {m.title}
                              </a>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span className="truncate">{m.channelName}</span>
                                <span>&middot;</span>
                                <span className="tabular-nums">
                                  sim {(m.similarity * 100).toFixed(0)}%
                                </span>
                              </div>
                              {m.keyTopics && m.keyTopics.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {m.keyTopics.slice(0, 5).map((t) => (
                                    <span
                                      key={t}
                                      className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
