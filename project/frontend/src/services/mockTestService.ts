import type { MockTest, MockTestConfig, MockTestResult, MockTestSubmission, Question } from '@/types';
import { readStorage, writeStorage } from '@/utils/storage';
import { delay, randomId } from '@/utils/async';
import { fetchApi } from './api';

const RESULTS_KEY = 'nova_mock_test_results';

export const mockTestService = {
  async generateTest(config: MockTestConfig): Promise<MockTest> {
    const data = (await fetchApi('/mocktest/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    })) as { questions: Omit<Question, 'id'>[] };

    const questions: Question[] = data.questions.map((q) => ({ ...q, id: randomId('q') }));

    return {
      id: randomId('test'),
      config,
      questions,
      createdAt: new Date().toISOString(),
    };
  },

  async submitTest(test: MockTest, submission: MockTestSubmission): Promise<MockTestResult> {
    await delay(900);
    if (Object.keys(submission.answers).length < test.questions.length) {
      throw new Error('Please answer all questions before submitting.');
    }

    const perQuestion = test.questions.map((q) => ({
      questionId: q.id,
      correct: submission.answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase(),
    }));
    const correctCount = perQuestion.filter((p) => p.correct).length;
    const weakAreas = Array.from(
      new Set(
        test.questions
          .filter((q) => !perQuestion.find((p) => p.questionId === q.id)?.correct)
          .map((q) => q.topic),
      ),
    );

    const topicTotals = new Map<string, { correct: number; total: number }>();
    test.questions.forEach((q) => {
      const entry = topicTotals.get(q.topic) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (perQuestion.find((p) => p.questionId === q.id)?.correct) entry.correct += 1;
      topicTotals.set(q.topic, entry);
    });
    const topicBreakdown = Array.from(topicTotals.entries()).map(([topic, v]) => ({ topic, ...v }));

    const result: MockTestResult = {
      testId: test.id,
      takenAt: new Date().toISOString(),
      scorePercent: Math.round((correctCount / test.questions.length) * 100),
      correctCount,
      totalQuestions: test.questions.length,
      weakAreas,
      perQuestion,
      topicBreakdown,
    };

    const existing = readStorage<MockTestResult[]>(RESULTS_KEY, []);
    writeStorage(RESULTS_KEY, [...existing, result]);
    return result;
  },

  getResults(): MockTestResult[] {
    return readStorage<MockTestResult[]>(RESULTS_KEY, []);
  },
};
