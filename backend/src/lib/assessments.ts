import { getDb } from './db.js';

export interface StoredAssessmentResult {
  id: string;
  userId: string;
  kind: 'mock-test' | 'session-check' | 'diagnostic';
  subject: string;
  topic?: string;
  scorePercent?: number;
  correctCount?: number;
  totalQuestions?: number;
  timeSpentSeconds?: number;
  understood?: boolean;
  masteryLevel?: 'strong' | 'developing' | 'weak';
  weakAreas: string[];
  topicBreakdown?: { topic: string; correct: number; total: number }[];
  takenAt: string;
}

async function resultsCollection() {
  const db = await getDb();
  const col = db.collection<StoredAssessmentResult>('assessment_results');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ userId: 1, takenAt: 1 }).catch(() => {});
  return col;
}

function newId(): string {
  return `assess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const assessmentStore = {
  async listByUser(userId: string): Promise<StoredAssessmentResult[]> {
    const col = await resultsCollection();
    return col.find({ userId }).sort({ takenAt: 1 }).toArray();
  },

  async create(input: Omit<StoredAssessmentResult, 'id' | 'takenAt'>): Promise<StoredAssessmentResult> {
    const col = await resultsCollection();
    const result: StoredAssessmentResult = {
      ...input,
      id: newId(),
      takenAt: new Date().toISOString(),
    };
    await col.insertOne(result);
    return result;
  },
};
