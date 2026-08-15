import type {
  AvailableTime,
  DiagnosticEvaluation,
  GoalType,
  KnowledgeLevel,
  LearningGoal,
  SessionAssessmentQuestion,
} from '@/types';
import { fetchApi } from './api';

export interface CreateGoalInput {
  type: GoalType;
  title: string;
  subjects: string[];
  topics: string[];
  deadline: string;
  availableTime: AvailableTime;
  knowledgeLevel: KnowledgeLevel;
}

export const goalService = {
  async getCurrent(): Promise<LearningGoal | null> {
    const data = (await fetchApi('/goals/current')) as { goal: LearningGoal | null };
    return data.goal;
  },

  async createGoal(input: CreateGoalInput): Promise<LearningGoal> {
    if (!input.title.trim()) throw new Error('Give your goal a name.');
    if (!input.deadline) throw new Error('Pick a target deadline.');
    const data = (await fetchApi('/goals', { method: 'POST', body: JSON.stringify(input) })) as { goal: LearningGoal };
    return data.goal;
  },

  async runDiagnostic(subjects: string[], topics: string[], documentId?: string): Promise<SessionAssessmentQuestion[]> {
    const data = (await fetchApi('/goals/diagnostic', {
      method: 'POST',
      body: JSON.stringify({ subjects, topics, documentId }),
    })) as { questions: SessionAssessmentQuestion[] };
    return data.questions;
  },

  async evaluateDiagnostic(
    subjects: string[],
    qa: { prompt: string; correctAnswer: string; studentAnswer: string; topic: string }[],
  ): Promise<DiagnosticEvaluation> {
    return (await fetchApi('/goals/diagnostic/evaluate', {
      method: 'POST',
      body: JSON.stringify({ subjects, qa }),
    })) as DiagnosticEvaluation;
  },

  async resetGoal(): Promise<void> {
    await fetchApi('/goals/current', { method: 'DELETE' });
  },
};
