import { getDb } from './db.js';

export interface StoredChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'ai';
  content: string;
  videoQuery: string | null;
  createdAt: string;
}

async function chatCollection() {
  const db = await getDb();
  const col = db.collection<StoredChatMessage>('chat_messages');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ userId: 1, createdAt: 1 }).catch(() => {});
  return col;
}

function newId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const chatStore = {
  async listByUser(userId: string, limit = 100): Promise<StoredChatMessage[]> {
    const col = await chatCollection();
    return col.find({ userId }).sort({ createdAt: 1 }).limit(limit).toArray();
  },

  async append(input: Omit<StoredChatMessage, 'id' | 'createdAt'>): Promise<StoredChatMessage> {
    const col = await chatCollection();
    const message: StoredChatMessage = {
      ...input,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(message);
    return message;
  },
};
