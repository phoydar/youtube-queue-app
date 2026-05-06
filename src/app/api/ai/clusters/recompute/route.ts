import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { recomputeClusters } from '@/lib/ai/clustering';

export async function POST(request: NextRequest) {
  // Same auth pattern as /api/sync and /api/ai/videos/process-batch.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return jsonError('Unauthorized', 401);
    }
  }

  try {
    const result = await recomputeClusters();
    return jsonSuccess(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Cluster recompute failed';
    return jsonError(msg, 500);
  }
}
