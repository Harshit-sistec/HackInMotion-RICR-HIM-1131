import { getDb } from './db.js';

export interface StoredGoal {
  id: string;
  userId: string;
  type: 'exam' | 'subject' | 'topic-mastery' | 'weak-areas' | 'placement';
  title: string;
  subjects: string[];
  topics: string[];
  deadline: string;
  availableTime: { hoursPerDay: number; studyDays: string[]; preferredTime: string };
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  createdAt: string;
}

async function goalsCollection() {
  const db = await getDb();
  const col = db.collection<StoredGoal>('goals');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ userId: 1, isActive: 1 }).catch(() => {});
  return col;
}

function newId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const goalStore = {
  async getActive(userId: string): Promise<StoredGoal | undefined> {
    const col = await goalsCollection();
    const doc = await col.findOne({ userId, isActive: true });
    return doc ?? undefined;
  },

  async create(input: Omit<StoredGoal, 'id' | 'isActive' | 'createdAt'>): Promise<StoredGoal> {
    const col = await goalsCollection();
    await col.updateMany({ userId: input.userId, isActive: true }, { $set: { isActive: false } });
    const goal: StoredGoal = {
      ...input,
      id: newId(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(goal);
    return goal;
  },

  async clearActive(userId: string): Promise<void> {
    const col = await goalsCollection();
    await col.updateMany({ userId, isActive: true }, { $set: { isActive: false } });
  },
};
