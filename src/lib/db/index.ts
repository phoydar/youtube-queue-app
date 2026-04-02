import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/youtube_queue';

export const db = drizzle(connectionString, { schema });

export type Database = typeof db;
