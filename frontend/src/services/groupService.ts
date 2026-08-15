import type { GroupMember, GroupMessage, StudyGroup } from '@/types';
import { fetchApi } from './api';

export const groupService = {
  async listGroups(): Promise<StudyGroup[]> {
    const data = (await fetchApi('/groups')) as { groups: StudyGroup[] };
    return data.groups;
  },

  async createGroup(input: { examName: string; topic: string; name: string }): Promise<StudyGroup> {
    const data = (await fetchApi('/groups', { method: 'POST', body: JSON.stringify(input) })) as { group: StudyGroup };
    return data.group;
  },

  async getGroup(groupId: string): Promise<{ group: StudyGroup; members: GroupMember[] }> {
    return (await fetchApi(`/groups/${groupId}`)) as { group: StudyGroup; members: GroupMember[] };
  },

  async joinGroup(groupId: string): Promise<StudyGroup> {
    const data = (await fetchApi(`/groups/${groupId}/join`, { method: 'POST' })) as { group: StudyGroup };
    return data.group;
  },

  async leaveGroup(groupId: string): Promise<StudyGroup> {
    const data = (await fetchApi(`/groups/${groupId}/leave`, { method: 'POST' })) as { group: StudyGroup };
    return data.group;
  },

  async getMessages(groupId: string, after?: string): Promise<GroupMessage[]> {
    const query = after ? `?after=${encodeURIComponent(after)}` : '';
    const data = (await fetchApi(`/groups/${groupId}/messages${query}`)) as { messages: GroupMessage[] };
    return data.messages;
  },

  async sendMessage(groupId: string, content: string): Promise<GroupMessage> {
    const data = (await fetchApi(`/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })) as { message: GroupMessage };
    return data.message;
  },

  async askAI(groupId: string, question: string): Promise<{ userMessage: GroupMessage; aiMessage: GroupMessage }> {
    return (await fetchApi(`/groups/${groupId}/ask-ai`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    })) as { userMessage: GroupMessage; aiMessage: GroupMessage };
  },
};
