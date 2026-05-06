import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchTranscript } from './transcript';
import { summarizeVideo } from './summarize';
import { embedSummary } from './embeddings';
import { isAnthropicConfigured } from './anthropic-client';
import { isVoyageConfigured } from './voyage-client';

export type AiProcessOutcome =
  | { status: 'ok'; videoId: string }
  | { status: 'skipped'; videoId: string; reason: string }
  | { status: 'error'; videoId: string; error: string };

/**
 * Process a single video through the full AI pipeline:
 *   transcript -> summary -> embedding -> DB update
 *
 * Idempotent: videos that already have `aiProcessedAt` are skipped unless
 * `force` is true.
 *
 * If Anthropic or Voyage API keys are missing, this function is a no-op
 * and returns `skipped` so callers (like sync.ts) don't fail.
 */
export async function processVideoAi(
  videoId: string,
  options: { force?: boolean } = {}
): Promise<AiProcessOutcome> {
  if (!isAnthropicConfigured() || !isVoyageConfigured()) {
    return {
      status: 'skipped',
      videoId,
      reason: 'AI API keys not configured',
    };
  }

  const video = await db.query.videos.findFirst({
    where: eq(videos.id, videoId),
  });

  if (!video) {
    return { status: 'error', videoId, error: 'Video not found' };
  }

  if (video.unavailable) {
    return { status: 'skipped', videoId, reason: 'Video is unavailable' };
  }

  if (video.aiProcessedAt && !options.force) {
    return { status: 'skipped', videoId, reason: 'Already processed' };
  }

  try {
    // Stage 1: transcript (or fallback)
    const transcript = await fetchTranscript(video.youtubeVideoId, {
      title: video.title,
      description: video.description,
    });

    if (transcript.source === 'none') {
      const err = 'No transcript and no description available';
      await db
        .update(videos)
        .set({ aiError: err, transcriptSource: 'none', updatedAt: new Date() })
        .where(eq(videos.id, videoId));
      return { status: 'error', videoId, error: err };
    }

    // Stage 2: summary
    const { summary, keyTopics } = await summarizeVideo({
      title: video.title,
      channelName: video.channelName,
      content: transcript.text,
    });

    // Stage 3: embedding
    const embedding = await embedSummary({
      title: video.title,
      summary,
      keyTopics,
    });

    // Persist everything in one update.
    await db
      .update(videos)
      .set({
        transcript: transcript.text,
        transcriptSource: transcript.source,
        summary,
        keyTopics,
        embedding,
        aiProcessedAt: new Date(),
        aiError: null,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, videoId));

    return { status: 'ok', videoId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await db
      .update(videos)
      .set({ aiError: message, updatedAt: new Date() })
      .where(eq(videos.id, videoId));
    return { status: 'error', videoId, error: message };
  }
}

/**
 * Process many videos sequentially with a small concurrency limit,
 * swallowing per-video errors so one bad video doesn't abort the batch.
 */
export async function processVideosBatch(
  videoIds: string[],
  options: { concurrency?: number; force?: boolean } = {}
): Promise<AiProcessOutcome[]> {
  const concurrency = options.concurrency ?? 2;
  const results: AiProcessOutcome[] = [];

  for (let i = 0; i < videoIds.length; i += concurrency) {
    const slice = videoIds.slice(i, i + concurrency);
    const sliceResults = await Promise.all(
      slice.map((id) => processVideoAi(id, { force: options.force }))
    );
    results.push(...sliceResults);
  }

  return results;
}
