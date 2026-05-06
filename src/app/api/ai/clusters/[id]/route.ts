import { db } from '@/lib/db';
import { videoClusters, videoClusterMembers, videos } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const cluster = await db.query.videoClusters.findFirst({
    where: eq(videoClusters.id, params.id),
  });

  if (!cluster) return jsonError('Cluster not found', 404);

  const memberRows = await db
    .select({
      videoId: videoClusterMembers.videoId,
      similarity: videoClusterMembers.similarity,
    })
    .from(videoClusterMembers)
    .where(eq(videoClusterMembers.clusterId, cluster.id))
    .orderBy(desc(videoClusterMembers.similarity));

  if (memberRows.length === 0) {
    return jsonSuccess({
      id: cluster.id,
      label: cluster.label,
      description: cluster.description,
      videoCount: cluster.videoCount,
      members: [],
    });
  }

  const memberIds = memberRows.map((m) => m.videoId);
  const memberVideos = await db
    .select()
    .from(videos)
    .where(inArray(videos.id, memberIds));

  const similarityById = new Map(memberRows.map((m) => [m.videoId, m.similarity]));

  // Preserve similarity order from memberRows (descending).
  const orderedMembers = memberRows
    .map((row) => {
      const v = memberVideos.find((mv) => mv.id === row.videoId);
      if (!v) return null;
      // Don't leak embedding/transcript over the wire.
      const { embedding, transcript, ...rest } = v;
      return { ...rest, similarity: similarityById.get(row.videoId) ?? 0 };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return jsonSuccess({
    id: cluster.id,
    label: cluster.label,
    description: cluster.description,
    videoCount: cluster.videoCount,
    members: orderedMembers,
  });
}
