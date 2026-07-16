import cron from 'node-cron';
import { listDuePosts, updatePostStatus } from './db';
import { publishToPlatform } from './platforms';
import { PlatformResult } from './types';

async function runDuePosts(): Promise<void> {
  const duePosts = listDuePosts(new Date().toISOString());

  for (const post of duePosts) {
    updatePostStatus(post.id, 'publishing', post.results);

    const results: PlatformResult[] = await Promise.all(
      post.platforms.map((platform) => publishToPlatform(platform, post)),
    );

    const status = results.every((result) => result.success) ? 'published' : 'failed';
    updatePostStatus(post.id, status, results);
  }
}

export function startScheduler(): void {
  cron.schedule('* * * * *', () => {
    runDuePosts().catch((error) => {
      console.error('Erreur pendant le cycle de publication programmée', error);
    });
  });
}
