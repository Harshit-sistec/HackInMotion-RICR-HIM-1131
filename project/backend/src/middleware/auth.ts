import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { requireJwtSecret } from '../config.js';

export interface AuthedRequest extends Request {
  userId?: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, requireJwtSecret(), { expiresIn: '7d' });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: { message: 'Missing authentication token.' } });
    return;
  }

  try {
    const payload = jwt.verify(token, requireJwtSecret()) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid or expired session. Please sign in again.' } });
  }
}
