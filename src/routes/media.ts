import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const MEDIA_DIR = path.join(process.cwd(), 'media');
fs.mkdirSync(MEDIA_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: MEDIA_DIR,
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

export const mediaRouter = Router();

mediaRouter.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Aucun fichier reçu' });
    return;
  }

  const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  res.json({ mediaPath: req.file.filename, mediaType });
});
