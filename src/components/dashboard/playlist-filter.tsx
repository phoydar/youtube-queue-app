'use client';

import { useEffect, useState } from 'react';

interface Playlist {
  id: string;
  title: string;
  videoCount: number;
}

interface PlaylistFilterProps {
  selectedPlaylist: string | null;
  onPlaylistChange: (playlistId: string | null) => void;
}

export function PlaylistFilter({ selectedPlaylist, onPlaylistChange }: PlaylistFilterProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    fetch('/api/playlists')
      .then((r) => r.json())
      .then((data) => setPlaylists(Array.isArray(data) ? data : data.data || []))
      .catch(console.error);
  }, []);

  if (playlists.length <= 1) return null;

  return (
    <>
      <span className="cw-filter-eyebrow">Sources</span>
      <button
        className={`cw-chip ${!selectedPlaylist ? 'active' : ''}`}
        onClick={() => onPlaylistChange(null)}
      >
        All
      </button>
      {playlists.map((pl) => {
        const active = selectedPlaylist === pl.id;
        return (
          <button
            key={pl.id}
            className={`cw-chip ${active ? 'active' : ''}`}
            onClick={() => onPlaylistChange(active ? null : pl.id)}
          >
            {pl.title}
            <span className="ct">{pl.videoCount}</span>
          </button>
        );
      })}
    </>
  );
}
