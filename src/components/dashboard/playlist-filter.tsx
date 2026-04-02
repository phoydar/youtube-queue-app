'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => onPlaylistChange(null)}
        className={cn(
          'rounded-sm px-2 py-0.5 text-[11px] font-medium transition-colors',
          !selectedPlaylist
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        All
      </button>
      {playlists.map((pl) => {
        const active = selectedPlaylist === pl.id;
        return (
          <button
            key={pl.id}
            onClick={() => onPlaylistChange(active ? null : pl.id)}
            className={cn(
              'rounded-sm px-2 py-0.5 text-[11px] font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {pl.title}
            <span className="ml-1 opacity-40">{pl.videoCount}</span>
          </button>
        );
      })}
    </div>
  );
}
