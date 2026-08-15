import type { MockTest, MockTestConfig, MockTestResult, MockTestSubmission, Question } from '@/types';
import { randomId } from '@/utils/async';
import { fetchApi } from './api';

const SECONDS_PER_QUESTION = 90;

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
      timeLimitSeconds: questions.length * SECONDS_PER_QUESTION,
    };
  },

  async suggestTopics(subject: string, weakTopics: string[]): Promise<string[]> {
    const data = (await fetchApi('/mocktest/suggest-topics', {
      method: 'POST',
      body: JSON.stringify({ subject, weakTopics }),
    })) as { topics: string[] };
    return data.topics;
  },

  async submitTest(test: MockTest, submission: MockTestSubmission, timeSpentSeconds = 0): Promise<MockTestResult> {
    return (await fetchApi('/mocktest/submit', {
      method: 'POST',
      body: JSON.stringify({
        subject: test.config.subject,
        questions: test.questions.map((q) => ({ id: q.id, correctAnswer: q.correctAnswer, topic: q.topic })),
        answers: submission.answers,
        timeSpentSeconds,
      }),
    })) as MockTestResult;
  },

  async getResults(): Promise<MockTestResult[]> {
    const data = (await fetchApi('/mocktest/results')) as { results: MockTestResult[] };
    return data.results;
  },
};
