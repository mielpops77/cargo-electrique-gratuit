import { Router } from 'express';
import { createPost, deletePost, getPost, listPosts, updatePost } from '../db';
import { CreatePostInput, Platform, PlatformContentMap } from '../types';

const VALID_PLATFORMS: Platform[] = ['facebook', 'instagram', 'youtube', 'tiktok'];
const EDITABLE_STATUSES = ['scheduled', 'failed'];

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
    const { text, hashtags, postType } = content as Record<string, unknown>;
    if (text !== undefined && typeof text !== 'string') {
      return { error: `platformContent.${platform}.text doit être une chaîne` };
    }
    if (hashtags !== undefined && typeof hashtags !== 'string') {
      return { error: `platformContent.${platform}.hashtags doit être une chaîne` };
    }
    if (postType !== undefined && (platform !== 'instagram' || (postType !== 'feed' && postType !== 'story'))) {
      return { error: `platformContent.${platform}.postType invalide (seul instagram accepte "feed" ou "story")` };
    }
    result[platform as Platform] = { text, hashtags, postType: postType as 'feed' | 'story' | undefined };
  }
  return result;
}

function parsePostInput(body: unknown): CreatePostInput | { error: string } {
  const { baseText, platformContent, mediaPath, mediaType, platforms, scheduledAt } = (body ?? {}) as Record<string, unknown>;

  if (typeof baseText !== 'string' || typeof mediaPath !== 'string') {
    return { error: 'baseText et mediaPath sont requis' };
  }
  if (mediaType !== 'image' && mediaType !== 'video') {
    return { error: 'mediaType doit être "image" ou "video"' };
  }
  if (!Array.isArray(platforms) || platforms.length === 0 || !platforms.every((platform) => VALID_PLATFORMS.includes(platform))) {
    return { error: `platforms doit être un tableau non vide parmi ${VALID_PLATFORMS.join(', ')}` };
  }
  if (typeof scheduledAt !== 'string' || Number.isNaN(Date.parse(scheduledAt))) {
    return { error: 'scheduledAt doit être une date ISO valide' };
  }

  const parsedContent = parsePlatformContent(platformContent, platforms as Platform[]);
  if ('error' in parsedContent) {
    return parsedContent;
  }

  return { baseText, platformContent: parsedContent, mediaPath, mediaType, platforms: platforms as Platform[], scheduledAt };
}

postsRouter.post('/', (req, res) => {
  const parsed = parsePostInput(req.body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  res.status(201).json(createPost(parsed));
});

postsRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = getPost(id);
  if (!existing) {
    res.status(404).json({ error: 'Post introuvable' });
    return;
  }
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    res.status(409).json({ error: `Un post au statut "${existing.status}" ne peut plus être modifié` });
    return;
  }

  const parsed = parsePostInput(req.body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  res.json(updatePost(id, parsed));
});

postsRouter.delete('/:id', (req, res) => {
  deletePost(Number(req.params.id));
  res.status(204).send();
});
