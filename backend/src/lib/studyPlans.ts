import { getDb } from './db.js';

export interface StoredStudyPlan {
  id: string;
  userId: string;
  goalId: string;
  goalTitle: string;
  examDate: string;
  totalStudyHours: number;
  completionPercent: number;
  lastAdaptedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface StoredStudySession {
  id: string;
  planId: string;
  userId: string;
  day: number;
  date: string;
  topic: string;
  subject: string;
  objective: string;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'completed' | 'in-progress' | 'upcoming' | 'locked' | 'missed';
  conceptsTotal: number;
  conceptsDone: number;
  completedAt?: string;
}

async function plansCollection() {
  const db = await getDb();
  const col = db.collection<StoredStudyPlan>('study_plans');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ userId: 1, isActive: 1 }).catch(() => {});
  return col;
}

async function sessionsCollection() {
  const db = await getDb();
  const col = db.collection<StoredStudySession>('study_sessions');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ planId: 1, day: 1 }).catch(() => {});
  return col;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const planStore = {
  async getActive(userId: string): Promise<StoredStudyPlan | undefined> {
    const col = await plansCollection();
    const doc = await col.findOne({ userId, isActive: true });
    return doc ?? undefined;
  },

  async findById(id: string): Promise<StoredStudyPlan | undefined> {
    const col = await plansCollection();
    const doc = await col.findOne({ id });
    return doc ?? undefined;
  },

  async create(input: Omit<StoredStudyPlan, 'id' | 'isActive' | 'createdAt'>): Promise<StoredStudyPlan> {
    const col = await plansCollection();
    await col.updateMany({ userId: input.userId, isActive: true }, { $set: { isActive: false } });
    const plan: StoredStudyPlan = {
      ...input,
      id: newId('plan'),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(plan);
    return plan;
  },

  async update(id: string, patch: Partial<StoredStudyPlan>): Promise<StoredStudyPlan | undefined> {
    const col = await plansCollection();
    await col.updateOne({ id }, { $set: patch });
    return this.findById(id);
  },

  async clearActive(userId: string): Promise<void> {
    const col = await plansCollection();
    await col.updateMany({ userId, isActive: true }, { $set: { isActive: false } });
  },
};

export const sessionStore = {
  async listByPlan(planId: string): Promise<StoredStudySession[]> {
    const col = await sessionsCollection();
    return col.find({ planId }).sort({ day: 1 }).toArray();
  },

  async findById(id: string): Promise<StoredStudySession | undefined> {
    const col = await sessionsCollection();
    const doc = await col.findOne({ id });
    return doc ?? undefined;
  },

  async insertMany(sessions: Omit<StoredStudySession, 'id'>[]): Promise<StoredStudySession[]> {
    if (sessions.length === 0) return [];
    const col = await sessionsCollection();
    const docs = sessions.map((s) => ({ ...s, id: newId('session') }));
    await col.insertMany(docs);
    return docs;
  },

  async update(id: string, patch: Partial<StoredStudySession>): Promise<StoredStudySession | undefined> {
    const col = await sessionsCollection();
    await col.updateOne({ id }, { $set: patch });
    return this.findById(id);
  },

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const col = await sessionsCollection();
    await col.deleteMany({ id: { $in: ids } });
  },

  async deleteByPlan(planId: string): Promise<void> {
    const col = await sessionsCollection();
    await col.deleteMany({ planId });
  },
};
