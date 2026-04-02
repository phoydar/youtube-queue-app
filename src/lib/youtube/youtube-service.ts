import type {
  YouTubePlaylistItemsResponse,
  YouTubeVideoListResponse,
  YouTubePlaylistResponse,
  YouTubePlaylistItem,
  YouTubeVideoItem,
} from './youtube-types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY is not set');
  return key;
}

async function ytFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  url.searchParams.set('key', getApiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 }, // no cache for API calls
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch playlist metadata (title, description).
 */
export async function fetchPlaylistInfo(playlistId: string) {
  const data = await ytFetch<YouTubePlaylistResponse>('playlists', {
    part: 'snippet',
    id: playlistId,
  });

  if (!data.items || data.items.length === 0) {
    throw new Error(`Playlist not found: ${playlistId}`);
  }

  return {
    title: data.items[0].snippet.title,
    description: data.items[0].snippet.description,
  };
}

/**
 * Fetch all items from a playlist, handling pagination.
 * Returns raw YouTube playlist items.
 */
export async function fetchPlaylistItems(
  playlistId: string
): Promise<YouTubePlaylistItem[]> {
  const allItems: YouTubePlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const params: Record<string, string> = {
      part: 'snippet,status',
      playlistId,
      maxResults: '50',
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await ytFetch<YouTubePlaylistItemsResponse>('playlistItems', params);
    allItems.push(...data.items);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allItems;
}

/**
 * Fetch video details (duration, etc.) for up to 50 video IDs at a time.
 */
export async function fetchVideoDetails(
  videoIds: string[]
): Promise<Map<string, YouTubeVideoItem>> {
  const result = new Map<string, YouTubeVideoItem>();

  // YouTube API accepts max 50 IDs per request
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await ytFetch<YouTubeVideoListResponse>('videos', {
      part: 'snippet,contentDetails',
      id: batch.join(','),
    });

    for (const item of data.items) {
      result.set(item.id, item);
    }
  }

  return result;
}
