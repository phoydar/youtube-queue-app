import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { videos, videoTags, tags, playlistVideos } from '@/lib/db/schema';
import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm';
import { videoQuerySchema } from '@/lib/validators';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { calculateScore } from '@/lib/scoring';
import type { Priority } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());

  const parsed = videoQuerySchema.safeParse(params);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const { watched, priority, tags: tagFilter, playlist, search, watchStatus, sort, limit, offset } = parsed.data;

  // Build conditions
  const conditions = [];
  if (watched !== undefined) {
    conditions.push(eq(videos.watched, watched === 'true'));
  }
  if (watchStatus) {
    conditions.push(eq(videos.watchStatus, watchStatus));
  }
  if (priority) {
    conditions.push(eq(videos.priority, priority));
  }
  // Search across title, channel name
  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      sql`(LOWER(${videos.title}) LIKE ${term} OR LOWER(${videos.channelName}) LIKE ${term})`
    );
  }

  // If filtering by tags, get video IDs that have those tags
  let tagVideoIds: string[] | undefined;
  if (tagFilter) {
    const tagIds = tagFilter.split(',').filter(Boolean);
    if (tagIds.length > 0) {
      const taggedVideos = await db
        .select({ videoId: videoTags.videoId })
        .from(videoTags)
        .where(inArray(videoTags.tagId, tagIds));
      tagVideoIds = taggedVideos.map((tv) => tv.videoId);
      if (tagVideoIds.length === 0) {
        return jsonSuccess({ videos: [], total: 0 });
      }
      conditions.push(inArray(videos.id, tagVideoIds));
    }
  }

  // If filtering by playlist, get video IDs in that playlist
  if (playlist) {
    const playlistVids = await db
      .select({ videoId: playlistVideos.videoId })
      .from(playlistVideos)
      .where(eq(playlistVideos.playlistId, playlist));
    const plVideoIds = playlistVids.map((pv) => pv.videoId);
    if (plVideoIds.length === 0) {
      return jsonSuccess({ videos: [], total: 0 });
    }
    conditions.push(inArray(videos.id, plVideoIds));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(videos)
    .where(where);
  const total = countResult[0]?.count ?? 0;

  // Sort
  let orderBy;
  switch (sort) {
    case 'addedAt':
      orderBy = desc(videos.addedAt);
      break;
    case 'title':
      orderBy = asc(videos.title);
      break;
    case 'priority':
      orderBy = sql`CASE ${videos.priority} WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 END`;
      break;
    case 'score':
    default:
      // Score-based sorting: fetch all, compute scores, sort in JS
      // For small datasets (<5k videos) this is fine
      orderBy = desc(videos.addedAt); // fallback, we'll re-sort
      break;
  }

  // Fetch videos
  const rows = await db
    .select()
    .from(videos)
    .where(where)
    .orderBy(orderBy)
    .limit(sort === 'score' ? 9999 : limit)
    .offset(sort === 'score' ? 0 : offset);

  // Fetch tags for these videos
  const videoIds = rows.map((v) => v.id);
  let videoTagsMap: Record<string, { id: string; name: string; color: string }[]> = {};

  if (videoIds.length > 0) {
    const tagRows = await db
      .select({
        videoId: videoTags.videoId,
        tagId: tags.id,
        tagName: tags.name,
        tagColor: tags.color,
      })
      .from(videoTags)
      .innerJoin(tags, eq(videoTags.tagId, tags.id))
      .where(inArray(videoTags.videoId, videoIds));

    for (const row of tagRows) {
      if (!videoTagsMap[row.videoId]) videoTagsMap[row.videoId] = [];
      videoTagsMap[row.videoId].push({
        id: row.tagId,
        name: row.tagName,
        color: row.tagColor,
      });
    }
  }

  // Map and score
  let result = rows.map((v) => ({
    ...v,
    tags: videoTagsMap[v.id] || [],
    score: calculateScore(v.priority as Priority, v.addedAt!),
  }));

  // Sort by score if requested
  if (sort === 'score') {
    result.sort((a, b) => b.score - a.score);
    result = result.slice(offset, offset + limit);
  }

  return jsonSuccess({ videos: result, total });
}
