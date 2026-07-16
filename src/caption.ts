import { Platform, Post } from './types';

export function resolveCaption(post: Post, platform: Platform): string {
  const override = post.platformContent[platform];
  const text = override?.text?.trim() || post.baseText;
  const hashtags = override?.hashtags?.trim();
  return hashtags ? `${text}\n\n${hashtags}` : text;
}
