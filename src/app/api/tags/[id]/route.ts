import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateTagSchema } from '@/lib/validators';
import { parseBody, jsonError, jsonSuccess } from '@/lib/api-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = parseBody(updateTagSchema, body);

  if ('error' in parsed) return jsonError(parsed.error);

  const existing = await db.query.tags.findFirst({
    where: eq(tags.id, params.id),
  });
  if (!existing) return jsonError('Tag not found', 404);

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.color) updateData.color = parsed.data.color;

  await db.update(tags).set(updateData).where(eq(tags.id, params.id));

  const updated = await db.query.tags.findFirst({
    where: eq(tags.id, params.id),
  });

  return jsonSuccess(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existing = await db.query.tags.findFirst({
    where: eq(tags.id, params.id),
  });
  if (!existing) return jsonError('Tag not found', 404);

  await db.delete(tags).where(eq(tags.id, params.id));

  return jsonSuccess({ deleted: true });
}
