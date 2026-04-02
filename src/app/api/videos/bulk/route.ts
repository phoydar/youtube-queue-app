import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { videos, videoTags } from '@/lib/db/schema';
import { inArray, eq } from 'drizzle-orm';
import { bulkUpdateSchema } from '@/lib/validators';
import { parseBody, jsonError, jsonSuccess } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = parseBody(bulkUpdateSchema, body);

  if ('error' in parsed) return jsonError(parsed.error);

  const { videoIds, action } = parsed.data;

  // Build update object
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (action.priority) updateData.priority = action.priority;
  if (action.watched !== undefined) {
    updateData.watched = action.watched;
    updateData.watchStatus = action.watched ? 'WATCHED' : 'UNWATCHED';
    updateData.watchedAt = action.watched ? new Date() : null;
  }
  if (action.watchStatus) {
    updateData.watchStatus = action.watchStatus;
    updateData.watched = action.watchStatus === 'WATCHED';
    updateData.watchedAt = action.watchStatus === 'WATCHED' ? new Date() : null;
  }

  // Apply video updates
  if (Object.keys(updateData).length > 1) {
    await db
      .update(videos)
      .set(updateData)
      .where(inArray(videos.id, videoIds));
  }

  // Apply tag assignments
  if (action.tagIds && action.tagIds.length > 0) {
    for (const videoId of videoIds) {
      for (const tagId of action.tagIds) {
        await db
          .insert(videoTags)
          .values({ videoId, tagId })
          .onConflictDoNothing();
      }
    }
  }

  return jsonSuccess({ updated: videoIds.length });
}
