import { Platform, PlatformResult, Post } from '../types';
import { publishToFacebook } from './facebook';
import { publishToInstagram } from './instagram';
import { publishToYoutube } from './youtube';
import { publishToTiktok } from './tiktok';

const publishers: Record<Platform, (post: Post) => Promise<string>> = {
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  youtube: publishToYoutube,
  tiktok: publishToTiktok,
};

export async function publishToPlatform(platform: Platform, post: Post): Promise<PlatformResult> {
  try {
    const externalId = await publishers[platform](post);
    return { platform, success: true, externalId, publishedAt: new Date().toISOString() };
  } catch (error) {
    return {
      platform,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
