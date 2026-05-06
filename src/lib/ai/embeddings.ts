import { embed } from './voyage-client';

/**
 * Build an embedding input string that combines title, topics, and summary
 * so similarity search captures both high-level topic and detailed content.
 */
function buildEmbeddingText(input: {
  title: string;
  summary: string;
  keyTopics: string[];
}): string {
  const topicsLine = input.keyTopics.length > 0 ? `Topics: ${input.keyTopics.join(', ')}` : '';
  return [input.title, topicsLine, input.summary].filter(Boolean).join('\n\n');
}

export async function embedSummary(input: {
  title: string;
  summary: string;
  keyTopics: string[];
}): Promise<number[]> {
  const text = buildEmbeddingText(input);
  const [vector] = await embed([text], 'document');
  return vector;
}
