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
  Brain,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useAuth } from '@/store/AuthContext';
import { useAppData } from '@/store/AppDataContext';

export function Dashboard() {
  const { user } = useAuth();
  const { plan, progress, weakTopics, autoAdjustPlan } = useAppData();

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

  // Stagger animation parent variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemFadeUp = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  // No study plan yet
  if (!plan) {
    return (
      <AppLayout>
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
          <PageHeader
            title={`Welcome back, ${firstName} 👋`}
            subtitle="Let's turn today's study time into real progress."
          />

          {/* Learning Command Center Card (White + Blue borders) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-3xl border border-[var(--nova-border)] bg-[var(--nova-surface)] dark:border-[#1E293B] dark:bg-[#111827] p-6 sm:p-8 shadow-sm"
          >
            {/* Subtle blue atmosphere glow inside the white card */}
            <div className="absolute right-[-10%] top-[-10%] h-64 w-64 bg-[var(--nova-primary)]/5 rounded-full blur-[90px] -z-10" />

            <div className="grid gap-8 items-center md:grid-cols-12">
              <div className="md:col-span-7 space-y-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--nova-primary-soft)] px-3.5 py-1 text-[10px] font-bold tracking-wider text-[var(--nova-primary)] uppercase border border-[var(--nova-primary)]/10">
                  <Sparkles size={11} /> AI Personalized Learning
                </span>
                <h2 className="font-display text-2xl font-extrabold text-[var(--nova-text)] dark:text-[#F8FAFC] sm:text-3xl leading-tight">
                  Build your learning path.
                </h2>
                <p className="text-sm text-[var(--nova-text-secondary)] dark:text-[#CBD5E1] leading-relaxed max-w-lg">
                  Ask the AI Tutor a question or generate a mock test from your own study material to get started — your
                  dashboard fills in as you go.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link to="/app/tutor">
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: 'var(--nova-primary-hover)' }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--nova-primary)] px-6 text-sm font-bold text-white transition-all duration-300 shadow-sm"
                    >
                      Ask the AI Tutor <ArrowRight size={16} />
                    </motion.button>
                  </Link>
                  <Link to="/app/plan">
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: 'var(--nova-bg)' }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] px-6 text-sm font-bold text-[var(--nova-text-secondary)] transition-all duration-300"
                    >
                      <Sparkles size={14} /> Build your study plan
                    </motion.button>
                  </Link>
                </div>
              </div>

              {/* Right Side visual protagonist */}
              <div className="md:col-span-5 flex justify-center">
                <OnboardingVisual />
              </div>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <PageHeader title={`${greeting}, ${firstName} 👋`} subtitle="Let's make today's study session count." />

        {/* Adaptive re-planning banner */}
        {hasMissed && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <AdaptiveBanner onAdjust={autoAdjustPlan} />
          </motion.div>
        )}

        {/* Today's focus + stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Focus Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 rounded-3xl border border-[var(--nova-border)] bg-[var(--nova-surface)] dark:border-white/5 dark:bg-[#111827] p-6 shadow-soft flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[var(--nova-border)] dark:border-white/5 pb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--nova-primary-soft)] px-3.5 py-1 text-[10px] font-bold tracking-wider text-[var(--nova-primary)] uppercase">
                  <Target size={11} /> TODAY'S FOCUS
                </span>
                <span className="text-xs font-semibold text-[var(--nova-primary)] dark:text-[#CBD5E1]">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {todaySession ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <h3 className="font-display text-xl font-extrabold text-[var(--nova-text)] dark:text-white">
                      {todaySession.topic}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-[var(--nova-text-secondary)] dark:text-[#CBD5E1] leading-relaxed">
                      {todaySession.objective}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-white/5 px-2.5 py-1 text-[10px] font-bold text-[var(--nova-text-secondary)] dark:text-slate-300">
                      <Clock size={11} /> {todaySession.estimatedMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-[var(--nova-primary-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--nova-primary)]">
                      {todaySession.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-[var(--nova-primary-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--nova-primary)]">
                      {todaySession.conceptsDone}/{todaySession.conceptsTotal} concepts
                    </span>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--nova-border)] dark:bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-[var(--nova-primary)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(todaySession.conceptsDone / todaySession.conceptsTotal) * 100}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--nova-text-secondary)] dark:text-slate-500">
                      <span>
                        {Math.round((todaySession.conceptsDone / todaySession.conceptsTotal) * 100)}% complete
                      </span>
                      <span>{todaySession.conceptsTotal - todaySession.conceptsDone} concepts left</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-[var(--nova-text-secondary)]">
                  No session scheduled for today. Enjoy your break!
                </p>
              )}
            </div>

            {todaySession && (
              <div className="mt-6">
                <Link to="/app/session">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: 'var(--nova-primary-hover)' }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--nova-primary)] px-6 text-sm font-bold text-white transition-all duration-300 shadow-sm"
                  >
                    <Play size={15} /> Start Study Session
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Progress Ring Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-[var(--nova-border)] bg-[var(--nova-surface)] dark:border-white/5 dark:bg-[#111827] p-6 shadow-soft flex flex-col items-center justify-center text-center"
          >
            <ProgressRing
              value={progress?.overallCompletion ?? 0}
              size={130}
              stroke={12}
              label={`${progress?.overallCompletion ?? 0}%`}
              sublabel="overall"
            />
            <p className="mt-4 text-xs font-bold text-[var(--nova-text)] dark:text-[#F8FAFC]">{plan.goalTitle}</p>
            <p className="text-[9px] text-[var(--nova-primary)] uppercase tracking-widest mt-1.5 font-bold">
              {Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days until exam
            </p>
          </motion.div>
        </div>

        {/* Stats Grid Staggered */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            variant={itemFadeUp}
            icon={Target}
            label="Overall Progress"
            value={progress?.overallCompletion ?? 0}
            suffix="%"
            color="primary"
          />
          <StatCard
            variant={itemFadeUp}
            icon={Flame}
            label="Study Streak"
            value={progress?.streakDays ?? 0}
            suffix=" days"
            color="warning"
          />
          <StatCard
            variant={itemFadeUp}
            icon={Clock}
            label="Hours Studied"
            value={progress?.hoursStudied ?? 0}
            suffix="h"
            decimals={1}
            color="accent"
          />
          <StatCard
            variant={itemFadeUp}
            icon={BookOpen}
            label="Topics Mastered"
            value={progress?.topicsMastered ?? 0}
            color="success"
          />
        </motion.div>

        {/* Chart + Knowledge Strength */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl border border-[var(--nova-border)] bg-[var(--nova-surface)] dark:border-white/5 dark:bg-[#111827] p-5 shadow-soft"
          >
            <div className="border-b border-[var(--nova-border)] dark:border-white/5 pb-3 mb-5">
              <h3 className="font-display text-xs font-bold text-[var(--nova-text)] dark:text-white uppercase tracking-wider">
                Weekly Activity
              </h3>
              <p className="text-[11px] text-[var(--nova-text-secondary)] dark:text-slate-500">
                Hours spent studying this week
              </p>
            </div>
            <WeeklyChart data={progress?.weeklyActivity ?? []} />
          </motion.div>

          {/* Knowledge Strength */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-3xl border border-[var(--nova-border)] bg-[var(--nova-surface)] dark:border-white/5 dark:bg-[#111827] p-5 shadow-soft"
          >
            <div className="border-b border-[var(--nova-border)] dark:border-white/5 pb-3 mb-5">
              <h3 className="font-display text-xs font-bold text-[var(--nova-text)] dark:text-white uppercase tracking-wider">
                Knowledge Strength
              </h3>
              <p className="text-[11px] text-[var(--nova-text-secondary)] dark:text-slate-500">
                Topic-by-topic mastery levels
              </p>
            </div>
            <div className="space-y-4">
              {progress && progress.topicStrengths.length > 0 ? (
                progress.topicStrengths.slice(0, 5).map((row) => (
                  <div key={row.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--nova-text-secondary)] dark:text-slate-300">{row.name}</span>
                      <span className="text-[var(--nova-text)] dark:text-white">{row.strength}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--nova-border)] dark:bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-[var(--nova-primary)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${row.strength}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--nova-text-secondary)]">
                  Take a mock test to see your topic mastery here.
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions / Navigation shortcuts */}
        <div className="space-y-3">
          <span className="block text-[10px] font-bold tracking-widest text-[var(--nova-text-secondary)] dark:text-[#CBD5E1] uppercase">
            Quick Actions
          </span>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <QuickActionCard
              to="/app/tutor"
              label="AI Tutor"
              desc="Ask Cadence anything"
              icon={MessageSquare}
              index={1}
            />
            <QuickActionCard
              to="/app/plan"
              label="Study Plan"
              desc="Continue your schedule"
              icon={Calendar}
              index={2}
            />
            <QuickActionCard
              to="/app/assessments"
              label="Assessments"
              desc="Test your knowledge"
              icon={ClipboardList}
              index={3}
            />
            <QuickActionCard
              to="/app/progress"
              label="Progress Hub"
              desc="Analyze stats & trends"
              icon={TrendingUp}
              index={4}
            />
          </div>
        </div>

        {/* Upcoming + AI Recommendation */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{
              y: -2,
              borderColor: 'rgba(37, 99, 235, 0.20)',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            }}
            className="rounded-3xl border border-[var(--nova-border)] bg-[var(--nova-surface)] dark:border-white/5 dark:bg-[#111827] p-5 shadow-soft overflow-hidden"
          >
            <div className="border-b border-[var(--nova-border)] dark:border-white/5 pb-3 mb-5">
              <h3 className="font-display text-xs font-bold text-[var(--nova-text)] dark:text-white uppercase tracking-wider">
                Upcoming Sessions
              </h3>
              <p className="text-[11px] text-[var(--nova-text-secondary)] dark:text-[#94A3B8]">
                Your next few scheduled learning blocks
              </p>
            </div>

            <div className="space-y-3">
              {upcoming.length > 0 ? (
                upcoming.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--nova-border)] bg-[var(--nova-surface)] px-4 py-3 dark:border-white/5 dark:bg-[#172033] shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--nova-primary-soft)] text-[var(--nova-primary)] border border-[var(--nova-primary)]/10">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-[var(--nova-text)] dark:text-[#F8FAFC]">
                          {s.topic}
                        </p>
                        <p className="text-[10px] text-[var(--nova-text-secondary)] dark:text-[#94A3B8] mt-0.5">
                          {relativeDate(s.date)} · {s.estimatedMinutes} min
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone="neutral"
                      className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide bg-[var(--nova-primary-soft)] text-[var(--nova-primary)] border-none"
                    >
                      {s.status === 'in-progress' ? 'In progress' : 'Upcoming'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--nova-text-secondary)]">No upcoming sessions. You're all caught up!</p>
              )}
            </div>
          </motion.div>

          {/* AI Recommendation Panel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            whileHover={{
              y: -2,
              borderColor: 'rgba(37, 99, 235, 0.20)',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            }}
            className="rounded-3xl border border-[var(--nova-border)] bg-[var(--nova-surface)] p-6 shadow-sm flex flex-col justify-between dark:border-[#1E293B] dark:bg-[#111827] overflow-hidden"
          >
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-[var(--nova-border)] dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--nova-primary-soft)] text-[var(--nova-primary)]">
                    <Sparkles size={14} className="animate-pulse" />
                  </div>
                  <Badge
                    tone="primary"
                    className="text-[9px] font-bold py-0.5 tracking-wider uppercase bg-[var(--nova-primary-soft)] text-[var(--nova-primary)] border-none"
                  >
                    AI Recommendation
                  </Badge>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[var(--nova-text-secondary)] dark:text-[#CBD5E1] leading-relaxed">
                {weakTopics.length > 0 ? (
                  <>
                    Based on your mock test results, focus extra time on{' '}
                    <span className="font-extrabold text-[var(--nova-text)] dark:text-[#F8FAFC]">{weakTopics[0]}</span>
                    {(() => {
                      const strength = progress?.topicStrengths.find((t) => t.name === weakTopics[0])?.strength;
                      return strength !== undefined ? (
                        <>
                          {' '}
                          — you're currently at{' '}
                          <span className="font-extrabold text-[var(--nova-primary)]">{strength}%</span> there.
                        </>
                      ) : (
                        '.'
                      );
                    })()}
                  </>
                ) : (
                  'Take a mock test in Assessments to get personalized topic recommendations here.'
                )}
              </p>
            </div>

            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'var(--nova-primary-hover)' }}
                whileTap={{ scale: 0.98 }}
                onClick={autoAdjustPlan}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--nova-primary)] px-4 text-xs font-bold text-white transition-all duration-200 shadow-sm"
              >
                <RefreshCw size={12} /> Sync & Update My Plan
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ============================================================================
   SUB-COMPONENT: Onboarding Core Visual
   ============================================================================ */
function OnboardingVisual() {
  return (
    <div className="relative h-[220px] w-full flex items-center justify-center select-none pointer-events-none sm:h-[260px]">
      {/* Background radial glow */}
      <div className="absolute h-36 w-36 rounded-full bg-[var(--nova-primary)]/5 blur-3xl animate-pulse" />

      {/* Outer spinning SVG orbit ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute h-[160px] w-[160px] opacity-25"
      >
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="var(--nova-primary)"
            strokeWidth="1"
            strokeDasharray="5 10"
          />
        </svg>
      </motion.div>

      {/* Central Glowing AI Core Orb */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--nova-primary)] text-white shadow-glow shadow-[var(--nova-primary)]/15"
      >
        <Brain size={22} className="drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
      </motion.div>

      {/* Floating educational nodes */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[15%] top-[20%] rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] px-2.5 py-1 text-[9px] font-bold text-[var(--nova-text-secondary)] shadow-sm"
      >
        DP 42%
      </motion.div>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute right-[12%] top-[30%] rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] px-2.5 py-1 text-[9px] font-bold text-[var(--nova-text-secondary)] shadow-sm"
      >
        Arrays 92% ✓
      </motion.div>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute left-[20%] bottom-[20%] rounded-xl border border-[var(--nova-warning)]/20 bg-[var(--nova-surface)] px-2.5 py-1 text-[9px] font-bold text-[var(--nova-warning)] shadow-sm"
      >
        7 day streak 🔥
      </motion.div>
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: Stats Metrics Card
   ============================================================================ */
function StatCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  decimals = 0,
  color,
  variant,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  color: 'primary' | 'warning' | 'accent' | 'success';
  variant: any;
}) {
  const colors = {
    primary: 'bg-[var(--nova-primary-soft)] text-[var(--nova-primary)] border-[var(--nova-primary)]/10',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    accent: 'bg-[var(--nova-primary-soft)] text-[var(--nova-primary)] border-[var(--nova-primary)]/10',
    success: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20',
  };
  return (
    <motion.div
      variants={variant}
      whileHover={{
        y: -2,
        borderColor: 'rgba(37, 99, 235, 0.20)',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="rounded-2xl border border-[var(--nova-border)] bg-[var(--nova-surface)] dark:border-[#1E293B] dark:bg-[#111827] p-4 shadow-sm overflow-hidden"
    >
      <div className={`mb-3.5 flex h-9 w-9 items-center justify-center rounded-xl border ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="font-display text-2xl font-bold text-[var(--nova-text)] dark:text-[#F8FAFC]">
        <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
      </p>
      <p className="text-xs text-[var(--nova-text-secondary)] dark:text-[#94A3B8] mt-0.5">{label}</p>
    </motion.div>
  );
}

/* ============================================================================
   SUB-COMPONENT: Quick Navigation Card
   ============================================================================ */
function QuickActionCard({
  to,
  label,
  desc,
  icon: Icon,
  index,
}: {
  to: string;
  label: string;
  desc: string;
  icon: typeof Calendar;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.5 }}
      whileHover={{
        y: -2,
        borderColor: 'rgba(37, 99, 235, 0.20)',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      }}
      className="rounded-2xl border border-[var(--nova-border)] bg-[var(--nova-surface)] dark:border-[#1E293B] dark:bg-[#111827] p-4 flex flex-col justify-between overflow-hidden shadow-sm"
    >
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--nova-primary-soft)] text-[var(--nova-primary)] border border-[var(--nova-primary)]/10">
        <Icon size={15} />
      </div>
      <div>
        <p className="text-xs font-bold text-[var(--nova-text)] dark:text-white leading-none">{label}</p>
        <p className="text-[10px] text-[var(--nova-text-secondary)] dark:text-[#94A3B8] mt-1 leading-tight">{desc}</p>
      </div>
      <Link to={to} className="mt-3 text-[10px] font-bold text-[var(--nova-primary)] flex items-center gap-1 group">
        <span>Go now</span>
        <ArrowRight size={10} className="transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}

/* ============================================================================
   SUB-COMPONENT: Weekly Study Chart
   ============================================================================ */
function WeeklyChart({ data }: { data: { day: string; minutes: number }[] }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  return (
    <div className="flex items-end justify-between gap-2 pt-2" style={{ height: 160 }}>
      {data.map((d, i) => (
        <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <motion.div
              className="w-full rounded-t-lg bg-[var(--nova-primary)] shadow-[0_0_12px_rgba(37,99,235,0.05)]"
              initial={{ height: 0 }}
              animate={{ height: `${(d.minutes / max) * 120}px` }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="text-[10px] font-semibold text-[var(--nova-text-secondary)]">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENT: Adaptive Re-planning Banner
   ============================================================================ */
function AdaptiveBanner({ onAdjust }: { onAdjust: () => Promise<void> }) {
  const [adjusting, setAdjusting] = useState(false);
  return (
    <div className="rounded-2xl border border-[var(--nova-warning)]/20 bg-[var(--nova-warning)]/5 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--nova-warning)]/10 text-[var(--nova-warning)] border border-[var(--nova-warning)]/20">
            <RefreshCw size={18} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-[var(--nova-text)] dark:text-white">
              Your study plan needs adjustment
            </h3>
            <p className="text-xs text-[var(--nova-text-secondary)] dark:text-[#CBD5E1] mt-0.5">
              You missed yesterday's Graph Algorithms block. Let's adapt your schedule.
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'var(--nova-primary-hover)' }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            setAdjusting(true);
            await onAdjust();
            setAdjusting(false);
          }}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--nova-primary)] px-4 text-xs font-bold text-white transition-all duration-200 shadow-sm"
        >
          {adjusting ? (
            'Adjusting...'
          ) : (
            <>
              <RefreshCw size={12} className={adjusting ? 'animate-spin' : ''} />
              Auto-adjust study schedule
            </>
          )}
        </motion.button>
      </div>
    </div>
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
