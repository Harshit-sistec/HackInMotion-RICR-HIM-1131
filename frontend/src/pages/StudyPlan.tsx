import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Lock,
  Play,
  RefreshCw,
  Calendar,
  Clock,
  Target,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useAppData } from '@/store/AppDataContext';
import { useToast } from '@/store/ToastContext';
import type { StudySession } from '@/types';

const STATUS_CONFIG = {
  completed: { icon: Check, tone: 'success' as const, label: 'Completed', color: 'bg-success-500' },
  'in-progress': { icon: Play, tone: 'accent' as const, label: 'In Progress', color: 'bg-accent-500' },
  upcoming: { icon: Clock, tone: 'primary' as const, label: 'Upcoming', color: 'bg-primary-500' },
  locked: { icon: Lock, tone: 'neutral' as const, label: 'Locked', color: 'bg-ink-300' },
  missed: { icon: AlertTriangle, tone: 'error' as const, label: 'Missed', color: 'bg-error-500' },
};

export function StudyPlan() {
  const { plan, goal, markSessionComplete, autoAdjustPlan, rescheduleSession } = useAppData();
  const { showToast } = useToast();
  const [adjusting, setAdjusting] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<StudySession | null>(null);
  const [newDate, setNewDate] = useState('');

  if (!plan) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader title="Your Personalized Study Plan" />
          <EmptyState
            icon={Target}
            title="No study plan yet"
            description="Complete your onboarding to generate a personalized plan."
            action={<Link to="/onboarding"><Button>Complete onboarding</Button></Link>}
          />
        </div>
      </AppLayout>
    );
  }

  const daysRemaining = Math.max(0, Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const hasMissed = plan.sessions.some((s) => s.status === 'missed');

  const handleAutoAdjust = async () => {
    setAdjusting(true);
    await autoAdjustPlan();
    setAdjusting(false);
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !newDate) return;
    await rescheduleSession(rescheduleTarget.id, new Date(newDate).toISOString());
    setRescheduleTarget(null);
    setNewDate('');
  };

  const handleComplete = async (sessionId: string) => {
    await markSessionComplete(sessionId);
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Your Personalized Study Plan"
          subtitle={goal?.title ?? plan.goalTitle}
          action={
            hasMissed ? (
              <Button onClick={handleAutoAdjust} loading={adjusting}>
                <RefreshCw size={16} /> Auto-adjust
              </Button>
            ) : undefined
          }
        />

        {/* Plan summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={Target} label="Goal" value={goal?.title ?? plan.goalTitle} />
          <SummaryCard icon={Calendar} label="Exam Date" value={new Date(plan.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
          <SummaryCard icon={Clock} label="Days Remaining" value={`${daysRemaining} days`} />
          <SummaryCard icon={Sparkles} label="Completion" value={`${plan.completionPercent}%`} />
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <Card>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-ink-700 dark:text-ink-200">Plan completion</span>
              <span className="font-semibold text-ink-900 dark:text-ink-50">{plan.completionPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500"
                initial={{ width: 0 }}
                animate={{ width: `${plan.completionPercent}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {plan.lastAdaptedAt && (
              <p className="mt-2 text-xs text-accent-600 dark:text-accent-400">
                <RefreshCw size={11} className="inline" /> Last adapted {new Date(plan.lastAdaptedAt).toLocaleDateString()}
              </p>
            )}
          </Card>
        </div>

        {/* Adaptive banner */}
        {hasMissed && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
            <Card padding="lg" className="border-warning-200 bg-warning-50 dark:border-warning-700 dark:bg-warning-700/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-100 text-warning-700 dark:bg-warning-700/40 dark:text-warning-200">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">Your plan needs adjustment</h3>
                    <p className="text-sm text-ink-600 dark:text-ink-300">
                      You missed a session. Auto-adjust to reshuffle, or reschedule manually.
                    </p>
                  </div>
                </div>
                <Button onClick={handleAutoAdjust} loading={adjusting} className="shrink-0">
                  <RefreshCw size={14} /> Auto-adjust my plan
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Timeline */}
        <div className="mt-6">
          <h2 className="mb-4 font-display text-lg font-bold text-ink-900 dark:text-ink-50">Timeline</h2>
          <div className="relative">
            <div className="absolute left-[19px] top-0 h-full w-0.5 bg-ink-200 dark:bg-ink-800" />
            <div className="space-y-4">
              {plan.sessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <SessionRow
                    session={session}
                    onComplete={() => handleComplete(session.id)}
                    onReschedule={() => { setRescheduleTarget(session); setNewDate(session.date.slice(0, 10)); }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!rescheduleTarget} onClose={() => setRescheduleTarget(null)} title="Reschedule session" size="sm">
        {rescheduleTarget && (
          <div>
            <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
              Move <span className="font-semibold text-ink-900 dark:text-ink-50">{rescheduleTarget.topic}</span> to a new date.
            </p>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm dark:border-ink-700 dark:bg-ink-900"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
              <Button onClick={handleReschedule} disabled={!newDate}>Reschedule</Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-400 dark:text-ink-500">{label}</p>
          <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function SessionRow({
  session,
  onComplete,
  onReschedule,
}: {
  session: StudySession;
  onComplete: () => void;
  onReschedule: () => void;
}) {
  const config = STATUS_CONFIG[session.status];
  const StatusIcon = config.icon;
  const isLocked = session.status === 'locked';
  const isCompleted = session.status === 'completed';

  return (
    <div className="relative flex gap-4">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white text-white dark:border-ink-950 ${config.color}`}
      >
        <StatusIcon size={16} />
      </div>
      <Card
        padding="md"
        className={`flex-1 ${isLocked ? 'opacity-60' : ''} ${isCompleted ? 'border-success-200 dark:border-success-700' : ''}`}
        hover={!isLocked}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink-400 dark:text-ink-500">Day {session.day}</span>
              <Badge tone={config.tone}>{config.label}</Badge>
            </div>
            <h3 className="mt-1 font-display text-base font-semibold text-ink-900 dark:text-ink-50">{session.topic}</h3>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{session.objective}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="neutral"><Clock size={11} /> {session.estimatedMinutes} min</Badge>
              <Badge tone="accent">{session.difficulty}</Badge>
              <Badge tone="primary">{session.subject}</Badge>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {!isLocked && !isCompleted && (
              <Link to="/app/session">
                <Button size="sm"><Play size={14} /> Start</Button>
              </Link>
            )}
            {!isCompleted && (
              <Button size="sm" variant="success" onClick={onComplete}>
                <Check size={14} /> Mark done
              </Button>
            )}
            {!isLocked && (
              <>
                <Button size="sm" variant="outline" onClick={onReschedule}>Reschedule</Button>
                <Link to="/app/tutor">
                  <Button size="sm" variant="ghost"><MessageSquare size={14} /></Button>
                </Link>
              </>
            )}
          </div>
        </div>
        {!isLocked && session.conceptsTotal > 0 && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500 transition-all"
                style={{ width: `${(session.conceptsDone / session.conceptsTotal) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-400">{session.conceptsDone}/{session.conceptsTotal} concepts</p>
          </div>
        )}
      </Card>
    </div>
  );
}
