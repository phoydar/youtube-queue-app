'use client';

import { useCallback, useEffect, useState } from 'react';
import { VideoCard } from '@/components/video/video-card';
import { TagFilter } from '@/components/tags/tag-filter';
import { PlaylistFilter } from './playlist-filter';
import { SearchBar } from './search-bar';
import { BulkActions } from './bulk-actions';
import { SyncStatus } from './sync-status';
import { StatsBar } from './stats-bar';
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
      const params = new URLSearchParams({
        sort: 'score',
        limit: '50',
      });

      if (viewFilter === 'queue') {
        params.set('watched', 'false');
        params.set('watchStatus', 'UNWATCHED');
      } else if (viewFilter === 'in_progress') {
        params.set('watchStatus', 'IN_PROGRESS');
      } else {
        params.set('watched', 'true');
      }

      if (selectedTags.length > 0) {
        params.set('tags', selectedTags.join(','));
      }
      if (selectedPlaylist) {
        params.set('playlist', selectedPlaylist);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

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

  const viewTabs: { key: ViewFilter; label: string; count?: number }[] = [
    { key: 'queue', label: 'Queue' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'watched', label: 'Watched' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <StatsBar />

      {/* Toolbar: sync + search + view tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SyncStatus lastSyncAt={lastSyncAt} onSyncComplete={handleRefresh} />
          <div className="flex items-center gap-1">
            {viewTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setViewFilter(tab.key); setSelectedIds([]); }}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewFilter === tab.key
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className="mx-1.5 h-3 w-px bg-border" />
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelectedIds([]);
              }}
              className={`px-2 py-1 text-xs font-medium transition-colors ${
                bulkMode
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Select
            </button>
          </div>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <PlaylistFilter selectedPlaylist={selectedPlaylist} onPlaylistChange={setSelectedPlaylist} />
        <TagFilter selectedTags={selectedTags} onTagsChange={setSelectedTags} />
      </div>

      {/* Bulk action bar */}
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

      {/* Video List */}
      {loading ? (
        <div className="space-y-0">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-border/40 py-3">
              <div className="h-[72px] w-[128px] animate-pulse rounded bg-muted" />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'No videos match your search.'
              : viewFilter === 'watched'
              ? 'No watched videos yet.'
              : viewFilter === 'in_progress'
              ? 'No videos in progress.'
              : 'Queue is empty. Add a playlist in Settings to get started.'}
          </p>
        </div>
      ) : (
        <div>
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
    </div>
  );
}
