import { NextRequest } from 'next/server';
import { syncAllPlaylists } from '@/lib/sync';
import { jsonSuccess, jsonError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  // Verify cron secret if present (Vercel injects CRON_SECRET)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return jsonError('Unauthorized', 401);
    }
  }

  try {
    const results = await syncAllPlaylists();
    return jsonSuccess({ results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Sync failed';
    return jsonError(msg, 500);
  }
}
