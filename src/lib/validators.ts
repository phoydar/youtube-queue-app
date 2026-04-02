import { z } from 'zod';

export const addPlaylistSchema = z.object({
  youtubePlaylistId: z
    .string()
    .min(1, 'Playlist ID is required')
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid playlist ID format'),
});

export const updateVideoSchema = z.object({
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  watched: z.boolean().optional(),
  watchStatus: z.enum(['UNWATCHED', 'IN_PROGRESS', 'WATCHED']).optional(),
  resumeTimestamp: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(5000).optional(),
  manualOrder: z.number().int().optional(),
});

export const bulkUpdateSchema = z.object({
  videoIds: z.array(z.string()).min(1, 'At least one video ID required'),
  action: z.object({
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    watched: z.boolean().optional(),
    watchStatus: z.enum(['UNWATCHED', 'IN_PROGRESS', 'WATCHED']).optional(),
    tagIds: z.array(z.string()).optional(),
  }),
});

export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
    .optional()
    .default('#6366f1'),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const assignTagsSchema = z.object({
  tagIds: z.array(z.string()).min(1, 'At least one tag ID is required'),
});

export const updateSettingsSchema = z.record(z.string(), z.unknown());

export const videoQuerySchema = z.object({
  watched: z.enum(['true', 'false']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  search: z.string().optional(), // search across title, channel, tags
  tags: z.string().optional(), // comma-separated tag IDs
  playlist: z.string().optional(), // playlist ID to filter by
  watchStatus: z.enum(['UNWATCHED', 'IN_PROGRESS', 'WATCHED']).optional(),
  sort: z.enum(['score', 'addedAt', 'title', 'priority']).optional().default('score'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
