import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { playlists, playlistVideos } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { addPlaylistSchema } from '@/lib/validators';
import { parseBody, jsonError, jsonSuccess } from '@/lib/api-utils';
import { fetchPlaylistInfo } from '@/lib/youtube/youtube-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db
    .select({
      id: playlists.id,
      youtubePlaylistId: playlists.youtubePlaylistId,
      title: playlists.title,
      description: playlists.description,
      lastSyncedAt: playlists.lastSyncedAt,
      createdAt: playlists.createdAt,
      videoCount: sql<number>`(SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = ${playlists.id})`,
    })
    .from(playlists)
    .orderBy(playlists.createdAt);

  return jsonSuccess(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = parseBody(addPlaylistSchema, body);

  if ('error' in parsed) return jsonError(parsed.error);

  // Check if already exists
  const existing = await db.query.playlists.findFirst({
    where: eq(playlists.youtubePlaylistId, parsed.data.youtubePlaylistId),
  });

  if (existing) {
    return jsonError('Playlist already added', 409);
  }

  // Fetch playlist info from YouTube
  try {
    const info = await fetchPlaylistInfo(parsed.data.youtubePlaylistId);

    const id = crypto.randomUUID();
    await db.insert(playlists).values({
      id,
      youtubePlaylistId: parsed.data.youtubePlaylistId,
      title: info.title,
      description: info.description,
    });

    const created = await db.query.playlists.findFirst({
      where: eq(playlists.id, id),
    });

    return jsonSuccess(created, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch playlist from YouTube';
    return jsonError(msg, 502);
  }
}
