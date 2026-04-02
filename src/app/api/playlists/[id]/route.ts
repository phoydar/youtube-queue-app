import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { playlists } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, params.id),
  });

  if (!playlist) {
    return jsonError('Playlist not found', 404);
  }

  await db.delete(playlists).where(eq(playlists.id, params.id));

  return jsonSuccess({ deleted: true });
}
