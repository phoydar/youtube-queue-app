import { pgTable, text, integer, boolean, timestamp, primaryKey, index, uniqueIndex, varchar, real, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Custom pgvector type for Drizzle.
 * Stores as the Postgres `vector(N)` type provided by the pgvector extension.
 * JS value is a plain number[]; we serialize to the pgvector "[1,2,3]" literal.
 */
export const vector = (name: string, config: { dimensions: number }) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${config.dimensions})`;
    },
    toDriver(value: number[]): string {
      return `[${value.join(',')}]`;
    },
    fromDriver(value: string): number[] {
      // pgvector returns text like "[1,2,3]"
      if (typeof value !== 'string') return value as unknown as number[];
      return value
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((n) => Number(n));
    },
  })(name);

export const playlists = pgTable('playlists', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  youtubePlaylistId: text('youtube_playlist_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').default(''),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const videos = pgTable('videos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  youtubeVideoId: text('youtube_video_id').notNull().unique(),
  title: text('title').notNull(),
  channelName: text('channel_name').notNull(),
  channelId: text('channel_id').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  publishedAt: timestamp('published_at').notNull(),
  priority: text('priority', { enum: ['HIGH', 'MEDIUM', 'LOW'] }).notNull().default('MEDIUM'),
  manualOrder: integer('manual_order').notNull().default(0),
  watched: boolean('watched').notNull().default(false),
  watchStatus: text('watch_status', { enum: ['UNWATCHED', 'IN_PROGRESS', 'WATCHED'] }).notNull().default('UNWATCHED'),
  watchedAt: timestamp('watched_at'),
  resumeTimestamp: integer('resume_timestamp'), // seconds into the video
  notes: text('notes').default(''),
  unavailable: boolean('unavailable').notNull().default(false),
  addedAt: timestamp('added_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  // AI integration fields
  description: text('description'),
  transcript: text('transcript'),
  transcriptSource: text('transcript_source', { enum: ['youtube', 'description_fallback', 'none'] }),
  summary: text('summary'),
  keyTopics: text('key_topics').array(),
  embedding: vector('embedding', { dimensions: 512 }),
  aiProcessedAt: timestamp('ai_processed_at'),
  aiError: text('ai_error'),
}, (table) => ({
  watchedIdx: index('idx_video_watched').on(table.watched),
  priorityIdx: index('idx_video_priority').on(table.priority),
  addedAtIdx: index('idx_video_added_at').on(table.addedAt),
  aiProcessedIdx: index('idx_video_ai_processed').on(table.aiProcessedAt),
}));

export const videoClusters = pgTable('video_clusters', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  label: text('label').notNull(),
  description: text('description').default(''),
  centroid: vector('centroid', { dimensions: 512 }),
  videoCount: integer('video_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const videoClusterMembers = pgTable('video_cluster_members', {
  clusterId: text('cluster_id').notNull().references(() => videoClusters.id, { onDelete: 'cascade' }),
  videoId: text('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  similarity: real('similarity').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.clusterId, table.videoId] }),
  videoIdx: index('idx_cluster_member_video').on(table.videoId),
  clusterIdx: index('idx_cluster_member_cluster').on(table.clusterId),
}));

export const tags = pgTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#6366f1'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const videoTags = pgTable('video_tags', {
  videoId: text('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.videoId, table.tagId] }),
  videoIdx: index('idx_video_tag_video').on(table.videoId),
  tagIdx: index('idx_video_tag_tag').on(table.tagId),
}));

export const playlistVideos = pgTable('playlist_videos', {
  playlistId: text('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  videoId: text('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.playlistId, table.videoId] }),
}));

export const syncLogs = pgTable('sync_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  playlistId: text('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['SUCCESS', 'PARTIAL', 'FAILED'] }).notNull(),
  videosAdded: integer('videos_added').notNull().default(0),
  videosUpdated: integer('videos_updated').notNull().default(0),
  videosUnavailable: integer('videos_unavailable').notNull().default(0),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  playlistIdx: index('idx_sync_log_playlist').on(table.playlistId),
}));

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON-encoded
});
