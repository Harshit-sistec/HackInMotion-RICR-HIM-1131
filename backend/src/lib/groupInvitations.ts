import { getDb } from './db.js';

export interface StoredGroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  invitedUserId: string;
  invitedEmail: string;
  invitedByUserId: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

async function invitationsCollection() {
  const db = await getDb();
  const col = db.collection<StoredGroupInvitation>('group_invitations');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ invitedUserId: 1, status: 1 }).catch(() => {});
  await col.createIndex({ groupId: 1, invitedUserId: 1 }).catch(() => {});
  return col;
}

function newId(): string {
  return `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const groupInvitationStore = {
  async findPending(groupId: string, invitedUserId: string): Promise<StoredGroupInvitation | undefined> {
    const col = await invitationsCollection();
    const doc = await col.findOne({ groupId, invitedUserId, status: 'pending' });
    return doc ?? undefined;
  },

  async findById(id: string): Promise<StoredGroupInvitation | undefined> {
    const col = await invitationsCollection();
    const doc = await col.findOne({ id });
    return doc ?? undefined;
  },

  async create(
    input: Omit<StoredGroupInvitation, 'id' | 'status' | 'createdAt'>,
  ): Promise<StoredGroupInvitation> {
    const col = await invitationsCollection();
    const invitation: StoredGroupInvitation = {
      ...input,
      id: newId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await col.insertOne({ ...invitation });
    return invitation;
  },

  async listForUser(invitedUserId: string, status?: string): Promise<StoredGroupInvitation[]> {
    const col = await invitationsCollection();
    const query: Record<string, unknown> = { invitedUserId };
    if (status) query.status = status;
    return col.find(query).sort({ createdAt: -1 }).toArray();
  },

  async listForGroup(groupId: string): Promise<StoredGroupInvitation[]> {
    const col = await invitationsCollection();
    return col.find({ groupId }).sort({ createdAt: -1 }).toArray();
  },

  async respond(id: string, status: 'accepted' | 'rejected'): Promise<StoredGroupInvitation | undefined> {
    const col = await invitationsCollection();
    const doc = await col.findOneAndUpdate(
      { id, status: 'pending' },
      { $set: { status, respondedAt: new Date().toISOString() } },
    );
    return doc ?? undefined;
  },
};
