import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { processVideoAi } from '@/lib/ai/pipeline';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const force = request.nextUrl.searchParams.get('force') === 'true';
  const result = await processVideoAi(params.id, { force });

  if (result.status === 'error') {
    return jsonError(result.error, 500);
  }
  return jsonSuccess(result);
}
