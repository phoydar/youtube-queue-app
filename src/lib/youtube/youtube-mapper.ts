import type { YouTubePlaylistItem, YouTubeVideoItem } from './youtube-types';

/**
 * Parse ISO 8601 duration string to seconds.
 * e.g., "PT1H2M3S" → 3723
 */
export function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds into human-readable duration.
 * e.g., 3723 → "1:02:03"
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get the best available thumbnail URL from a playlist item.
 */
export function getBestThumbnail(item: YouTubePlaylistItem): string {
  const thumbs = item.snippet.thumbnails;
  return (
    thumbs.maxres?.url ||
    thumbs.standard?.url ||
    thumbs.high?.url ||
    thumbs.medium?.url ||
    thumbs.default?.url ||
    ''
  );
}

/**
 * Map a YouTube playlist item + video details into our domain shape.
 */
export function mapToVideoInsert(
  playlistItem: YouTubePlaylistItem,
  videoDetails?: YouTubeVideoItem
) {
  return {
    youtubeVideoId: playlistItem.snippet.resourceId.videoId,
    title: playlistItem.snippet.title,
    channelName: playlistItem.snippet.channelTitle,
    channelId: playlistItem.snippet.channelId,
    thumbnailUrl: getBestThumbnail(playlistItem),
    durationSeconds: videoDetails
      ? parseDuration(videoDetails.contentDetails.duration)
      : 0,
    publishedAt: new Date(playlistItem.snippet.publishedAt),
  };
}
