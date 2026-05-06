import { YoutubeTranscript } from 'youtube-transcript';
import type { TranscriptSource } from '@/types';

const MAX_CONTENT_CHARS = 40_000;

export interface TranscriptResult {
  text: string;
  source: TranscriptSource;
}

/**
 * Fetch a transcript for a YouTube video, falling back to description + title
 * if no captions are available.
 *
 * Returns `{ text: '', source: 'none' }` only if there is truly nothing to
 * summarize (no captions AND no description) — callers should treat this as
 * an error case for the video.
 */
export async function fetchTranscript(
  youtubeVideoId: string,
  fallback: { title: string; description?: string | null }
): Promise<TranscriptResult> {
  try {
    const chunks = await YoutubeTranscript.fetchTranscript(youtubeVideoId);
    const text = chunks
      .map((c) => c.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 0) {
      return {
        text: truncate(text),
        source: 'youtube',
      };
    }
  } catch {
    // Transcript not available — fall through to description fallback.
  }

  const descriptionText = (fallback.description || '').trim();
  if (descriptionText.length > 0) {
    return {
      text: truncate(`${fallback.title}\n\n${descriptionText}`),
      source: 'description_fallback',
    };
  }

  return { text: '', source: 'none' };
}

function truncate(text: string): string {
  if (text.length <= MAX_CONTENT_CHARS) return text;
  return text.slice(0, MAX_CONTENT_CHARS);
}
