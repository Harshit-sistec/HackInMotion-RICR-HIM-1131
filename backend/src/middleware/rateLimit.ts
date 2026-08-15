import type { NextFunction, Request, Response } from 'express';

const hits = new Map<string, number[]>();

export function rateLimit(opts: { windowMs: number; max: number }) {
  const { windowMs, max } = opts;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      res.status(429).json({ error: { message: 'Too many requests. Please try again later.' } });
      return;
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}
