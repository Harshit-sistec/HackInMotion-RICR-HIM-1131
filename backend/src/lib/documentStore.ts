import type { ExtractedDocument } from './extractText.js';
import type { DocumentAnalysis } from './gemini.js';

interface StoredDocument {
  id: string;
  userId: string;
  fileName: string;
  extracted: ExtractedDocument;
  analysis: DocumentAnalysis;
  createdAt: number;
}

const TTL_MS = 60 * 60 * 1000; // 1 hour
const store = new Map<string, StoredDocument>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [id, doc] of store) {
    if (now - doc.createdAt > TTL_MS) store.delete(id);
  }
}

export const documentStore = {
  save(doc: StoredDocument): void {
    purgeExpired();
    store.set(doc.id, doc);
  },

  get(id: string, userId: string): StoredDocument | undefined {
    const doc = store.get(id);
    if (!doc || doc.userId !== userId) return undefined;
    if (Date.now() - doc.createdAt > TTL_MS) {
      store.delete(id);
      return undefined;
    }
    return doc;
  },
};

export type { StoredDocument };
