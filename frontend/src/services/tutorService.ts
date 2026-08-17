import type { ChatMessage, ChatVideo, Conversation } from '@/types';
import { randomId } from '@/utils/async';
import { fetchApi, API_URL } from './api';

const TOKEN_KEY = 'nova_auth_token';

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
  attachmentName: string | null;
  createdAt: string;
}

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

function toChatMessage(m: StoredChatMessage): ChatMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.createdAt,
    attachmentName: m.attachmentName ?? undefined,
  };
}

export const tutorService = {
  getSuggestedPrompts(): string[] {
    return SUGGESTED_PROMPTS;
  },

  async listConversations(): Promise<Conversation[]> {
    const data = (await fetchApi('/tutor/conversations')) as { conversations: Conversation[] };
    return data.conversations;
  },

  async createConversation(): Promise<Conversation> {
    const data = (await fetchApi('/tutor/conversations', { method: 'POST', body: JSON.stringify({}) })) as {
      conversation: Conversation;
    };
    return data.conversation;
  },

  async renameConversation(id: string, title: string): Promise<string> {
    const data = (await fetchApi(`/tutor/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    })) as { title: string };
    return data.title;
  },

  async deleteConversation(id: string): Promise<void> {
    await fetchApi(`/tutor/conversations/${id}`, { method: 'DELETE' });
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const data = (await fetchApi(`/tutor/conversations/${conversationId}/messages`)) as {
      history: StoredChatMessage[];
    };
    return data.history.map(toChatMessage);
  },

  async sendMessage(
    conversationId: string,
    content: string,
    file?: File | null,
  ): Promise<{ reply: ChatMessage; title: string | null }> {
    const token = localStorage.getItem(TOKEN_KEY);
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('message', content);
    if (file) formData.append('file', file);

    let response: Response;
    try {
      response = await fetch(`${API_URL}/tutor/chat`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
    } catch {
      throw new Error('Could not reach the server. Check your connection and try again.');
    }

    const data = (await parseResponse(response)) as {
      content: string;
      video: ChatVideo | null;
      title: string | null;
    };

    return {
      reply: {
        id: randomId('msg'),
        role: 'ai',
        content: data.content,
        timestamp: new Date().toISOString(),
        video: data.video ?? undefined,
      },
      title: data.title,
    };
  },
};
