import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';

export interface StoredConversation {
  id: string;
  userId: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CONVERSATION_TITLE = 'New chat';

async function conversationCollection() {
  const db = await getDb();
  const col = db.collection<StoredConversation>('chat_conversations');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ userId: 1, updatedAt: -1 }).catch(() => {});
  return col;
}

export const conversationStore = {
  async listByUser(userId: string, limit = 200): Promise<StoredConversation[]> {
    const col = await conversationCollection();
    return col.find({ userId }).sort({ updatedAt: -1 }).limit(limit).toArray();
  },

  async get(id: string, userId: string): Promise<StoredConversation | null> {
    const col = await conversationCollection();
    return col.findOne({ id, userId });
  },

  async create(userId: string, title = DEFAULT_CONVERSATION_TITLE): Promise<StoredConversation> {
    const col = await conversationCollection();
    const now = new Date().toISOString();
    const conversation: StoredConversation = {
      id: randomUUID(),
      userId,
      title,
      preview: '',
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(conversation);
    return conversation;
  },

  async rename(id: string, userId: string, title: string): Promise<void> {
    const col = await conversationCollection();
    await col.updateOne({ id, userId }, { $set: { title } });
  },

  async touch(id: string, userId: string, preview: string): Promise<void> {
    const col = await conversationCollection();
    await col.updateOne({ id, userId }, { $set: { preview, updatedAt: new Date().toISOString() } });
  },

  async remove(id: string, userId: string): Promise<void> {
    const col = await conversationCollection();
    await col.deleteOne({ id, userId });
  },
};
