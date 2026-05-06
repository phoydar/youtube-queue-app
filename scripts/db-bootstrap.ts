/**
 * Bootstrap database extensions that must exist before `drizzle-kit push`.
 * Currently: pgvector (for AI embeddings and cluster centroids).
 *
 * Run with: `npm run db:bootstrap`
 * Should be run once per fresh database, before `db:push`.
 */
import { Client } from 'pg';

async function main() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://localhost:5432/youtube_queue';
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('[db-bootstrap] pgvector extension ready');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[db-bootstrap] failed:', err);
  process.exit(1);
});
