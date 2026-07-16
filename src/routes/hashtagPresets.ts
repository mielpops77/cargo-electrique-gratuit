import { Router } from 'express';
import { createHashtagPreset, deleteHashtagPreset, listHashtagPresets } from '../db';
import { Platform } from '../types';

const VALID_PLATFORMS: Platform[] = ['facebook', 'instagram', 'youtube', 'tiktok'];

export const hashtagPresetsRouter = Router();

hashtagPresetsRouter.get('/', (_req, res) => {
  res.json(listHashtagPresets());
});

hashtagPresetsRouter.post('/', (req, res) => {
  const { platform, hashtags } = req.body ?? {};

  if (!VALID_PLATFORMS.includes(platform)) {
    res.status(400).json({ error: `platform doit être parmi ${VALID_PLATFORMS.join(', ')}` });
    return;
  }
  if (typeof hashtags !== 'string' || !hashtags.trim()) {
    res.status(400).json({ error: 'hashtags est requis' });
    return;
  }

  res.status(201).json(createHashtagPreset(platform, hashtags.trim()));
});

hashtagPresetsRouter.delete('/:id', (req, res) => {
  deleteHashtagPreset(Number(req.params.id));
  res.status(204).send();
});
