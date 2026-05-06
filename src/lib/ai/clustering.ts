import { db } from '@/lib/db';
import { videos, videoClusters, videoClusterMembers } from '@/lib/db/schema';
import { isNotNull, eq } from 'drizzle-orm';
import { generateClusterLabel } from './summarize';

const DEFAULT_SIMILARITY_THRESHOLD = 0.78;

interface CandidateVideo {
  id: string;
  title: string;
  keyTopics: string[];
  embedding: number[];
}

/**
 * Threshold-based agglomerative clustering on cosine similarity.
 *
 * Good enough for <10k videos. Greedy: iterate through videos, place each
 * into the first existing cluster whose centroid has cosine similarity
 * above the threshold, otherwise spawn a new cluster.
 *
 * The centroid is the mean of member embeddings (re-normalized). This
 * produces decent clusters without a real clustering library.
 */
export async function recomputeClusters(opts: {
  threshold?: number;
  minClusterSize?: number;
} = {}): Promise<{ clusterCount: number; memberCount: number; singletons: number }> {
  const threshold = opts.threshold ?? DEFAULT_SIMILARITY_THRESHOLD;
  const minClusterSize = opts.minClusterSize ?? 2;

  // Load all videos that have been processed
  const rows = await db
    .select({
      id: videos.id,
      title: videos.title,
      keyTopics: videos.keyTopics,
      embedding: videos.embedding,
    })
    .from(videos)
    .where(isNotNull(videos.embedding));

  const candidates: CandidateVideo[] = rows
    .filter((r) => r.embedding && r.embedding.length > 0)
    .map((r) => ({
      id: r.id,
      title: r.title,
      keyTopics: r.keyTopics || [],
      embedding: normalize(r.embedding as number[]),
    }));

  if (candidates.length === 0) {
    return { clusterCount: 0, memberCount: 0, singletons: 0 };
  }

  // Build clusters in memory
  interface InMemoryCluster {
    centroid: number[];
    members: Array<{ video: CandidateVideo; similarity: number }>;
  }
  const clusters: InMemoryCluster[] = [];

  for (const video of candidates) {
    let best: { cluster: InMemoryCluster; similarity: number } | null = null;
    for (const cluster of clusters) {
      const sim = cosine(video.embedding, cluster.centroid);
      if (sim >= threshold && (!best || sim > best.similarity)) {
        best = { cluster, similarity: sim };
      }
    }
    if (best) {
      best.cluster.members.push({ video, similarity: best.similarity });
      best.cluster.centroid = recomputeCentroid(
        best.cluster.members.map((m) => m.video.embedding)
      );
    } else {
      clusters.push({
        centroid: video.embedding.slice(),
        members: [{ video, similarity: 1 }],
      });
    }
  }

  const keptClusters = clusters.filter((c) => c.members.length >= minClusterSize);
  const singletons = clusters.length - keptClusters.length;

  // Wipe existing cluster records; this is a full recompute.
  await db.delete(videoClusterMembers);
  await db.delete(videoClusters);

  let memberCount = 0;

  for (const cluster of keptClusters) {
    // Ask Claude for a label
    let label = 'Untitled cluster';
    let description = '';
    try {
      const result = await generateClusterLabel({
        titles: cluster.members.map((m) => m.video.title),
        topics: cluster.members.flatMap((m) => m.video.keyTopics),
      });
      label = result.label || label;
      description = result.description;
    } catch (err) {
      console.error('[clustering] label generation failed:', err);
    }

    const [inserted] = await db
      .insert(videoClusters)
      .values({
        label,
        description,
        centroid: cluster.centroid,
        videoCount: cluster.members.length,
      })
      .returning({ id: videoClusters.id });

    // Recompute similarity of each member to the final centroid for display.
    for (const member of cluster.members) {
      const sim = cosine(member.video.embedding, cluster.centroid);
      await db.insert(videoClusterMembers).values({
        clusterId: inserted.id,
        videoId: member.video.id,
        similarity: sim,
      });
      memberCount++;
    }
  }

  return { clusterCount: keptClusters.length, memberCount, singletons };
}

// ----- vector math helpers -----

function normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum);
  if (norm === 0) return v.slice();
  return v.map((x) => x / norm);
}

function cosine(a: number[], b: number[]): number {
  // Both vectors are assumed normalized, so cosine == dot product.
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

function recomputeCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const sum = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) sum[i] += v[i];
  }
  for (let i = 0; i < dim; i++) sum[i] /= vectors.length;
  return normalize(sum);
}
