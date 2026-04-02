import { db } from '@/lib/db';
import { videos, playlists } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { jsonSuccess } from '@/lib/api-utils';
import { subDays, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Total videos
  const totalResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(videos)
    .where(eq(videos.unavailable, false));
  const totalVideos = totalResult[0]?.count ?? 0;

  // Unwatched count
  const unwatchedResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(videos)
    .where(and(eq(videos.watched, false), eq(videos.unavailable, false)));
  const unwatchedCount = unwatchedResult[0]?.count ?? 0;

  // Watched this week
  const oneWeekAgo = subDays(new Date(), 7);
  const watchedThisWeekResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(videos)
    .where(
      and(
        eq(videos.watched, true),
        sql`${videos.watchedAt} >= ${oneWeekAgo}`
      )
    );
  const watchedThisWeek = watchedThisWeekResult[0]?.count ?? 0;

  // Oldest unwatched video
  const oldestUnwatched = await db
    .select({ addedAt: videos.addedAt })
    .from(videos)
    .where(and(eq(videos.watched, false), eq(videos.unavailable, false)))
    .orderBy(videos.addedAt)
    .limit(1);

  const oldestUnwatchedDays = oldestUnwatched[0]?.addedAt
    ? differenceInDays(new Date(), oldestUnwatched[0].addedAt)
    : null;

  // Last sync
  const lastSync = await db
    .select({ lastSyncedAt: playlists.lastSyncedAt })
    .from(playlists)
    .orderBy(sql`${playlists.lastSyncedAt} DESC`)
    .limit(1);

  return jsonSuccess({
    totalVideos,
    unwatchedCount,
    watchedThisWeek,
    oldestUnwatchedDays,
    lastSyncAt: lastSync[0]?.lastSyncedAt ?? null,
  });
}
