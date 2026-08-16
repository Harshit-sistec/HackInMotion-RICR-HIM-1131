import type { DocumentAnalysisResponse, MockTest, Question } from '@/types';
import { API_URL } from './api';

const TOKEN_KEY = 'nova_auth_token';
const SECONDS_PER_QUESTION = 90;

interface ApiEnvelope {
  data?: unknown;
  error?: { message?: string };
}

async function parseResponse(response: Response): Promise<unknown> {
  let json: ApiEnvelope;
  try {
    json = await response.json();
  } catch {
    throw new Error('The server returned an unexpected response. Please try again.');
  }
  if (!response.ok || json.error) {
    throw new Error(json.error?.message || 'Something went wrong. Please try again.');
  }
  return json.data;
}

export const documentService = {
  async analyze(file: File): Promise<DocumentAnalysisResponse> {
    const token = localStorage.getItem(TOKEN_KEY);
    const formData = new FormData();
    formData.append('file', file);

    let response: Response;
    try {
      response = await fetch(`${API_URL}/documents/analyze`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
    } catch {
      throw new Error('Could not reach the server. Check your connection and try again.');
    }

    return (await parseResponse(response)) as DocumentAnalysisResponse;
  },

  async generateMockTestFromDocument(
    documentId: string,
    fileName: string,
    config: { numQuestions: number; difficulty: 'easy' | 'medium' | 'hard' | 'mixed' },
  ): Promise<MockTest> {
    const token = localStorage.getItem(TOKEN_KEY);

    let response: Response;
    try {
      response = await fetch(`${API_URL}/documents/generate-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ documentId, numQuestions: config.numQuestions, difficulty: config.difficulty }),
      });
    } catch {
      throw new Error('Could not reach the server. Check your connection and try again.');
    }

    const data = (await parseResponse(response)) as { testId: string; questions: Question[] };

    return {
      id: data.testId,
      config: {
        subject: fileName,
        topics: [],
        difficulty: config.difficulty,
        numQuestions: data.questions.length,
      },
      questions: data.questions,
      createdAt: new Date().toISOString(),
      timeLimitSeconds: data.questions.length * SECONDS_PER_QUESTION,
    };
  },
};
