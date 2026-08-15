import type { SessionAssessmentQuestion, SessionUnderstandingEvaluation, StudyPlan, StudySession } from '@/types';
import { fetchApi } from './api';

interface PlanEnvelope {
  plan: Omit<StudyPlan, 'sessions'> | null;
  sessions: StudySession[];
}

function merge(env: PlanEnvelope): StudyPlan | null {
  if (!env.plan) return null;
  return { ...env.plan, sessions: [...env.sessions].sort((a, b) => a.day - b.day) };
}

export const studyPlanService = {
  async getPlan(): Promise<StudyPlan | null> {
    const data = (await fetchApi('/studyplan/current')) as PlanEnvelope;
    return merge(data);
  },

  async generatePlan(): Promise<StudyPlan> {
    const data = (await fetchApi('/studyplan/generate', { method: 'POST' })) as PlanEnvelope;
    const plan = merge(data);
    if (!plan) throw new Error('Could not generate your study plan.');
    return plan;
  },

  async markSessionComplete(sessionId: string): Promise<StudyPlan> {
    await fetchApi(`/studyplan/sessions/${sessionId}/complete`, { method: 'POST' });
    const plan = await this.getPlan();
    if (!plan) throw new Error('No active study plan.');
    return plan;
  },

  async rescheduleSession(sessionId: string, newDate: string): Promise<StudyPlan> {
    await fetchApi(`/studyplan/sessions/${sessionId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ newDate }),
    });
    const plan = await this.getPlan();
    if (!plan) throw new Error('No active study plan.');
    return plan;
  },

  async autoAdjustPlan(): Promise<StudyPlan> {
    const data = (await fetchApi('/studyplan/replan', { method: 'POST' })) as PlanEnvelope;
    const plan = merge(data);
    if (!plan) throw new Error('No active study plan.');
    return plan;
  },

  async generateSessionAssessment(
    session: StudySession,
    supplementaryMaterial?: string,
  ): Promise<SessionAssessmentQuestion[]> {
    const data = (await fetchApi('/studyplan/session-assessment', {
      method: 'POST',
      body: JSON.stringify({
        topic: session.topic,
        subject: session.subject,
        objective: session.objective,
        difficulty: session.difficulty,
        supplementaryMaterial,
      }),
    })) as { questions: SessionAssessmentQuestion[] };
    return data.questions;
  },

  async evaluateSessionUnderstanding(
    sessionId: string,
    qa: { prompt: string; correctAnswer: string; studentAnswer: string; topic: string }[],
  ): Promise<{ evaluation: SessionUnderstandingEvaluation; plan: StudyPlan | null }> {
    const data = (await fetchApi('/studyplan/session-evaluate', {
      method: 'POST',
      body: JSON.stringify({ sessionId, qa }),
    })) as { evaluation: SessionUnderstandingEvaluation };
    const plan = await this.getPlan();
    return { evaluation: data.evaluation, plan };
  },
};
