export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type WatchStatus = 'UNWATCHED' | 'IN_PROGRESS' | 'WATCHED';
export type SyncStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

export interface Video {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: Date;
  priority: Priority;
  manualOrder: number;
  watched: boolean;
  watchStatus: WatchStatus;
  watchedAt: Date | null;
  resumeTimestamp: number | null;
  notes: string;
  unavailable: boolean;
  addedAt: Date;
  tags?: Tag[];
  score?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  videoCount?: number;
}

export interface Playlist {
  id: string;
  youtubePlaylistId: string;
  title: string;
  description: string;
  lastSyncedAt: Date | null;
  videoCount?: number;
}

export interface SyncResult {
  playlistId: string;
  status: SyncStatus;
  videosAdded: number;
  videosUpdated: number;
  videosUnavailable: number;
  errorMessage?: string;
}

export interface DashboardStats {
  totalVideos: number;
  unwatchedCount: number;
  watchedThisWeek: number;
  oldestUnwatchedDays: number | null;
  lastSyncAt: Date | null;
}

export interface ScoringConfig {
  highWeight: number;
  mediumWeight: number;
  lowWeight: number;
  ageFactor: number;
  ageThresholdDays: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  highWeight: 100,
  mediumWeight: 50,
  lowWeight: 10,
  ageFactor: 2,
  ageThresholdDays: 7,
};
