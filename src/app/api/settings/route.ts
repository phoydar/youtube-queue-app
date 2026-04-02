import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { jsonSuccess, jsonError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.select().from(settings);
  const result: Record<string, unknown> = {};

  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }

  return jsonSuccess(result);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (typeof body !== 'object' || body === null) {
    return jsonError('Request body must be an object');
  }

  for (const [key, value] of Object.entries(body)) {
    const serialized = JSON.stringify(value);

    await db
      .insert(settings)
      .values({ key, value: serialized })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: serialized },
      });
  }

  return jsonSuccess({ updated: true });
}
