import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame,
  Clock,
  BookOpen,
  Target,
  Play,
  ArrowRight,
  Sparkles,
  Calendar,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/store/AuthContext';
import { useAppData } from '@/store/AppDataContext';

const STRENGTH_BARS = [
  { topic: 'Dynamic Programming', value: 42, tone: 'error' },
  { topic: 'Graph Algorithms', value: 58, tone: 'warning' },
  { topic: 'DBMS', value: 81, tone: 'success' },
  { topic: 'Operating Systems', value: 73, tone: 'success' },
  { topic: 'Computer Networks', value: 67, tone: 'accent' },
];

export function Dashboard() {
  const { user } = useAuth();
  const { plan, progress, weakTopics, autoAdjustPlan, loadDemoData } = useAppData();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name.split(' ')[0] ?? 'there';

  const todaySession = useMemo(
    () => plan?.sessions.find((s) => s.status === 'in-progress') ?? plan?.sessions.find((s) => s.status === 'upcoming'),
    [plan],
  );

  const upcoming = useMemo(
    () => plan?.sessions.filter((s) => s.status === 'upcoming' || s.status === 'in-progress').slice(0, 4) ?? [],
    [plan],
  );

  const hasMissed = plan?.sessions.some((s) => s.status === 'missed') ?? false;

  if (!plan) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <PageHeader title={`Welcome, ${firstName}!`} subtitle="Let's get your study journey started." />
          <EmptyState
            icon={Target}
            title="Create your first learning goal"
            description="Set a goal, take the diagnostic, and Nova will generate your personalized plan."
            action={
              <Link to="/onboarding">
                <Button>Start onboarding <ArrowRight size={16} /></Button>
              </Link>
            }
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title={`${greeting}, ${firstName} 👋`}
          subtitle="Let's make today's study session count."
          action={
            <Button variant="outline" size="sm" onClick={loadDemoData}>
              <Sparkles size={14} /> Load demo data
            </Button>
          }
        />

        {/* Adaptive re-planning banner */}
        {hasMissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <AdaptiveBanner onAdjust={autoAdjustPlan} />
          </motion.div>
        )}

        {/* Today's focus + stats */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Card padding="lg" className="lg:col-span-2" hover>
            <div className="flex items-center justify-between">
              <Badge tone="primary">
                <Target size={12} /> Today's focus
              </Badge>
              <span className="text-xs text-ink-400 dark:text-ink-500">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            {todaySession ? (
              <div className="mt-5">
                <h3 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">{todaySession.topic}</h3>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{todaySession.objective}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="neutral">
                    <Clock size={12} /> {todaySession.estimatedMinutes} min
                  </Badge>
                  <Badge tone="accent">{todaySession.difficulty}</Badge>
                  <Badge tone="primary">
                    {todaySession.conceptsDone}/{todaySession.conceptsTotal} concepts
                  </Badge>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(todaySession.conceptsDone / todaySession.conceptsTotal) * 100}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <Link to="/app/session" className="mt-5 inline-block">
                  <Button size="lg">
                    <Play size={16} /> Start Session
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="mt-5 text-sm text-ink-500">No session scheduled for today. Enjoy your break!</p>
            )}
          </Card>

          <Card padding="lg" className="flex flex-col items-center justify-center" hover>
            <ProgressRing
              value={progress?.overallCompletion ?? 0}
              size={140}
              label={`${progress?.overallCompletion ?? 0}%`}
              sublabel="overall"
            />
            <p className="mt-4 text-center text-sm text-ink-500 dark:text-ink-400">
              {plan.goalTitle} · {Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
            </p>
          </Card>
        </div>

        {/* Stats */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={TrendingUp} label="Overall Progress" value={progress?.overallCompletion ?? 0} suffix="%" color="primary" />
          <StatCard icon={Flame} label="Study Streak" value={progress?.streakDays ?? 0} suffix=" days" color="warning" />
          <StatCard icon={Clock} label="Hours Studied" value={progress?.hoursStudied ?? 0} suffix="h" decimals={1} color="accent" />
          <StatCard icon={BookOpen} label="Topics Mastered" value={progress?.topicsMastered ?? 0} color="success" />
        </div>

        {/* Chart + knowledge strength */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Card hover>
            <CardHeader title="Study Progress" subtitle="Weekly study activity" />
            <WeeklyChart data={progress?.weeklyActivity ?? []} />
          </Card>
          <Card hover>
            <CardHeader title="Knowledge Strength" subtitle="Topic-by-topic mastery" />
            <div className="space-y-3">
              {STRENGTH_BARS.map((row) => (
                <div key={row.topic}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ink-700 dark:text-ink-200">{row.topic}</span>
                    <span className="font-semibold text-ink-900 dark:text-ink-50">{row.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                    <motion.div
                      className={`h-full rounded-full ${
                        row.tone === 'error'
                          ? 'bg-error-500'
                          : row.tone === 'warning'
                            ? 'bg-warning-500'
                            : row.tone === 'accent'
                              ? 'bg-accent-500'
                              : 'bg-success-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${row.value}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Upcoming + AI recommendation */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Card hover>
            <CardHeader title="Upcoming Sessions" subtitle="Your next few study blocks" />
            <div className="space-y-3">
              {upcoming.length > 0 ? (
                upcoming.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3 dark:border-ink-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{s.topic}</p>
                        <p className="text-xs text-ink-400 dark:text-ink-500">
                          {relativeDate(s.date)} · {s.estimatedMinutes} min
                        </p>
                      </div>
                    </div>
                    <Badge tone={s.status === 'in-progress' ? 'accent' : 'neutral'}>
                      {s.status === 'in-progress' ? 'In progress' : 'Upcoming'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-400">No upcoming sessions. You're all caught up!</p>
              )}
            </div>
          </Card>

          <Card padding="lg" className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30" hover>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 text-white">
                <Sparkles size={18} />
              </div>
              <Badge tone="primary">AI Recommendation</Badge>
            </div>
            <p className="text-sm text-ink-700 dark:text-ink-200">
              Based on your recent quiz performance, I recommend spending <span className="font-bold">30 extra minutes</span> on{' '}
              <span className="font-bold">{weakTopics[0] ?? 'Dynamic Programming'}</span> today. Your accuracy there dropped 12% this week.
            </p>
            <Button className="mt-5" size="sm" onClick={autoAdjustPlan}>
              <RefreshCw size={14} /> Update My Plan
            </Button>
          </Card>
        </div>

        {/* Streak / motivation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5"
        >
          <Card padding="lg" className="flex items-center gap-4" hover>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-50 text-warning-600 dark:bg-warning-700/20">
              <Flame size={28} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">
                {progress?.streakDays ?? 0} Day Streak
              </p>
              <p className="text-sm text-ink-500 dark:text-ink-400">You're building consistency. Keep going!</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  decimals = 0,
  color,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  color: 'primary' | 'warning' | 'accent' | 'success';
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-700/20 dark:text-warning-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300',
    success: 'bg-success-50 text-success-600 dark:bg-success-700/20 dark:text-success-400',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card hover>
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">
          <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
        </p>
        <p className="text-sm text-ink-500 dark:text-ink-400">{label}</p>
      </Card>
    </motion.div>
  );
}

function WeeklyChart({ data }: { data: { day: string; minutes: number }[] }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  return (
    <div className="flex items-end justify-between gap-2 pt-2" style={{ height: 180 }}>
      {data.map((d, i) => (
        <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <motion.div
              className="w-full rounded-t-lg bg-gradient-to-t from-primary-500 to-accent-400"
              initial={{ height: 0 }}
              animate={{ height: `${(d.minutes / max) * 140}px` }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="text-xs text-ink-400 dark:text-ink-500">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function AdaptiveBanner({ onAdjust }: { onAdjust: () => Promise<void> }) {
  const [adjusting, setAdjusting] = useState(false);
  return (
    <Card padding="lg" className="border-warning-200 bg-warning-50 dark:border-warning-700 dark:bg-warning-700/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-100 text-warning-700 dark:bg-warning-700/40 dark:text-warning-200">
            <RefreshCw size={20} />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">Your plan needs adjustment</h3>
            <p className="text-sm text-ink-600 dark:text-ink-300">
              You missed yesterday's Graph Algorithms session. Let's get you back on track.
            </p>
          </div>
        </div>
        <Button onClick={async () => { setAdjusting(true); await onAdjust(); setAdjusting(false); }} loading={adjusting} className="shrink-0">
          <RefreshCw size={14} /> Auto-adjust my plan
        </Button>
      </div>
    </Card>
  );
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff < 7) return `In ${diff} days`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
