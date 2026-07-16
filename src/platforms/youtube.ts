import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { config } from '../config';
import { Post } from '../types';

const MEDIA_DIR = path.join(process.cwd(), 'media');

export async function publishToYoutube(post: Post): Promise<string> {
  const { clientId, clientSecret, refreshToken } = config.google;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN manquants dans .env');
  }
  if (post.mediaType !== 'video') {
    throw new Error('YouTube ne publie que des vidéos');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const filePath = path.join(MEDIA_DIR, post.mediaPath);
  const [title, ...rest] = post.caption.split('\n');

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title.slice(0, 100) || 'MiaouPost',
        description: rest.join('\n') || post.caption,
      },
      status: {
        privacyStatus: 'public',
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });

  return response.data.id ?? '';
}
