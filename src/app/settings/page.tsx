'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagBadge } from '@/components/tags/tag-badge';

interface Playlist {
  id: string;
  youtubePlaylistId: string;
  title: string;
  lastSyncedAt: string | null;
  videoCount: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  videoCount: number;
}

export default function SettingsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newPlaylistId, setNewPlaylistId] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#e09f3e');
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [playlistRes, tagRes] = await Promise.all([
      fetch('/api/playlists'),
      fetch('/api/tags'),
    ]);
    setPlaylists(await playlistRes.json());
    setTags(await tagRes.json());
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addPlaylist() {
    if (!newPlaylistId.trim()) return;
    setAddingPlaylist(true);
    setError(null);

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubePlaylistId: newPlaylistId.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add playlist');
      }

      setNewPlaylistId('');
      fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add playlist');
    } finally {
      setAddingPlaylist(false);
    }
  }

  async function removePlaylist(id: string) {
    await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    fetchData();
  }

  async function syncPlaylist(id: string) {
    await fetch(`/api/playlists/${id}/sync`, { method: 'POST' });
    fetchData();
  }

  async function addTag() {
    if (!newTagName.trim()) return;

    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
    });

    if (res.ok) {
      setNewTagName('');
      fetchData();
    }
  }

  async function removeTag(id: string) {
    await fetch(`/api/tags/${id}`, { method: 'DELETE' });
    fetchData();
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-lg font-semibold text-foreground">Settings</h2>

      {/* Playlists */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Playlists</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlaylistId}
            onChange={(e) => setNewPlaylistId(e.target.value)}
            placeholder="YouTube Playlist ID"
            className="flex-1 border-0 border-b border-border bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && addPlaylist()}
          />
          <button
            onClick={addPlaylist}
            disabled={addingPlaylist}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80',
              addingPlaylist && 'cursor-not-allowed opacity-60'
            )}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}

        {playlists.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No playlists added yet.
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{pl.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {pl.videoCount} videos
                    {pl.lastSyncedAt && ` \u00b7 Synced ${new Date(pl.lastSyncedAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => syncPlaylist(pl.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    title="Sync"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removePlaylist(pl.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tags */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tags</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 border-0 border-b border-border bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
          />
          <button
            onClick={addTag}
            className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-1">
                <TagBadge name={`${tag.name} (${tag.videoCount})`} color={tag.color} />
                <button
                  onClick={() => removeTag(tag.id)}
                  className="text-muted-foreground/50 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
