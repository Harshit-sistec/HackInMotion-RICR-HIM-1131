import type { GeneratedQuestion } from './gemini.js';

export interface StoredMockTestQuestion extends GeneratedQuestion {
  id: string;
}

interface StoredMockTestSession {
  id: string;
  userId: string;
  subject: string;
  questions: StoredMockTestQuestion[];
  createdAt: number;
}

const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours — long enough to finish a test
const store = new Map<string, StoredMockTestSession>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [id, session] of store) {
    if (now - session.createdAt > TTL_MS) store.delete(id);
  }
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockTestSessionStore = {
  create(userId: string, subject: string, questions: GeneratedQuestion[]): StoredMockTestSession {
    purgeExpired();
    const session: StoredMockTestSession = {
      id: newId('test'),
      userId,
      subject,
      questions: questions.map((q) => ({ ...q, id: newId('q') })),
      createdAt: Date.now(),
    };
    store.set(session.id, session);
    return session;
  },

  get(id: string, userId: string): StoredMockTestSession | undefined {
    const session = store.get(id);
    if (!session || session.userId !== userId) return undefined;
    if (Date.now() - session.createdAt > TTL_MS) {
      store.delete(id);
      return undefined;
    }
    return session;
  },
};

export type { StoredMockTestSession };
