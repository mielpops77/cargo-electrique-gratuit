import axios from 'axios';
import { config } from '../config';
import { publicMediaUrl } from '../publicUrl';
import { resolveCaption } from '../caption';
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
  const isStory = post.platformContent.instagram?.postType === 'story';

  const containerParams: Record<string, string> = {};
  if (post.mediaType === 'video') {
    containerParams.video_url = mediaUrl;
  } else {
    containerParams.image_url = mediaUrl;
  }
  if (isStory) {
    containerParams.media_type = 'STORIES';
    // Les Stories Instagram ne supportent pas de légende via l'API : seul le média est publié.
  } else {
    if (post.mediaType === 'video') {
      containerParams.media_type = 'REELS';
    }
    containerParams.caption = resolveCaption(post, 'instagram');
  }

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
