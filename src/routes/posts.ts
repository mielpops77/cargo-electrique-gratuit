import { Router } from 'express';
import { createPost, deletePost, listPosts } from '../db';
import { Platform, PlatformContentMap } from '../types';

const VALID_PLATFORMS: Platform[] = ['facebook', 'instagram', 'youtube', 'tiktok'];

export const postsRouter = Router();

postsRouter.get('/', (_req, res) => {
  res.json(listPosts());
});

function parsePlatformContent(input: unknown, platforms: Platform[]): PlatformContentMap | { error: string } {
  if (input === undefined || input === null) return {};
  if (typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'platformContent doit être un objet' };
  }

  const result: PlatformContentMap = {};
  for (const [platform, content] of Object.entries(input as Record<string, unknown>)) {
    if (!VALID_PLATFORMS.includes(platform as Platform) || !platforms.includes(platform as Platform)) {
      return { error: `platformContent contient une plateforme invalide ou non sélectionnée: ${platform}` };
    }
    if (typeof content !== 'object' || content === null) {
      return { error: `platformContent.${platform} doit être un objet` };
    }
    const { text, hashtags } = content as Record<string, unknown>;
    if (text !== undefined && typeof text !== 'string') {
      return { error: `platformContent.${platform}.text doit être une chaîne` };
    }
    if (hashtags !== undefined && typeof hashtags !== 'string') {
      return { error: `platformContent.${platform}.hashtags doit être une chaîne` };
    }
    result[platform as Platform] = { text, hashtags };
  }
  return result;
}

postsRouter.post('/', (req, res) => {
  const { baseText, platformContent, mediaPath, mediaType, platforms, scheduledAt } = req.body ?? {};

  if (typeof baseText !== 'string' || typeof mediaPath !== 'string') {
    res.status(400).json({ error: 'baseText et mediaPath sont requis' });
    return;
  }
  if (mediaType !== 'image' && mediaType !== 'video') {
    res.status(400).json({ error: 'mediaType doit être "image" ou "video"' });
    return;
  }
  if (!Array.isArray(platforms) || platforms.length === 0 || !platforms.every((platform) => VALID_PLATFORMS.includes(platform))) {
    res.status(400).json({ error: `platforms doit être un tableau non vide parmi ${VALID_PLATFORMS.join(', ')}` });
    return;
  }
  if (typeof scheduledAt !== 'string' || Number.isNaN(Date.parse(scheduledAt))) {
    res.status(400).json({ error: 'scheduledAt doit être une date ISO valide' });
    return;
  }

  const parsedContent = parsePlatformContent(platformContent, platforms);
  if ('error' in parsedContent) {
    res.status(400).json({ error: parsedContent.error });
    return;
  }

  const post = createPost({ baseText, platformContent: parsedContent, mediaPath, mediaType, platforms, scheduledAt });
  res.status(201).json(post);
});

postsRouter.delete('/:id', (req, res) => {
  deletePost(Number(req.params.id));
  res.status(204).send();
});
