import type { MockTest, MockTestConfig, MockTestResult, MockTestSubmission } from '@/types';
import { QUESTION_BANK } from '@/data/mockData';
import { readStorage, writeStorage } from '@/utils/storage';
import { delay, randomId } from '@/utils/async';

const RESULTS_KEY = 'nova_mock_test_results';

export const mockTestService = {
  async generateTest(config: MockTestConfig): Promise<MockTest> {
    await delay(1200);
    let pool = QUESTION_BANK.filter((q) => config.topics.length === 0 || config.topics.includes(q.topic));
    if (config.difficulty !== 'mixed') pool = pool.filter((q) => q.difficulty === config.difficulty);
    if (pool.length < config.numQuestions) pool = QUESTION_BANK;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, config.numQuestions);

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

    const result: MockTestResult = {
      testId: test.id,
      scorePercent: Math.round((correctCount / test.questions.length) * 100),
      correctCount,
      totalQuestions: test.questions.length,
      weakAreas,
      perQuestion,
    };

    const existing = readStorage<MockTestResult[]>(RESULTS_KEY, []);
    writeStorage(RESULTS_KEY, [...existing, result]);
    return result;
  },

  getResults(): MockTestResult[] {
    return readStorage<MockTestResult[]>(RESULTS_KEY, []);
  },
};
