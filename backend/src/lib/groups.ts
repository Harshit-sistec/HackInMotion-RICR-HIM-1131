import { getDb } from './db.js';

export interface StoredGroup {
  id: string;
  examName: string;
  topic: string;
  name: string;
  createdBy: string;
  memberIds: string[];
  createdAt: string;
}

export interface StoredGroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

async function groupsCollection() {
  const db = await getDb();
  const col = db.collection<StoredGroup>('groups');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  return col;
}

async function messagesCollection() {
  const db = await getDb();
  const col = db.collection<StoredGroupMessage>('group_messages');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ groupId: 1, createdAt: 1 }).catch(() => {});
  return col;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const groupStore = {
  async list(): Promise<StoredGroup[]> {
    const col = await groupsCollection();
    return col.find({}).sort({ createdAt: -1 }).toArray();
  },

  async findById(id: string): Promise<StoredGroup | undefined> {
    const col = await groupsCollection();
    const doc = await col.findOne({ id });
    return doc ?? undefined;
  },

  async create(input: { examName: string; topic: string; name: string; createdBy: string }): Promise<StoredGroup> {
    const col = await groupsCollection();
    const group: StoredGroup = {
      id: newId('group'),
      examName: input.examName,
      topic: input.topic,
      name: input.name,
      createdBy: input.createdBy,
      memberIds: [input.createdBy],
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(group);
    return group;
  },

  async addMember(groupId: string, userId: string): Promise<StoredGroup | undefined> {
    const col = await groupsCollection();
    await col.updateOne({ id: groupId }, { $addToSet: { memberIds: userId } });
    return this.findById(groupId);
  },

  async removeMember(groupId: string, userId: string): Promise<StoredGroup | undefined> {
    const col = await groupsCollection();
    await col.updateOne({ id: groupId }, { $pull: { memberIds: userId } });
    return this.findById(groupId);
  },
};

export const groupMessageStore = {
  async listSince(groupId: string, after?: string): Promise<StoredGroupMessage[]> {
    const col = await messagesCollection();
    const query: Record<string, unknown> = { groupId };
    if (after) query.createdAt = { $gt: after };
    return col.find(query).sort({ createdAt: 1 }).limit(300).toArray();
  },

  async create(input: {
    groupId: string;
    senderId: string;
    senderName: string;
    role: 'user' | 'ai';
    content: string;
  }): Promise<StoredGroupMessage> {
    const col = await messagesCollection();
    const message: StoredGroupMessage = {
      id: newId('msg'),
      groupId: input.groupId,
      senderId: input.senderId,
      senderName: input.senderName,
      role: input.role,
      content: input.content,
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(message);
    return message;
  },
};
