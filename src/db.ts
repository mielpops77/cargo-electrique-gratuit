import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CreatePostInput, HashtagPreset, Platform, PlatformContentMap, PlatformResult, Post, PostStatus } from './types';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'miaoupost.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baseText TEXT NOT NULL,
    platformContent TEXT NOT NULL DEFAULT '{}',
    mediaPath TEXT NOT NULL,
    mediaType TEXT NOT NULL,
    platforms TEXT NOT NULL,
    scheduledAt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    results TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS hashtag_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    hashtags TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

interface PostRow {
  id: number;
  baseText: string;
  platformContent: string;
  mediaPath: string;
  mediaType: string;
  platforms: string;
  scheduledAt: string;
  status: string;
  results: string;
  createdAt: string;
}

function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    baseText: row.baseText,
    platformContent: JSON.parse(row.platformContent) as PlatformContentMap,
    mediaPath: row.mediaPath,
    mediaType: row.mediaType as Post['mediaType'],
    platforms: JSON.parse(row.platforms) as Platform[],
    scheduledAt: row.scheduledAt,
    status: row.status as PostStatus,
    results: JSON.parse(row.results) as PlatformResult[],
    createdAt: row.createdAt,
  };
}

export function createPost(input: CreatePostInput): Post {
  const stmt = db.prepare(`
    INSERT INTO posts (baseText, platformContent, mediaPath, mediaType, platforms, scheduledAt, status, results, createdAt)
    VALUES (@baseText, @platformContent, @mediaPath, @mediaType, @platforms, @scheduledAt, 'scheduled', '[]', @createdAt)
  `);
  const info = stmt.run({
    baseText: input.baseText,
    platformContent: JSON.stringify(input.platformContent),
    mediaPath: input.mediaPath,
    mediaType: input.mediaType,
    platforms: JSON.stringify(input.platforms),
    scheduledAt: input.scheduledAt,
    createdAt: new Date().toISOString(),
  });
  return getPost(Number(info.lastInsertRowid))!;
}

export function getPost(id: number): Post | undefined {
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as PostRow | undefined;
  return row ? rowToPost(row) : undefined;
}

export function listPosts(): Post[] {
  const rows = db.prepare('SELECT * FROM posts ORDER BY scheduledAt DESC').all() as PostRow[];
  return rows.map(rowToPost);
}

export function listDuePosts(nowIso: string): Post[] {
  const rows = db
    .prepare("SELECT * FROM posts WHERE status = 'scheduled' AND scheduledAt <= ?")
    .all(nowIso) as PostRow[];
  return rows.map(rowToPost);
}

export function updatePostStatus(id: number, status: PostStatus, results: PlatformResult[]): void {
  db.prepare('UPDATE posts SET status = ?, results = ? WHERE id = ?').run(
    status,
    JSON.stringify(results),
    id,
  );
}

export function deletePost(id: number): void {
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
}

export function updatePost(id: number, input: CreatePostInput): Post {
  const stmt = db.prepare(`
    UPDATE posts
    SET baseText = @baseText, platformContent = @platformContent, mediaPath = @mediaPath,
        mediaType = @mediaType, platforms = @platforms, scheduledAt = @scheduledAt,
        status = 'scheduled', results = '[]'
    WHERE id = @id
  `);
  stmt.run({
    id,
    baseText: input.baseText,
    platformContent: JSON.stringify(input.platformContent),
    mediaPath: input.mediaPath,
    mediaType: input.mediaType,
    platforms: JSON.stringify(input.platforms),
    scheduledAt: input.scheduledAt,
  });
  return getPost(id)!;
}

export function listHashtagPresets(): HashtagPreset[] {
  return db.prepare('SELECT * FROM hashtag_presets ORDER BY createdAt ASC').all() as HashtagPreset[];
}

export function createHashtagPreset(platform: Platform, hashtags: string): HashtagPreset {
  const info = db
    .prepare('INSERT INTO hashtag_presets (platform, hashtags, createdAt) VALUES (?, ?, ?)')
    .run(platform, hashtags, new Date().toISOString());
  return db.prepare('SELECT * FROM hashtag_presets WHERE id = ?').get(info.lastInsertRowid) as HashtagPreset;
}

export function deleteHashtagPreset(id: number): void {
  db.prepare('DELETE FROM hashtag_presets WHERE id = ?').run(id);
}
