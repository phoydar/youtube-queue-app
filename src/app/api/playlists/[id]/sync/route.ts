import { NextRequest } from 'next/server';
import { syncPlaylist } from '@/lib/sync';
import { jsonSuccess, jsonError } from '@/lib/api-utils';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await syncPlaylist(params.id);
    if (result.status === 'FAILED') {
      return jsonError(result.errorMessage || 'Sync failed', 500);
    }
    return jsonSuccess(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Sync failed';
    return jsonError(msg, 500);
  }
}
