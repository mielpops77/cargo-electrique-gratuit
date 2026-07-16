import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { config } from './config';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function basicAuth(req: Request, res: Response, next: NextFunction): void {
  if (!config.auth.password) {
    next();
    return;
  }

  const header = req.headers.authorization ?? '';
  if (header.startsWith('Basic ')) {
    const [username, password] = Buffer.from(header.slice('Basic '.length), 'base64').toString().split(':');
    if (safeEqual(username ?? '', config.auth.username) && safeEqual(password ?? '', config.auth.password)) {
      next();
      return;
    }
  }

  res.set('WWW-Authenticate', 'Basic realm="MiaouPost"');
  res.status(401).send('Authentification requise');
}
