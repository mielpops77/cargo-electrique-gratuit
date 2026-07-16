import { config } from './config';

export function publicMediaUrl(mediaPath: string): string {
  if (!config.publicBaseUrl) {
    throw new Error(
      'PUBLIC_BASE_URL manquant dans .env : requis pour qu\'Instagram/TikTok puissent récupérer le média.',
    );
  }
  return `${config.publicBaseUrl.replace(/\/$/, '')}/media/${mediaPath}`;
}
