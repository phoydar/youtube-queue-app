// YouTube Data API v3 response types

export interface YouTubePlaylistItemsResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubePlaylistItem[];
}

export interface YouTubePlaylistItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
      high?: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      maxres?: YouTubeThumbnail;
    };
    channelTitle: string;
    playlistId: string;
    position: number;
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
  status?: {
    privacyStatus: string;
  };
}

export interface YouTubeVideoListResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoItem[];
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
      high?: YouTubeThumbnail;
    };
    channelTitle: string;
    categoryId: string;
  };
  contentDetails: {
    duration: string; // ISO 8601 duration (e.g., "PT1H2M3S")
    dimension: string;
    definition: string;
  };
}

export interface YouTubePlaylistResponse {
  kind: string;
  etag: string;
  items: {
    id: string;
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
    };
  }[];
}

interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}
