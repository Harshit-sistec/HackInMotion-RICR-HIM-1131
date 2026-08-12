import type { AvailableTime, KnowledgeLevel, LearningGoal, StudyPlan, StudySession } from '@/types';
import { INITIAL_PLAN } from '@/data/mockData';
import { readStorage, writeStorage } from '@/utils/storage';
import { api } from '@/services/api';

const PLAN_KEY = 'nova_study_plan';

function recomputeCompletion(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  const totalConcepts = sessions.reduce((sum, s) => sum + s.conceptsTotal, 0);
  const doneConcepts = sessions.reduce((sum, s) => sum + s.conceptsDone, 0);
  if (totalConcepts === 0) return 0;
  return Math.round((doneConcepts / totalConcepts) * 100);
}

async function updateProfilePlan(plan: StudyPlan) {
  const currentToken = localStorage.getItem('auth_token');
  if (!currentToken) return;
  try {
    const { data: userData } = await api.auth.getUser();
    if (!userData?.user) return;
    
    await api.from('profiles').update({ study_plan: plan }).eq('user_id', userData.user.id);
  } catch (err) {
    console.error('Error syncing study plan to database:', err);
  }
}

export const studyPlanService = {
  getPlan(): StudyPlan | null {
    return readStorage<StudyPlan | null>(PLAN_KEY, null);
  },

  async generatePlan(
    goal: LearningGoal,
    _time: AvailableTime,
    _level: KnowledgeLevel,
    weakTopics: string[],
  ): Promise<StudyPlan> {
    const sessions = INITIAL_PLAN.sessions.map((session) => ({
      ...session,
      difficulty: weakTopics.includes(session.topic) ? 'hard' : session.difficulty,
    })) as StudySession[];

    const plan: StudyPlan = {
      ...INITIAL_PLAN,
      goalTitle: goal.title,
      examDate: goal.deadline,
      sessions,
      completionPercent: recomputeCompletion(sessions),
      lastAdaptedAt: null,
    };
    
    writeStorage(PLAN_KEY, plan);
    await updateProfilePlan(plan);
    return plan;
  },

  async markSessionComplete(sessionId: string): Promise<StudyPlan> {
    const plan = readStorage<StudyPlan | null>(PLAN_KEY, INITIAL_PLAN);
    if (!plan) throw new Error('No active study plan.');
    
    const sessions = plan.sessions.map((s) =>
      s.id === sessionId ? { ...s, status: 'completed' as const, conceptsDone: s.conceptsTotal } : s,
    );
    const updated: StudyPlan = { ...plan, sessions, completionPercent: recomputeCompletion(sessions) };
    
    writeStorage(PLAN_KEY, updated);
    await updateProfilePlan(updated);
    return updated;
  },

  async updateConceptProgress(sessionId: string, conceptsDone: number): Promise<StudyPlan> {
    const plan = readStorage<StudyPlan | null>(PLAN_KEY, INITIAL_PLAN);
    if (!plan) throw new Error('No active study plan.');
    
    const sessions = plan.sessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            conceptsDone: Math.min(conceptsDone, s.conceptsTotal),
            status: conceptsDone >= s.conceptsTotal ? ('completed' as const) : ('in-progress' as const),
          }
        : s,
    );
    const updated: StudyPlan = { ...plan, sessions, completionPercent: recomputeCompletion(sessions) };
    
    writeStorage(PLAN_KEY, updated);
    await updateProfilePlan(updated);
    return updated;
  },

  async rescheduleSession(sessionId: string, newDate: string): Promise<StudyPlan> {
    const plan = readStorage<StudyPlan | null>(PLAN_KEY, INITIAL_PLAN);
    if (!plan) throw new Error('No active study plan.');
    
    const sessions = plan.sessions.map((s) => (s.id === sessionId ? { ...s, date: newDate, status: 'upcoming' as const } : s));
    const updated: StudyPlan = { ...plan, sessions };
    
    writeStorage(PLAN_KEY, updated);
    await updateProfilePlan(updated);
    return updated;
  },

  async autoAdjustPlan(): Promise<StudyPlan> {
    const plan = readStorage<StudyPlan | null>(PLAN_KEY, INITIAL_PLAN);
    if (!plan) throw new Error('No active study plan.');

    const missed = plan.sessions.filter((s) => s.status === 'missed');
    let sessions = plan.sessions.map((s) =>
      s.status === 'missed' ? { ...s, status: 'upcoming' as const, estimatedMinutes: s.estimatedMinutes + 20 } : s,
    );

    if (missed.length > 0) {
      const catchUp: StudySession = {
        id: `catchup-${Date.now()}`,
        day: Math.max(...sessions.map((s) => s.day)) + 1,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        topic: `Catch-up: ${missed[0].topic}`,
        subject: missed[0].subject,
        objective: `Quick-recovery block to rebuild momentum on ${missed[0].topic}.`,
        estimatedMinutes: 45,
        difficulty: 'medium',
        status: 'upcoming',
        conceptsTotal: 2,
        conceptsDone: 0,
      };
      sessions = [...sessions, catchUp].sort((a, b) => a.day - b.day);
    }

    const updated: StudyPlan = {
      ...plan,
      sessions,
      completionPercent: recomputeCompletion(sessions),
      lastAdaptedAt: new Date().toISOString(),
    };
    
    writeStorage(PLAN_KEY, updated);
    await updateProfilePlan(updated);
    return updated;
  },

  async syncFromDatabase(userId: string): Promise<StudyPlan | null> {
    try {
      const { data: profile } = await api.from('profiles').select('study_plan').eq('user_id', userId).maybeSingle();
      if (!profile?.study_plan) {
        return null;
      }
      
      writeStorage(PLAN_KEY, profile.study_plan);
      return profile.study_plan;
    } catch (err) {
      console.error('Failed to sync study plan from DB:', err);
      return this.getPlan();
    }
  }
};
