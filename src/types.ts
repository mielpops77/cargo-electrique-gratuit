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

export type InstagramPostType = 'feed' | 'story';

export interface PlatformContent {
  text?: string;
  hashtags?: string;
  postType?: InstagramPostType;
}

export type PlatformContentMap = Partial<Record<Platform, PlatformContent>>;

export interface Post {
  id: number;
  baseText: string;
  platformContent: PlatformContentMap;
  mediaPath: string;
  mediaType: MediaType;
  platforms: Platform[];
  scheduledAt: string;
  status: PostStatus;
  results: PlatformResult[];
  createdAt: string;
}

export interface HashtagPreset {
  id: number;
  platform: Platform;
  hashtags: string;
  createdAt: string;
}

export interface CreatePostInput {
  baseText: string;
  platformContent: PlatformContentMap;
  mediaPath: string;
  mediaType: MediaType;
  platforms: Platform[];
  scheduledAt: string;
}
