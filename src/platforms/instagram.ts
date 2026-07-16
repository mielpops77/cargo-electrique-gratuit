import axios from 'axios';
import { config } from '../config';
import { publicMediaUrl } from '../publicUrl';
import { Post } from '../types';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

async function waitUntilContainerReady(creationId: string, accessToken: string): Promise<void> {
  const maxAttempts = 20;
  const delayMs = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data } = await axios.get(`${GRAPH_API_BASE}/${creationId}`, {
      params: { fields: 'status_code', access_token: accessToken },
    });

    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') {
      throw new Error(`Le traitement du média Instagram a échoué (container ${creationId})`);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`Timeout en attendant que le média Instagram soit prêt (container ${creationId})`);
}

export async function publishToInstagram(post: Post): Promise<string> {
  const { businessAccountId, accessToken } = config.instagram;
  if (!businessAccountId || !accessToken) {
    throw new Error('IG_BUSINESS_ACCOUNT_ID / FB_PAGE_ACCESS_TOKEN manquants dans .env');
  }

  const mediaUrl = publicMediaUrl(post.mediaPath);

  const containerParams: Record<string, string> =
    post.mediaType === 'video'
      ? { video_url: mediaUrl, media_type: 'REELS', caption: post.caption }
      : { image_url: mediaUrl, caption: post.caption };

  const { data: container } = await axios.post(
    `${GRAPH_API_BASE}/${businessAccountId}/media`,
    null,
    { params: { ...containerParams, access_token: accessToken } },
  );

  if (post.mediaType === 'video') {
    await waitUntilContainerReady(container.id, accessToken);
  }

  const { data: published } = await axios.post(
    `${GRAPH_API_BASE}/${businessAccountId}/media_publish`,
    null,
    { params: { creation_id: container.id, access_token: accessToken } },
  );

  return published.id;
}
