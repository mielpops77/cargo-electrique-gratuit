import axios from 'axios';
import { config } from '../config';
import { publicMediaUrl } from '../publicUrl';
import { Post } from '../types';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

export async function publishToFacebook(post: Post): Promise<string> {
  const { pageId, pageAccessToken } = config.facebook;
  if (!pageId || !pageAccessToken) {
    throw new Error('FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN manquants dans .env');
  }

  const mediaUrl = publicMediaUrl(post.mediaPath);
  const endpoint = post.mediaType === 'video' ? 'videos' : 'photos';
  const mediaUrlField = post.mediaType === 'video' ? 'file_url' : 'url';

  const response = await axios.post(`${GRAPH_API_BASE}/${pageId}/${endpoint}`, null, {
    params: {
      [mediaUrlField]: mediaUrl,
      caption: post.caption,
      access_token: pageAccessToken,
    },
  });

  return response.data.post_id ?? response.data.id;
}
