import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { videoTags, videos, tags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { assignTagsSchema } from '@/lib/validators';
import { parseBody, jsonError, jsonSuccess } from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = parseBody(assignTagsSchema, body);

  if ('error' in parsed) return jsonError(parsed.error);

  // Verify video exists
  const video = await db.query.videos.findFirst({
    where: eq(videos.id, params.id),
  });
  if (!video) return jsonError('Video not found', 404);

  // Insert tag assignments (ignore duplicates)
  for (const tagId of parsed.data.tagIds) {
    const tag = await db.query.tags.findFirst({
      where: eq(tags.id, tagId),
    });
    if (!tag) continue;

    await db
      .insert(videoTags)
      .values({ videoId: params.id, tagId })
      .onConflictDoNothing();
  }

  return jsonSuccess({ assigned: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get('tagId');

  if (!tagId) return jsonError('tagId query parameter is required');

  await db
    .delete(videoTags)
    .where(and(eq(videoTags.videoId, params.id), eq(videoTags.tagId, tagId)));

  return jsonSuccess({ removed: true });
}
