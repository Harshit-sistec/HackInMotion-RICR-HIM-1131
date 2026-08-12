import type { ChatMessage } from '@/types';
import { api } from '@/services/api';

export const SUGGESTED_PROMPTS = [
  'Explain this like I’m a beginner',
  'Give me an example',
  'Quiz me on this topic',
  'Give me a shortcut to remember this',
];

export const tutorService = {
  getSuggestedPrompts(): string[] {
    return SUGGESTED_PROMPTS;
  },

  async getOrCreateSession(topicId: string, userId: string): Promise<string> {
    try {
      // Check if session already exists for this topic
      const { data: existing } = await api
        .from('chat_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0].id;
      }

      // Create new session
      const { data: created } = await api
        .from('chat_sessions')
        .insert({
          topic_id: topicId,
          user_id: userId,
        })
        .select()
        .single();

      if (!created) throw new Error('Failed to create chat session.');
      return created.id;
    } catch (err) {
      console.error('getOrCreateSession error:', err);
      throw err;
    }
  },

  async getOrCreateGeneralSession(userId: string): Promise<string> {
    try {
      // Check if general session exists (topic_id is null)
      const { data: existing } = await api
        .from('chat_sessions')
        .select('id')
        .eq('user_id', userId)
        .is('topic_id', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0].id;
      }

      // Create new general session
      const { data: created } = await api
        .from('chat_sessions')
        .insert({
          user_id: userId,
          topic_id: null
        })
        .select()
        .single();

      if (!created) throw new Error('Failed to create general session.');
      return created.id;
    } catch (err) {
      console.error('getOrCreateGeneralSession error:', err);
      throw err;
    }
  },

  async loadChatHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data: messages } = await api
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!messages) return [];

      return messages.map((m: any) => ({
        id: m.id,
        role: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content,
        timestamp: m.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('loadChatHistory error:', err);
      return [];
    }
  },

  async sendMessage(
    history: ChatMessage[],
    content: string,
    sessionId: string,
    topicName?: string
  ): Promise<ChatMessage> {
    try {
      // 1. Save user message to database
      await api.from('chat_messages').insert({
        chat_session_id: sessionId,
        role: 'user',
        content,
      });

      // 2. Call backend function vertex-chat
      const { data: replyData, error } = await api.functions.invoke('vertex-chat', {
        body: {
          message: content,
          topicName: topicName || 'General Studies',
          chatSessionId: sessionId,
        },
      });

      if (error) throw error;
      if (!replyData || !replyData.success) {
        throw new Error(replyData?.error || 'Invalid AI response format.');
      }

      const aiText = replyData.data?.text || replyData.data?.response || 'I received your message!';

      // 3. Save assistant message to database
      const { data: savedMsg } = await api.from('chat_messages').insert({
        chat_session_id: sessionId,
        role: 'assistant',
        content: aiText,
      }).select().single();

      return {
        id: savedMsg?.id || `msg_${Date.now()}`,
        role: 'ai',
        content: aiText,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('sendMessage error:', err);
      
      // Fallback
      const fallbackText = `I'm here to help you study. I could not connect to the live AI service right now. Please check if GEMINI_API_KEY is configured on the backend server.`;
      return {
        id: `msg_err_${Date.now()}`,
        role: 'ai',
        content: fallbackText,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
