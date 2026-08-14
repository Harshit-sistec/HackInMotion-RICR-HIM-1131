import type { AvailableTime, GoalType, KnowledgeLevel, LearningGoal } from '@/types';
import { readStorage, writeStorage } from '@/utils/storage';
import { api } from '@/services/api';

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

async function updateProfileOnboarding(patch: Record<string, any>) {
  const currentToken = localStorage.getItem('auth_token');
  if (!currentToken) return;
  try {
    const { data: userData } = await api.auth.getUser();
    if (!userData?.user) return;
    
    const { data: profile } = await api.from('profiles').select('onboarding_data').eq('user_id', userData.user.id).maybeSingle();
    const onboarding_data = { ...(profile?.onboarding_data || {}), ...patch };
    
    await api.from('profiles').update({ onboarding_data }).eq('user_id', userData.user.id);
  } catch (err) {
    console.error('Error syncing onboarding to database:', err);
  }
}

export const goalService = {
  async createGoal(input: CreateGoalInput): Promise<LearningGoal> {
    if (!input.title.trim()) throw new Error('Give your goal a name.');
    if (!input.deadline) throw new Error('Pick a target deadline.');
    
    const goal: LearningGoal = { id: `goal_${Date.now()}`, createdAt: new Date().toISOString(), ...input };
    writeStorage(GOAL_KEY, goal);
    
    await updateProfileOnboarding({ goal });
    return goal;
  },

  async saveAvailableTime(time: AvailableTime): Promise<AvailableTime> {
    writeStorage(TIME_KEY, time);
    await updateProfileOnboarding({ availableTime: time });
    return time;
  },

  async saveKnowledgeLevel(level: KnowledgeLevel): Promise<KnowledgeLevel> {
    writeStorage(LEVEL_KEY, level);
    await updateProfileOnboarding({ knowledgeLevel: level });
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

  async syncFromDatabase(userId: string): Promise<{ goal: LearningGoal | null, time: AvailableTime | null, level: KnowledgeLevel | null }> {
    try {
      const { data: profile } = await api.from('profiles').select('onboarding_data').eq('user_id', userId).maybeSingle();
      if (!profile?.onboarding_data) {
        return { goal: null, time: null, level: null };
      }
      
      const { goal, availableTime, knowledgeLevel } = profile.onboarding_data;
      if (goal) writeStorage(GOAL_KEY, goal);
      if (availableTime) writeStorage(TIME_KEY, availableTime);
      if (knowledgeLevel) writeStorage(LEVEL_KEY, knowledgeLevel);
      
      return {
        goal: goal || null,
        time: availableTime || null,
        level: knowledgeLevel || null
      };
    } catch (err) {
      console.error('Failed to sync goals from DB:', err);
      return {
        goal: this.getGoal(),
        time: this.getAvailableTime(),
        level: this.getKnowledgeLevel()
      };
    }
  }
};
