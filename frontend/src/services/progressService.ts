import type { Achievement, ProgressSnapshot } from '@/types';
import { fetchApi } from './api';

export const progressService = {
  async getAll(): Promise<{ snapshot: ProgressSnapshot | null; achievements: Achievement[]; weakTopics: string[] }> {
    const data = (await fetchApi('/progress')) as {
      snapshot: ProgressSnapshot | null;
      achievements: Achievement[];
      weakTopics: string[];
    };
    return data;
  },
};
