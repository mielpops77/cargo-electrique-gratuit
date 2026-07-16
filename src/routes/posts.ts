import { Router } from 'express';
import { createPost, deletePost, listPosts } from '../db';
import { Platform } from '../types';

const VALID_PLATFORMS: Platform[] = ['facebook', 'instagram', 'youtube', 'tiktok'];

export const postsRouter = Router();

postsRouter.get('/', (_req, res) => {
  res.json(listPosts());
});

postsRouter.post('/', (req, res) => {
  const { caption, mediaPath, mediaType, platforms, scheduledAt } = req.body ?? {};

  if (typeof caption !== 'string' || typeof mediaPath !== 'string') {
    res.status(400).json({ error: 'caption et mediaPath sont requis' });
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

  const post = createPost({ caption, mediaPath, mediaType, platforms, scheduledAt });
  res.status(201).json(post);
});

postsRouter.delete('/:id', (req, res) => {
  deletePost(Number(req.params.id));
  res.status(204).send();
});
