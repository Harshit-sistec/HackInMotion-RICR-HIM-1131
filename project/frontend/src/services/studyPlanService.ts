import type { AvailableTime, KnowledgeLevel, LearningGoal, StudyPlan, StudySession } from '@/types';
import { readStorage, writeStorage } from '@/utils/storage';
import { delay, randomId } from '@/utils/async';
import { fetchApi } from './api';

const PLAN_KEY = 'nova_study_plan';
const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function recomputeCompletion(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  const totalConcepts = sessions.reduce((sum, s) => sum + s.conceptsTotal, 0);
  const doneConcepts = sessions.reduce((sum, s) => sum + s.conceptsDone, 0);
  if (totalConcepts === 0) return 0;
  return Math.round((doneConcepts / totalConcepts) * 100);
}

function assignSchedule(
  sessions: {
    topic: string;
    subject: string;
    objective: string;
    estimatedMinutes: number;
    difficulty: 'easy' | 'medium' | 'hard';
    conceptsTotal: number;
  }[],
  studyDays: string[],
): StudySession[] {
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1); // start scheduling from tomorrow

  return sessions.map((s, i) => {
    while (studyDays.length > 0 && !studyDays.includes(DAY_SHORT_NAMES[cursor.getDay()])) {
      cursor.setDate(cursor.getDate() + 1);
    }
    const date = cursor.toISOString();
    cursor.setDate(cursor.getDate() + 1);

    return {
      id: randomId('session'),
      day: i + 1,
      date,
      topic: s.topic,
      subject: s.subject,
      objective: s.objective,
      estimatedMinutes: s.estimatedMinutes,
      difficulty: s.difficulty,
      status: (i === 0 ? 'upcoming' : 'locked') as StudySession['status'],
      conceptsTotal: s.conceptsTotal,
      conceptsDone: 0,
    };
  });
}

export const studyPlanService = {
  getPlan(): StudyPlan | null {
    return readStorage<StudyPlan | null>(PLAN_KEY, null);
  },

  seedPlan(plan: StudyPlan): StudyPlan {
    writeStorage(PLAN_KEY, plan);
    return plan;
  },

  async generatePlan(
    goal: LearningGoal,
    time: AvailableTime,
    level: KnowledgeLevel,
    weakTopics: string[],
  ): Promise<StudyPlan> {
    const data = (await fetchApi('/studyplan/generate', {
      method: 'POST',
      body: JSON.stringify({
        goalTitle: goal.title,
        subjects: goal.subjects,
        topics: goal.topics,
        deadline: goal.deadline,
        hoursPerDay: time.hoursPerDay,
        preferredTime: time.preferredTime,
        knowledgeLevel: level,
        weakTopics,
      }),
    })) as {
      sessions: {
        topic: string;
        subject: string;
        objective: string;
        estimatedMinutes: number;
        difficulty: 'easy' | 'medium' | 'hard';
        conceptsTotal: number;
      }[];
    };

    const sessions: StudySession[] = assignSchedule(data.sessions, time.studyDays);
    const totalStudyHours = Math.round((sessions.reduce((sum, s) => sum + s.estimatedMinutes, 0) / 60) * 10) / 10;

    const plan: StudyPlan = {
      id: randomId('plan'),
      goalTitle: goal.title,
      examDate: goal.deadline,
      totalStudyHours,
      sessions,
      completionPercent: recomputeCompletion(sessions),
      lastAdaptedAt: null,
    };
    writeStorage(PLAN_KEY, plan);
    return plan;
  },

  async markSessionComplete(sessionId: string): Promise<StudyPlan> {
    await delay(500);
    const plan = readStorage<StudyPlan | null>(PLAN_KEY, null);
    if (!plan) throw new Error('No active study plan.');
    const sessions = plan.sessions.map((s) =>
      s.id === sessionId
        ? { ...s, status: 'completed' as const, conceptsDone: s.conceptsTotal, completedAt: new Date().toISOString() }
        : s,
    );
    const updated: StudyPlan = { ...plan, sessions, completionPercent: recomputeCompletion(sessions) };
    writeStorage(PLAN_KEY, updated);
    return updated;
  },

  async updateConceptProgress(sessionId: string, conceptsDone: number): Promise<StudyPlan> {
    await delay(300);
    const plan = readStorage<StudyPlan | null>(PLAN_KEY, null);
    if (!plan) throw new Error('No active study plan.');
    const sessions = plan.sessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            conceptsDone: Math.min(conceptsDone, s.conceptsTotal),
            status: conceptsDone >= s.conceptsTotal ? ('completed' as const) : ('in-progress' as const),
            completedAt: conceptsDone >= s.conceptsTotal ? new Date().toISOString() : s.completedAt,
          }
        : s,
    );
    const updated: StudyPlan = { ...plan, sessions, completionPercent: recomputeCompletion(sessions) };
    writeStorage(PLAN_KEY, updated);
    return updated;
  },

  async rescheduleSession(sessionId: string, newDate: string): Promise<StudyPlan> {
    await delay(500);
    const plan = readStorage<StudyPlan | null>(PLAN_KEY, null);
    if (!plan) throw new Error('No active study plan.');
    const sessions = plan.sessions.map((s) => (s.id === sessionId ? { ...s, date: newDate, status: 'upcoming' as const } : s));
    const updated: StudyPlan = { ...plan, sessions };
    writeStorage(PLAN_KEY, updated);
    return updated;
  },

  /**
   * Simulates adaptive re-planning: pushes missed sessions back into the
   * queue, adds a short catch-up block, and nudges later sessions outward
   * so the plan still lands on the exam date.
   */
  async autoAdjustPlan(): Promise<StudyPlan> {
    await delay(1600);
    const plan = readStorage<StudyPlan | null>(PLAN_KEY, null);
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
    return updated;
  },
};
