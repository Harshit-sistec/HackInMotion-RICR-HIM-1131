import type { MockTest, MockTestConfig, MockTestResult, MockTestSubmission, Question } from '@/types';
import { fetchApi } from './api';

const SECONDS_PER_QUESTION = 90;

export const mockTestService = {
  async generateTest(config: MockTestConfig): Promise<MockTest> {
    const data = (await fetchApi('/mocktest/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    })) as { testId: string; questions: Question[] };

    return {
      id: data.testId,
      config,
      questions: data.questions,
      createdAt: new Date().toISOString(),
      timeLimitSeconds: data.questions.length * SECONDS_PER_QUESTION,
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
        testId: test.id,
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
