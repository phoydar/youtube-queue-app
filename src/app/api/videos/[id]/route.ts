import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateVideoSchema } from '@/lib/validators';
import { parseBody, jsonError, jsonSuccess } from '@/lib/api-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = parseBody(updateVideoSchema, body);

  if ('error' in parsed) return jsonError(parsed.error);

  const existing = await db.query.videos.findFirst({
    where: eq(videos.id, params.id),
  });

  if (!existing) return jsonError('Video not found', 404);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.manualOrder !== undefined) updateData.manualOrder = parsed.data.manualOrder;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.resumeTimestamp !== undefined) updateData.resumeTimestamp = parsed.data.resumeTimestamp;
  if (parsed.data.watched !== undefined) {
    updateData.watched = parsed.data.watched;
    updateData.watchedAt = parsed.data.watched ? new Date() : null;
    // Keep watchStatus in sync with watched boolean
    updateData.watchStatus = parsed.data.watched ? 'WATCHED' : 'UNWATCHED';
  }
  if (parsed.data.watchStatus !== undefined) {
    updateData.watchStatus = parsed.data.watchStatus;
    // Keep watched boolean in sync
    updateData.watched = parsed.data.watchStatus === 'WATCHED';
    updateData.watchedAt = parsed.data.watchStatus === 'WATCHED' ? new Date() : null;
  }

  await db.update(videos).set(updateData).where(eq(videos.id, params.id));

  const updated = await db.query.videos.findFirst({
    where: eq(videos.id, params.id),
  });

  return jsonSuccess(updated);
}
