import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Send, Sparkles, LogOut, ArrowLeft, MessagesSquare } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import { groupService } from '@/services/groupService';
import { randomId } from '@/utils/async';
import type { GroupMember, GroupMessage, StudyGroup } from '@/types';

const POLL_INTERVAL_MS = 3000;

export function StudyGroups() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null);

  const refreshGroups = async () => {
    try {
      const list = await groupService.listGroups();
      setGroups(list);
      if (activeGroup) {
        const updated = list.find((g) => g.id === activeGroup.id);
        if (updated) setActiveGroup(updated);
      }
    } catch {
      // silent — chat view keeps working even if the list refresh fails
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    refreshGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = async (group: StudyGroup) => {
    try {
      const updated = await groupService.joinGroup(group.id);
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setActiveGroup(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not join this group.', 'error');
    }
  };

  const handleLeave = async (group: StudyGroup) => {
    try {
      const updated = await groupService.leaveGroup(group.id);
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setActiveGroup(null);
      showToast(`Left ${group.name}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not leave this group.', 'error');
    }
  };

  if (activeGroup) {
    return (
      <GroupChat
        group={activeGroup}
        onBack={() => setActiveGroup(null)}
        onLeave={() => handleLeave(activeGroup)}
        currentUserId={user?.id ?? ''}
      />
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Study Groups"
          subtitle="Create or join a group and study together with AI help on hand."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create Group
            </Button>
          }
        />

        {loadingGroups ? (
          <p className="text-sm text-ink-400">Loading groups…</p>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No study groups yet"
            description="Create the first group for your exam and invite others to join."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> Create Group
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card hover padding="lg" className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">
                        {group.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{group.examName}</p>
                    </div>
                    {group.isMember && <Badge tone="success">Joined</Badge>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="primary">{group.topic}</Badge>
                    <Badge tone="neutral">
                      <Users size={11} /> {group.memberCount}
                    </Badge>
                  </div>
                  <div className="mt-auto pt-4">
                    {group.isMember ? (
                      <Button fullWidth onClick={() => setActiveGroup(group)}>
                        <MessagesSquare size={16} /> Open Chat
                      </Button>
                    ) : (
                      <Button fullWidth variant="outline" onClick={() => handleJoin(group)}>
                        Join Group
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => {
          setGroups((prev) => [group, ...prev]);
          setCreateOpen(false);
          setActiveGroup(group);
        }}
      />
    </AppLayout>
  );
}

function CreateGroupModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (group: StudyGroup) => void;
}) {
  const { showToast } = useToast();
  const [examName, setExamName] = useState('');
  const [topic, setTopic] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const canSubmit = examName.trim() && topic.trim() && name.trim();

  const handleCreate = async () => {
    if (!canSubmit) return;
    setCreating(true);
    try {
      const group = await groupService.createGroup({
        examName: examName.trim(),
        topic: topic.trim(),
        name: name.trim(),
      });
      setExamName('');
      setTopic('');
      setName('');
      onCreated(group);
      showToast('Study group created.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create the group.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a study group" size="sm">
      <div className="space-y-4">
        <Input
          label="Exam name"
          placeholder="e.g. NEET 2026"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          required
        />
        <Input
          label="Topic"
          placeholder="e.g. Organic Chemistry"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        <Input
          label="Group name"
          placeholder="e.g. Chem Warriors"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button fullWidth onClick={handleCreate} loading={creating} disabled={!canSubmit}>
          Create Group
        </Button>
      </div>
    </Modal>
  );
}

function GroupChat({
  group,
  onBack,
  onLeave,
  currentUserId,
}: {
  group: StudyGroup;
  onBack: () => void;
  onLeave: () => void;
  currentUserId: string;
}) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [askingAI, setAskingAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | undefined>(undefined);

  const fetchNewMessages = async () => {
    try {
      const incoming = await groupService.getMessages(group.id, lastTimestampRef.current);
      if (incoming.length === 0) return;
      lastTimestampRef.current = incoming[incoming.length - 1].createdAt;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const merged = [...prev, ...incoming.filter((m) => !existingIds.has(m.id))];
        return merged;
      });
    } catch {
      // silent — polling retries on the next interval
    }
  };

  useEffect(() => {
    setMessages([]);
    lastTimestampRef.current = undefined;
    groupService.getGroup(group.id).then(({ members: m }) => setMembers(m));
    fetchNewMessages();
    const interval = setInterval(fetchNewMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const message = await groupService.sendMessage(group.id, text);
      setMessages((prev) => [...prev, message]);
      lastTimestampRef.current = message.createdAt;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleAskAI = async () => {
    const question = input.trim();
    if (!question || askingAI) return;
    setAskingAI(true);
    setInput('');
    try {
      const { userMessage, aiMessage } = await groupService.askAI(group.id, question);
      setMessages((prev) => [...prev, userMessage, aiMessage]);
      lastTimestampRef.current = aiMessage.createdAt;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'The AI could not answer that.', 'error');
    } finally {
      setAskingAI(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-ink-50"
          >
            <ArrowLeft size={16} /> All groups
          </button>
          <Button variant="ghost" size="sm" onClick={onLeave}>
            <LogOut size={14} /> Leave group
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card padding="none" className="flex h-[600px] flex-col">
              <div className="flex items-center justify-between border-b border-ink-200 p-4 dark:border-ink-800">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{group.name}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {group.examName} · {group.topic}
                  </p>
                </div>
                <button onClick={() => setShowMembers((s) => !s)} className="lg:hidden">
                  <Badge tone="neutral">
                    <Users size={11} /> {members.length}
                  </Badge>
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-ink-400">No messages yet. Say hello to your group.</p>
                )}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} />
                ))}
              </div>

              <div className="border-t border-ink-200 p-4 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message your group, or ask the AI…"
                    className="h-11 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAskAI}
                    loading={askingAI}
                    disabled={!input.trim() || sending}
                    className="shrink-0"
                  >
                    <Sparkles size={16} /> Ask AI
                  </Button>
                  <Button
                    onClick={handleSend}
                    loading={sending}
                    disabled={!input.trim() || askingAI}
                    className="shrink-0"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className={`${showMembers ? 'block' : 'hidden'} space-y-5 lg:block`}>
            <Card padding="lg">
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
                <Users size={16} /> Members ({members.length})
              </h3>
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    {m.name}
                  </li>
                ))}
              </ul>
            </Card>
            <Card
              padding="lg"
              className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30"
            >
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
                <Sparkles size={14} /> Ask the AI
              </h3>
              <p className="text-sm text-ink-600 dark:text-ink-300">
                Type your question and press "Ask AI" — Nova answers using this group's exam and topic as context,
                visible to everyone.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MessageBubble({ message, isOwn }: { message: GroupMessage; isOwn: boolean }) {
  const isAI = message.role === 'ai';
  return (
    <motion.div
      key={message.id ?? randomId('m')}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isOwn && !isAI ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
          isAI ? 'bg-gradient-to-br from-primary-600 to-accent-500' : 'bg-primary-600'
        }`}
      >
        {isAI ? <Sparkles size={14} /> : message.senderName.slice(0, 1).toUpperCase()}
      </div>
      <div className={`max-w-[80%]`}>
        {!isOwn && <p className="mb-1 px-1 text-xs font-medium text-ink-400">{message.senderName}</p>}
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            isAI
              ? 'rounded-bl-md border border-primary-200 bg-primary-50 text-ink-800 dark:border-primary-800 dark:bg-primary-900/20 dark:text-ink-100'
              : isOwn
                ? 'rounded-br-md bg-primary-600 text-white'
                : 'rounded-bl-md bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100'
          }`}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}
