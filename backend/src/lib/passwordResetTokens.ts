import crypto from 'node:crypto';
import { getDb } from './db.js';

interface StoredResetToken {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const TOKEN_TTL_MS = 15 * 60 * 1000;

async function tokensCollection() {
  const db = await getDb();
  const col = db.collection<StoredResetToken>('password_reset_tokens');
  await col.createIndex({ tokenHash: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  return col;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const passwordResetTokenStore = {
  async create(userId: string): Promise<string> {
    const col = await tokensCollection();
    await col.deleteMany({ userId, used: false });

    const token = crypto.randomBytes(32).toString('hex');
    await col.insertOne({
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      used: false,
      createdAt: new Date(),
    });
    return token;
  },

  async findValid(token: string): Promise<{ userId: string } | undefined> {
    const col = await tokensCollection();
    const doc = await col.findOne({ tokenHash: hashToken(token) });
    if (!doc || doc.used || doc.expiresAt.getTime() < Date.now()) return undefined;
    return { userId: doc.userId };
  },

  async consume(token: string): Promise<{ userId: string } | undefined> {
    const col = await tokensCollection();
    const doc = await col.findOneAndUpdate(
      { tokenHash: hashToken(token), used: false, expiresAt: { $gt: new Date() } },
      { $set: { used: true } },
    );
    return doc ? { userId: doc.userId } : undefined;
  },
};
