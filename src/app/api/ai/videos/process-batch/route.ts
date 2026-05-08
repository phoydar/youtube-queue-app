import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { and, eq, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import { jsonError, jsonSuccess, parseBody } from '@/lib/api-utils';
import { processVideosBatch } from '@/lib/ai/pipeline';

const batchSchema = z.object({
  limit: z.number().int().min(1).max(200).optional().default(25),
  onlyUnprocessed: z.boolean().optional().default(true),
  force: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  // Mirror the cron-style protection pattern used in /api/sync.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return jsonError('Unauthorized', 401);
    }
  }

  const body = await request.json().catch(() => ({}));
  const parsed = parseBody(batchSchema, body);
  if ('error' in parsed) return jsonError(parsed.error);

  const { limit, onlyUnprocessed, force } = parsed.data;

  // Select candidate videos:
  //   - not unavailable
  //   - if onlyUnprocessed: aiProcessedAt IS NULL
  //   - skip ones with a persistent error unless force=true
  const where = and(
    eq(videos.unavailable, false),
    onlyUnprocessed ? isNull(videos.aiProcessedAt) : undefined,
    !force ? isNull(videos.aiError) : undefined
  );

  const candidates = await db
    .select({ id: videos.id })
    .from(videos)
    .where(where)
    .orderBy(desc(videos.addedAt))
    .limit(limit ?? 25);

  const results = await processVideosBatch(
    candidates.map((c) => c.id),
    { force }
  );

  const summary = {
    attempted: results.length,
    ok: results.filter((r) => r.status === 'ok').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };

  return jsonSuccess(summary);
}
