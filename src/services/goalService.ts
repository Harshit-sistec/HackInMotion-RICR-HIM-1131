import type { AvailableTime, GoalType, KnowledgeLevel, LearningGoal } from '@/types';
import { readStorage, writeStorage } from '@/utils/storage';
import { delay, randomId } from '@/utils/async';

const GOAL_KEY = 'nova_goal';
const TIME_KEY = 'nova_available_time';
const LEVEL_KEY = 'nova_knowledge_level';

export interface CreateGoalInput {
  type: GoalType;
  title: string;
  subjects: string[];
  topics: string[];
  deadline: string;
}

export const goalService = {
  async createGoal(input: CreateGoalInput): Promise<LearningGoal> {
    await delay(600);
    if (!input.title.trim()) throw new Error('Give your goal a name.');
    if (!input.deadline) throw new Error('Pick a target deadline.');
    const goal: LearningGoal = { id: randomId('goal'), createdAt: new Date().toISOString(), ...input };
    writeStorage(GOAL_KEY, goal);
    return goal;
  },

  async saveAvailableTime(time: AvailableTime): Promise<AvailableTime> {
    await delay(400);
    writeStorage(TIME_KEY, time);
    return time;
  },

  async saveKnowledgeLevel(level: KnowledgeLevel): Promise<KnowledgeLevel> {
    await delay(300);
    writeStorage(LEVEL_KEY, level);
    return level;
  },

  getGoal(): LearningGoal | null {
    return readStorage<LearningGoal | null>(GOAL_KEY, null);
  },

  getAvailableTime(): AvailableTime | null {
    return readStorage<AvailableTime | null>(TIME_KEY, null);
  },

  getKnowledgeLevel(): KnowledgeLevel | null {
    return readStorage<KnowledgeLevel | null>(LEVEL_KEY, null);
  },
};
