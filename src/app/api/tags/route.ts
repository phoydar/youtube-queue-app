import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { tags, videoTags } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createTagSchema } from '@/lib/validators';
import { parseBody, jsonError, jsonSuccess } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      createdAt: tags.createdAt,
      videoCount: sql<number>`(SELECT COUNT(*) FROM video_tags WHERE tag_id = ${tags.id})`,
    })
    .from(tags)
    .orderBy(tags.name);

  return jsonSuccess(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = parseBody(createTagSchema, body);

  if ('error' in parsed) return jsonError(parsed.error);

  // Check for duplicate name
  const existing = await db.query.tags.findFirst({
    where: eq(tags.name, parsed.data.name),
  });
  if (existing) return jsonError('Tag already exists', 409);

  const id = crypto.randomUUID();
  await db.insert(tags).values({
    id,
    name: parsed.data.name,
    color: parsed.data.color,
  });

  const created = await db.query.tags.findFirst({
    where: eq(tags.id, id),
  });

  return jsonSuccess(created, 201);
}
