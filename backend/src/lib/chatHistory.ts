import { getDb } from './db.js';

export interface StoredChatMessage {
  id: string;
  userId: string;
  conversationId: string;
  role: 'user' | 'ai';
  content: string;
  videoQuery: string | null;
  attachmentName: string | null;
  createdAt: string;
}

async function chatCollection() {
  const db = await getDb();
  const col = db.collection<StoredChatMessage>('chat_messages');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ conversationId: 1, createdAt: 1 }).catch(() => {});
  return col;
}

function newId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const chatStore = {
  async listByConversation(conversationId: string, userId: string, limit = 200): Promise<StoredChatMessage[]> {
    const col = await chatCollection();
    return col.find({ conversationId, userId }).sort({ createdAt: 1 }).limit(limit).toArray();
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

  async removeByConversation(conversationId: string, userId: string): Promise<void> {
    const col = await chatCollection();
    await col.deleteMany({ conversationId, userId });
  },
};
