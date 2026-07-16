import axios from 'axios';
import { config } from '../config';
import { publicMediaUrl } from '../publicUrl';
import { Post } from '../types';

const API_BASE = 'https://open.tiktokapis.com/v2';

async function waitUntilPublished(publishId: string, accessToken: string): Promise<void> {
  const maxAttempts = 20;
  const delayMs = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data } = await axios.post(
      `${API_BASE}/post/publish/status/fetch/`,
      { publish_id: publishId },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const status = data.data?.status;
    if (status === 'PUBLISH_COMPLETE') return;
    if (status === 'FAILED') {
      throw new Error(`Publication TikTok échouée (publish_id ${publishId}): ${data.data?.fail_reason}`);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`Timeout en attendant la publication TikTok (publish_id ${publishId})`);
}

export async function publishToTiktok(post: Post): Promise<string> {
  const { accessToken } = config.tiktok;
  if (!accessToken) {
    throw new Error('TIKTOK_ACCESS_TOKEN manquant dans .env');
  }
  if (post.mediaType !== 'video') {
    throw new Error('TikTok ne publie que des vidéos');
  }

  const videoUrl = publicMediaUrl(post.mediaPath);

  const { data } = await axios.post(
    `${API_BASE}/post/publish/video/init/`,
    {
      post_info: {
        title: post.caption,
        privacy_level: 'PUBLIC_TO_EVERYONE',
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl,
      },
    },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const publishId = data.data?.publish_id;
  if (!publishId) {
    throw new Error(`Réponse TikTok inattendue: ${JSON.stringify(data)}`);
  }

  await waitUntilPublished(publishId, accessToken);
  return publishId;
}
