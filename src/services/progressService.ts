import type { Achievement, ProgressSnapshot } from '@/types';
import { ACHIEVEMENTS, PROGRESS_SNAPSHOT } from '@/data/mockData';
import { delay } from '@/utils/async';

export const progressService = {
  async getSnapshot(): Promise<ProgressSnapshot> {
    await delay(600);
    return PROGRESS_SNAPSHOT;
  },

  async getAchievements(): Promise<Achievement[]> {
    await delay(500);
    return ACHIEVEMENTS;
  },
};
