'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, X } from 'lucide-react';
import { SettingsRowSkeleton } from '@/components/skeletons';
import { useDelayedFlag } from '@/lib/use-delayed-flag';

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
  const [newTagColor, setNewTagColor] = useState('#2c5fa8');
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedFlag(loading);

  const fetchData = useCallback(async () => {
    const [playlistRes, tagRes] = await Promise.all([
      fetch('/api/playlists'),
      fetch('/api/tags'),
    ]);
    setPlaylists(await playlistRes.json());
    setTags(await tagRes.json());
    setLoading(false);
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

  function formatSynced(at: string | null) {
    if (!at) return 'never';
    return new Date(at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <>
      <div className="cw-page-head">
        <div>
          <h1>Settings</h1>
          <p className="sub">Sources, tags, and how ClipWeave syncs.</p>
        </div>
      </div>

      <div className="cw-settings">
        <section>
          <h3 className="cw-section-eyebrow">Playlists</h3>
          <div className="cw-settings-row">
            <input
              className="cw-line-input"
              value={newPlaylistId}
              onChange={(e) => setNewPlaylistId(e.target.value)}
              placeholder="YouTube playlist URL or ID"
              onKeyDown={(e) => e.key === 'Enter' && addPlaylist()}
            />
            <button className="cw-btn-ghost" onClick={addPlaylist} disabled={addingPlaylist}>
              <Plus size={12} />
              {addingPlaylist ? 'Adding…' : 'Add a source'}
            </button>
          </div>
          {error && <div className="cw-banner error" style={{ marginBottom: 12 }}>{error}</div>}

          {loading && showSkeleton ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <SettingsRowSkeleton key={i} />
              ))}
            </div>
          ) : loading ? null : playlists.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: 0 }}>
              No playlists added yet.
            </p>
          ) : (
            <div>
              {playlists.map((pl) => (
                <div key={pl.id} className="cw-source">
                  <div>
                    <div className="cw-source-name">{pl.title}</div>
                    <div className="cw-source-meta">
                      {pl.videoCount} clips · synced {formatSynced(pl.lastSyncedAt)}
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="cw-icon-btn"
                      style={{ opacity: 1 }}
                      onClick={() => syncPlaylist(pl.id)}
                      title="Sync now"
                    >
                      <RefreshCw size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      className="cw-icon-btn danger"
                      style={{ opacity: 1 }}
                      onClick={() => removePlaylist(pl.id)}
                      title="Remove"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="cw-section-eyebrow">Tags</h3>
          <div className="cw-settings-row">
            <input
              className="cw-line-input"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
            />
            <input
              className="cw-color-input"
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              title="Tag color"
            />
            <button className="cw-btn-ghost" onClick={addTag}>
              <Plus size={12} /> Add tag
            </button>
          </div>

          {tags.length > 0 ? (
            <div className="cw-tag-list">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="cw-tag-pill"
                  style={{
                    background: `${tag.color}1a`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                  <span className="ct">{tag.videoCount}</span>
                  <button
                    className="x"
                    onClick={() => removeTag(tag.id)}
                    aria-label={`Remove ${tag.name}`}
                  >
                    <X size={10} strokeWidth={2} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: 0 }}>No tags yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
