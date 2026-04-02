import { db } from '@/lib/db';
import { playlists, videos, playlistVideos, syncLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchPlaylistItems, fetchVideoDetails } from '@/lib/youtube/youtube-service';
import { mapToVideoInsert } from '@/lib/youtube/youtube-mapper';
import type { SyncResult } from '@/types';

/**
 * Sync a single playlist: fetch from YouTube, upsert videos, update join table.
 */
export async function syncPlaylist(playlistId: string): Promise<SyncResult> {
  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, playlistId),
  });

  if (!playlist) {
    return {
      playlistId,
      status: 'FAILED',
      videosAdded: 0,
      videosUpdated: 0,
      videosUnavailable: 0,
      errorMessage: 'Playlist not found in database',
    };
  }

  const startedAt = new Date();
  let added = 0;
  let updated = 0;
  let unavailableCount = 0;

  try {
    // Fetch all items from YouTube
    const items = await fetchPlaylistItems(playlist.youtubePlaylistId);

    // Filter out deleted/private videos
    const availableItems = items.filter(
      (item) => item.snippet.title !== 'Deleted video' && item.snippet.title !== 'Private video'
    );
    const unavailableItems = items.filter(
      (item) => item.snippet.title === 'Deleted video' || item.snippet.title === 'Private video'
    );
    unavailableCount = unavailableItems.length;

    // Fetch video details (duration) for available items
    const videoIds = availableItems.map((item) => item.snippet.resourceId.videoId);
    const videoDetailsMap = await fetchVideoDetails(videoIds);

    // Upsert each video
    for (const item of availableItems) {
      const videoData = mapToVideoInsert(item, videoDetailsMap.get(item.snippet.resourceId.videoId));

      const existing = await db.query.videos.findFirst({
        where: eq(videos.youtubeVideoId, videoData.youtubeVideoId),
      });

      let videoId: string;

      if (existing) {
        // Update metadata (title, thumbnail might change)
        await db
          .update(videos)
          .set({
            title: videoData.title,
            channelName: videoData.channelName,
            thumbnailUrl: videoData.thumbnailUrl,
            durationSeconds: videoData.durationSeconds,
            unavailable: false,
            updatedAt: new Date(),
          })
          .where(eq(videos.id, existing.id));
        videoId = existing.id;
        updated++;
      } else {
        // Insert new video
        const newId = crypto.randomUUID();
        await db.insert(videos).values({
          id: newId,
          ...videoData,
        });
        videoId = newId;
        added++;
      }

      // Upsert playlist-video relationship
      await db
        .insert(playlistVideos)
        .values({
          playlistId: playlist.id,
          videoId,
          position: item.snippet.position,
        })
        .onConflictDoUpdate({
          target: [playlistVideos.playlistId, playlistVideos.videoId],
          set: { position: item.snippet.position },
        });
    }

    // Mark unavailable videos
    for (const item of unavailableItems) {
      const vid = item.snippet.resourceId.videoId;
      await db
        .update(videos)
        .set({ unavailable: true, updatedAt: new Date() })
        .where(eq(videos.youtubeVideoId, vid));
    }

    // Update playlist last synced timestamp
    await db
      .update(playlists)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(playlists.id, playlist.id));

    // Log success
    await db.insert(syncLogs).values({
      playlistId: playlist.id,
      status: 'SUCCESS',
      videosAdded: added,
      videosUpdated: updated,
      videosUnavailable: unavailableCount,
      startedAt,
      completedAt: new Date(),
    });

    return {
      playlistId: playlist.id,
      status: 'SUCCESS',
      videosAdded: added,
      videosUpdated: updated,
      videosUnavailable: unavailableCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await db.insert(syncLogs).values({
      playlistId: playlist.id,
      status: 'FAILED',
      videosAdded: added,
      videosUpdated: updated,
      videosUnavailable: unavailableCount,
      errorMessage,
      startedAt,
      completedAt: new Date(),
    });

    return {
      playlistId: playlist.id,
      status: 'FAILED',
      videosAdded: added,
      videosUpdated: updated,
      videosUnavailable: unavailableCount,
      errorMessage,
    };
  }
}

/**
 * Sync all playlists.
 */
export async function syncAllPlaylists(): Promise<SyncResult[]> {
  const allPlaylists = await db.query.playlists.findMany();
  const results: SyncResult[] = [];

  for (const playlist of allPlaylists) {
    const result = await syncPlaylist(playlist.id);
    results.push(result);
  }

  return results;
}
