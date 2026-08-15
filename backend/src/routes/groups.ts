import { Router } from 'express';
import { groupStore, groupMessageStore, type StoredGroup } from '../lib/groups.js';
import { userStore } from '../lib/users.js';
import { generateTutorReply, parseTutorReply, GeminiError } from '../lib/gemini.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const groupsRouter = Router();

function summarize(group: StoredGroup, userId: string) {
  return {
    id: group.id,
    examName: group.examName,
    topic: group.topic,
    name: group.name,
    createdBy: group.createdBy,
    memberCount: group.memberIds.length,
    isMember: group.memberIds.includes(userId),
    createdAt: group.createdAt,
  };
}

async function requireMembership(groupId: string, userId: string): Promise<StoredGroup | null> {
  const group = await groupStore.findById(groupId);
  if (!group || !group.memberIds.includes(userId)) return null;
  return group;
}

groupsRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const groups = await groupStore.list();
  res.json({ data: { groups: groups.map((g) => summarize(g, req.userId!)) } });
});

groupsRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { examName, topic, name } = req.body ?? {};
  if (!examName || typeof examName !== 'string' || !examName.trim()) {
    res.status(400).json({ error: { message: 'Exam name is required.' } });
    return;
  }
  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    res.status(400).json({ error: { message: 'Topic is required.' } });
    return;
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: { message: 'Group name is required.' } });
    return;
  }

  const group = await groupStore.create({
    examName: examName.trim(),
    topic: topic.trim(),
    name: name.trim(),
    createdBy: req.userId!,
  });
  res.json({ data: { group: summarize(group, req.userId!) } });
});

groupsRouter.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const group = await groupStore.findById(req.params.id);
  if (!group) {
    res.status(404).json({ error: { message: 'Group not found.' } });
    return;
  }
  const members = await Promise.all(
    group.memberIds.map(async (id) => {
      const user = await userStore.findById(id);
      return user ? { id: user.id, name: user.full_name } : { id, name: 'Unknown member' };
    }),
  );
  res.json({ data: { group: summarize(group, req.userId!), members } });
});

groupsRouter.post('/:id/join', requireAuth, async (req: AuthedRequest, res) => {
  const group = await groupStore.findById(req.params.id);
  if (!group) {
    res.status(404).json({ error: { message: 'Group not found.' } });
    return;
  }
  const updated = await groupStore.addMember(req.params.id, req.userId!);
  res.json({ data: { group: summarize(updated!, req.userId!) } });
});

groupsRouter.post('/:id/leave', requireAuth, async (req: AuthedRequest, res) => {
  const group = await groupStore.findById(req.params.id);
  if (!group) {
    res.status(404).json({ error: { message: 'Group not found.' } });
    return;
  }
  const updated = await groupStore.removeMember(req.params.id, req.userId!);
  res.json({ data: { group: summarize(updated!, req.userId!) } });
});

groupsRouter.get('/:id/messages', requireAuth, async (req: AuthedRequest, res) => {
  const group = await requireMembership(req.params.id, req.userId!);
  if (!group) {
    res.status(403).json({ error: { message: 'Join this group to view its chat.' } });
    return;
  }
  const after = typeof req.query.after === 'string' ? req.query.after : undefined;
  const messages = await groupMessageStore.listSince(req.params.id, after);
  res.json({ data: { messages } });
});

groupsRouter.post('/:id/messages', requireAuth, async (req: AuthedRequest, res) => {
  const group = await requireMembership(req.params.id, req.userId!);
  if (!group) {
    res.status(403).json({ error: { message: 'Join this group to send messages.' } });
    return;
  }
  const { content } = req.body ?? {};
  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: { message: 'Message content is required.' } });
    return;
  }
  const sender = await userStore.findById(req.userId!);
  const message = await groupMessageStore.create({
    groupId: group.id,
    senderId: req.userId!,
    senderName: sender?.full_name ?? 'Member',
    role: 'user',
    content: content.trim(),
  });
  res.json({ data: { message } });
});

groupsRouter.post('/:id/ask-ai', requireAuth, async (req: AuthedRequest, res) => {
  const group = await requireMembership(req.params.id, req.userId!);
  if (!group) {
    res.status(403).json({ error: { message: 'Join this group to ask the AI.' } });
    return;
  }
  const { question } = req.body ?? {};
  if (!question || typeof question !== 'string' || !question.trim()) {
    res.status(400).json({ error: { message: 'A question is required.' } });
    return;
  }

  const sender = await userStore.findById(req.userId!);
  const userMessage = await groupMessageStore.create({
    groupId: group.id,
    senderId: req.userId!,
    senderName: sender?.full_name ?? 'Member',
    role: 'user',
    content: question.trim(),
  });

  try {
    const contextualized = `This question comes from a study group preparing for "${group.examName}", focused on the topic "${group.topic}". The student asks: ${question.trim()}`;
    const raw = await generateTutorReply([], contextualized);
    const { content } = parseTutorReply(raw);
    const aiMessage = await groupMessageStore.create({
      groupId: group.id,
      senderId: 'ai',
      senderName: 'Nova AI',
      role: 'ai',
      content,
    });
    res.json({ data: { userMessage, aiMessage } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Group AI reply failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong reaching the AI. Please try again.' } });
  }
});
