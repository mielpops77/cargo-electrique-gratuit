import express from 'express';
import path from 'path';
import { config } from './config';
import { basicAuth } from './auth';
import { postsRouter } from './routes/posts';
import { mediaRouter } from './routes/media';
import { hashtagPresetsRouter } from './routes/hashtagPresets';
import { startScheduler } from './scheduler';

const app = express();

app.use(basicAuth);
app.use(express.json());
app.use('/media', express.static(path.join(process.cwd(), 'media')));
app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/api/posts', postsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/hashtag-presets', hashtagPresetsRouter);

startScheduler();

app.listen(config.port, () => {
  console.log(`MiaouPost écoute sur http://localhost:${config.port}`);
});
