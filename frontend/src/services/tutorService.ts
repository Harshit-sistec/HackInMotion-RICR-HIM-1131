import type { ChatMessage, ChatVideo } from '@/types';
import { randomId } from '@/utils/async';
import { fetchApi } from './api';

export const SUGGESTED_PROMPTS = [
  'Explain this like I’m a beginner',
  'Give me an example',
  'Quiz me on this topic',
  'What am I doing wrong?',
  'Give me a shortcut to remember this',
];

interface StoredChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export const tutorService = {
  getSuggestedPrompts(): string[] {
    return SUGGESTED_PROMPTS;
  },

  async getHistory(): Promise<ChatMessage[]> {
    const data = (await fetchApi('/tutor/history')) as { history: StoredChatMessage[] };
    return data.history.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: m.createdAt }));
  },

  async sendMessage(history: ChatMessage[], content: string): Promise<ChatMessage> {
    const data = (await fetchApi('/tutor/chat', {
      method: 'POST',
      body: JSON.stringify({
        history: history.map((m) => ({ role: m.role, content: m.content })),
        message: content,
      }),
    })) as { content: string; video: ChatVideo | null };

    return {
      id: randomId('msg'),
      role: 'ai',
      content: data.content,
      timestamp: new Date().toISOString(),
      video: data.video ?? undefined,
    };
  },
};
