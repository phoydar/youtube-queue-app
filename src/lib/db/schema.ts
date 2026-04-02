import { pgTable, text, integer, boolean, timestamp, primaryKey, index, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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
}, (table) => ({
  watchedIdx: index('idx_video_watched').on(table.watched),
  priorityIdx: index('idx_video_priority').on(table.priority),
  addedAtIdx: index('idx_video_added_at').on(table.addedAt),
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
