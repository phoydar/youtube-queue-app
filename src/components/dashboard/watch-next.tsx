'use client';

import { useCallback, useEffect, useState } from 'react';
import { VideoCard } from '@/components/video/video-card';
import { TagFilter } from '@/components/tags/tag-filter';
import { PlaylistFilter } from './playlist-filter';
import { SearchBar } from './search-bar';
import { BulkActions } from './bulk-actions';
import { SyncStatus } from './sync-status';
import { StatsBar } from './stats-bar';
import { VideoRowSkeleton } from '@/components/skeletons';
import { useDelayedFlag } from '@/lib/use-delayed-flag';
import type { WatchStatus } from '@/types';

interface VideoData {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  watched: boolean;
  watchStatus: WatchStatus;
  resumeTimestamp: number | null;
  notes: string;
  addedAt: string;
  score: number;
  tags: { id: string; name: string; color: string }[];
}

type ViewFilter = 'queue' | 'in_progress' | 'watched';

export function Dashboard() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedFlag(loading);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: 'score', limit: '50' });

      if (viewFilter === 'queue') {
        params.set('watched', 'false');
        params.set('watchStatus', 'UNWATCHED');
      } else if (viewFilter === 'in_progress') {
        params.set('watchStatus', 'IN_PROGRESS');
      } else {
        params.set('watched', 'true');
      }

      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (selectedPlaylist) params.set('playlist', selectedPlaylist);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (e) {
      console.error('Failed to fetch videos:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedTags, selectedPlaylist, viewFilter, searchQuery]);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/videos/stats');
      const data = await res.json();
      setLastSyncAt(data.lastSyncAt);
      return data.lastSyncAt;
    } catch {
      return null;
    }
  }, []);

  const autoSync = useCallback(async (lastSync: string | null) => {
    if (!lastSync) return;
    const hoursSinceSync = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync >= 6) {
      try {
        await fetch('/api/sync', { method: 'POST' });
      } catch {
        // silent fail
      }
    }
  }, []);

  useEffect(() => {
    fetchSyncStatus().then((lastSync) => {
      autoSync(lastSync).then(() => {
        fetchVideos();
        fetchSyncStatus();
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  function handleRefresh() {
    fetchVideos();
    fetchSyncStatus();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleBulkAction(action: Record<string, unknown>) {
    await fetch('/api/videos/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds: selectedIds, action }),
    });
    setSelectedIds([]);
    setBulkMode(false);
    handleRefresh();
  }

  const counts = {
    queue: videos.filter((v) => (v.watchStatus || (v.watched ? 'WATCHED' : 'UNWATCHED')) === 'UNWATCHED').length,
    in_progress: videos.filter((v) => v.watchStatus === 'IN_PROGRESS').length,
    watched: videos.filter((v) => v.watched).length,
  };

  const tabs: { key: ViewFilter; label: string }[] = [
    { key: 'queue', label: 'Queue' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'watched', label: 'Watched' },
  ];

  return (
    <>
      <div className="cw-page-head">
        <div>
          <h1>Library</h1>
          <p className="sub">A reading list, not a queue. Skim, summarize, weave together.</p>
        </div>
      </div>

      <StatsBar />

      <div className="cw-toolbar">
        <div className="row">
          <SyncStatus lastSyncAt={lastSyncAt} onSyncComplete={handleRefresh} />
          <div className="cw-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`cw-tab ${viewFilter === tab.key ? 'active' : ''}`}
                onClick={() => {
                  setViewFilter(tab.key);
                  setSelectedIds([]);
                }}
              >
                {tab.label}
                {viewFilter === tab.key ? null : null}
              </button>
            ))}
            <button
              className={`cw-tab ${bulkMode ? 'active' : ''}`}
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelectedIds([]);
              }}
              title="Bulk select"
            >
              Select
            </button>
          </div>
        </div>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="cw-filters" style={{ marginBottom: 18 }}>
        <PlaylistFilter selectedPlaylist={selectedPlaylist} onPlaylistChange={setSelectedPlaylist} />
      </div>

      <div className="cw-filters" style={{ marginBottom: 24 }}>
        <TagFilter selectedTags={selectedTags} onTagsChange={setSelectedTags} />
      </div>

      {bulkMode && (
        <BulkActions
          selectedIds={selectedIds}
          totalCount={videos.length}
          onSelectAll={() => setSelectedIds(videos.map((v) => v.id))}
          onDeselectAll={() => setSelectedIds([])}
          onAction={handleBulkAction}
          onCancel={() => {
            setBulkMode(false);
            setSelectedIds([]);
          }}
        />
      )}

      {loading && showSkeleton ? (
        <div className="cw-videos">
          {Array.from({ length: 6 }).map((_, i) => (
            <VideoRowSkeleton key={i} />
          ))}
        </div>
      ) : loading ? null : videos.length === 0 ? (
        <div className="cw-empty">
          <p className="t">
            {searchQuery
              ? 'No matching clips'
              : viewFilter === 'watched'
              ? 'Nothing watched yet'
              : viewFilter === 'in_progress'
              ? 'Nothing in progress'
              : 'Nothing here yet'}
          </p>
          <p className="s">
            {searchQuery
              ? 'Try a different search.'
              : viewFilter === 'queue'
              ? 'Add a YouTube playlist or paste a link to begin gathering clips.'
              : 'Mark a few clips to populate this view.'}
          </p>
        </div>
      ) : (
        <div className="cw-videos">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              selectable={bulkMode}
              selected={selectedIds.includes(video.id)}
              onSelect={toggleSelect}
              onUpdate={handleRefresh}
            />
          ))}
        </div>
      )}
    </>
  );
}
