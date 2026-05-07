'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { RefreshCw, Copy, ExternalLink, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

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
    <>
      <div className="cw-page-head">
        <div>
          <h1>Threads</h1>
          <p className="sub">
            Loose groupings forming across your library — by theme, not algorithm. Paste a
            thread&apos;s URLs into NotebookLM to build a knowledge base.
          </p>
        </div>
        <button className="cw-btn-primary" onClick={recompute} disabled={recomputing}>
          <RefreshCw size={13} className={recomputing ? 'cw-spin' : ''} />
          {recomputing ? 'Recomputing…' : 'Recompute'}
        </button>
      </div>

      {error && <div className="cw-banner error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="cw-empty">
          <p className="s">Loading…</p>
        </div>
      ) : clusters.length === 0 ? (
        <div className="cw-empty">
          <p className="t">No threads yet</p>
          <p className="s">
            Process some videos through the AI pipeline, then click <em>Recompute</em>.
          </p>
        </div>
      ) : (
        <div className="cw-threads">
          {clusters.map((cluster) => {
            const isOpen = openId === cluster.id;
            const detail = details[cluster.id];
            return (
              <div key={cluster.id} className="cw-thread-card">
                <button className="cw-thread-head" onClick={() => toggleOpen(cluster.id)}>
                  <span className="cw-thread-count">{cluster.videoCount}</span>
                  <div className="cw-thread-body">
                    <div className="cw-thread-name">{cluster.label}</div>
                    {cluster.description && (
                      <p className="cw-thread-blurb">{cluster.description}</p>
                    )}
                    {cluster.sampleVideos.length > 0 && (
                      <div className="cw-thread-thumbs">
                        {cluster.sampleVideos.map((sv) => (
                          <div key={sv.id} className="cw-thread-thumb" title={sv.title}>
                            {sv.thumbnailUrl && (
                              <Image
                                src={sv.thumbnailUrl}
                                alt=""
                                width={56}
                                height={32}
                                style={{ objectFit: 'cover' }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp size={16} style={{ color: 'var(--fg-3)', flexShrink: 0 }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: 'var(--fg-3)', flexShrink: 0 }} />
                  )}
                </button>

                {isOpen && (
                  <div className="cw-thread-detail">
                    <div className="cw-thread-actions">
                      <button
                        className="cw-btn-primary"
                        onClick={() => copyUrlsForNotebookLM(cluster.id)}
                        disabled={!detail}
                      >
                        {copiedId === cluster.id ? (
                          <>
                            <Check size={11} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Copy URLs for NotebookLM
                          </>
                        )}
                      </button>
                      <a
                        className="cw-btn-ghost"
                        href="https://notebooklm.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={11} /> Open NotebookLM
                      </a>
                      <button className="cw-btn-ghost" disabled title="Coming soon">
                        <Sparkles size={11} /> Synthesize thread
                      </button>
                    </div>

                    {!detail ? (
                      <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: 0 }}>Loading members…</p>
                    ) : (
                      <ul className="cw-thread-clips">
                        {detail.members.map((m) => (
                          <li key={m.id} className="cw-thread-clip">
                            <a
                              className="mini-thumb"
                              href={`https://www.youtube.com/watch?v=${m.youtubeVideoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'block', textDecoration: 'none' }}
                            >
                              {m.thumbnailUrl && (
                                <Image
                                  src={m.thumbnailUrl}
                                  alt={m.title}
                                  width={96}
                                  height={54}
                                  style={{ objectFit: 'cover' }}
                                />
                              )}
                            </a>
                            <div style={{ minWidth: 0 }}>
                              <a
                                className="clip-title"
                                href={`https://www.youtube.com/watch?v=${m.youtubeVideoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {m.title}
                              </a>
                              <div className="clip-meta">
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {m.channelName}
                                </span>
                              </div>
                              {m.keyTopics && m.keyTopics.length > 0 && (
                                <div className="clip-topics">
                                  {m.keyTopics.slice(0, 5).map((t, i) => {
                                    const c = `topic-${(i % 5) + 1}`;
                                    return (
                                      <span
                                        key={t}
                                        className="cw-tag"
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
                              )}
                            </div>
                            <span className="sim">sim {m.similarity.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
