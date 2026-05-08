export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { videoClusters, videoClusterMembers, videos } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { jsonSuccess } from '@/lib/api-utils';

/**
 * List all clusters with member counts and a few sample titles/thumbnails.
 */
export async function GET() {
  const clusters = await db
    .select()
    .from(videoClusters)
    .orderBy(desc(videoClusters.videoCount));

  if (clusters.length === 0) {
    return jsonSuccess({ clusters: [] });
  }

  // For each cluster, grab up to 3 sample videos for thumbnail/title preview.
  const result = await Promise.all(
    clusters.map(async (cluster) => {
      const memberRows = await db
        .select({
          videoId: videoClusterMembers.videoId,
          similarity: videoClusterMembers.similarity,
        })
        .from(videoClusterMembers)
        .where(eq(videoClusterMembers.clusterId, cluster.id))
        .orderBy(desc(videoClusterMembers.similarity))
        .limit(3);

      const sampleIds = memberRows.map((m) => m.videoId);
      const sampleVideos = sampleIds.length
        ? await db
            .select({
              id: videos.id,
              title: videos.title,
              thumbnailUrl: videos.thumbnailUrl,
            })
            .from(videos)
            .where(inArray(videos.id, sampleIds))
        : [];

      return {
        id: cluster.id,
        label: cluster.label,
        description: cluster.description,
        videoCount: cluster.videoCount,
        createdAt: cluster.createdAt,
        updatedAt: cluster.updatedAt,
        sampleVideos,
      };
    })
  );

  return jsonSuccess({ clusters: result });
}
