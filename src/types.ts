export type Platform = 'facebook' | 'instagram' | 'youtube' | 'tiktok';

export type PostStatus = 'scheduled' | 'publishing' | 'published' | 'failed';

export type MediaType = 'image' | 'video';

export interface PlatformResult {
  platform: Platform;
  success: boolean;
  externalId?: string;
  error?: string;
  publishedAt?: string;
}

export interface Post {
  id: number;
  caption: string;
  mediaPath: string;
  mediaType: MediaType;
  platforms: Platform[];
  scheduledAt: string;
  status: PostStatus;
  results: PlatformResult[];
  createdAt: string;
}

export interface CreatePostInput {
  caption: string;
  mediaPath: string;
  mediaType: MediaType;
  platforms: Platform[];
  scheduledAt: string;
}
