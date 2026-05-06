/**
 * Thin Voyage AI embeddings wrapper.
 *
 * We use voyage-3-lite which returns 512-dim embeddings by default,
 * matching the `vector(512)` columns in the schema.
 *
 * Voyage has a TS SDK but it's thin and evolving — a direct fetch is
 * smaller, zero-risk, and easy to inspect.
 */
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';

export const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || 'voyage-3-lite';
export const EMBEDDING_DIM = 512;

export function isVoyageConfigured(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY);
}

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
  model: string;
  usage: { total_tokens: number };
}

export async function embed(
  texts: string[],
  inputType: 'document' | 'query' = 'document'
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error('VOYAGE_API_KEY is not set');
  if (texts.length === 0) return [];

  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      input_type: inputType,
      output_dimension: EMBEDDING_DIM,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as VoyageResponse;
  // Sort by index to preserve input order
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
