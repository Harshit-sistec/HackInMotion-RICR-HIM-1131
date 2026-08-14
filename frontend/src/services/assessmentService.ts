import type { AssessmentResult, Question } from '@/types';
import { DIAGNOSTIC_QUESTIONS, knowledgeAnalysisFromAnswers } from '@/data/mockData';
import { readStorage, writeStorage } from '@/utils/storage';
import { delay, randomId } from '@/utils/async';

const RESULTS_KEY = 'nova_assessment_results';

export interface DiagnosticOutcome {
  result: AssessmentResult;
  strong: string[];
  improve: string[];
  critical: string[];
}

export const assessmentService = {
  async getDiagnosticQuestions(): Promise<Question[]> {
    await delay(500);
    return DIAGNOSTIC_QUESTIONS;
  },

  async submitDiagnostic(answers: Record<string, string>): Promise<DiagnosticOutcome> {
    await delay(900);
    if (Object.keys(answers).length < DIAGNOSTIC_QUESTIONS.length) {
      throw new Error('Please answer all questions before submitting.');
    }
    const { strong, improve, critical } = knowledgeAnalysisFromAnswers(answers);
    const correctCount = DIAGNOSTIC_QUESTIONS.filter((q) => answers[q.id] === q.correctAnswer).length;
    const result: AssessmentResult = {
      id: randomId('assessment'),
      takenAt: new Date().toISOString(),
      totalQuestions: DIAGNOSTIC_QUESTIONS.length,
      correctCount,
      scorePercent: Math.round((correctCount / DIAGNOSTIC_QUESTIONS.length) * 100),
      weakTopics: [...critical, ...improve],
      strongTopics: strong,
    };
    const existing = readStorage<AssessmentResult[]>(RESULTS_KEY, []);
    writeStorage(RESULTS_KEY, [...existing, result]);
    return { result, strong, improve, critical };
  },

  getResults(): AssessmentResult[] {
    return readStorage<AssessmentResult[]>(RESULTS_KEY, []);
  },
};
