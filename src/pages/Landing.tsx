import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Target,
  Brain,
  Sparkles,
  CalendarRange,
  MessageSquare,
  ClipboardList,
  RefreshCw,
  Trophy,
  Flame,
  Zap,
  BookOpen,
  Mic,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  BarChart3,
} from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { AnimatedBackground } from '@/components/landing/AnimatedBackground';
import { LiveStudyDashboard } from '@/components/landing/LiveStudyDashboard';
import { FloatingInsight } from '@/components/landing/FloatingInsight';
import { AIInsightPanel } from '@/components/landing/AIInsightPanel';
import { PremiumCard } from '@/components/landing/PremiumCard';
import { SectionReveal, RevealItem, SectionHeading } from '@/components/landing/SectionReveal';
import { useLenis } from '@/hooks/useLenis';
import { fadeUp, staggerContainer, blurIn, viewportConfig } from '@/lib/animations';

const PROBLEM_CARDS = [
  { icon: Users, title: 'Same plan for everyone', text: 'Classrooms move at one pace. If you fall behind or race ahead, the plan ignores it.' },
  { icon: AlertCircle, title: 'Weak areas ignored', text: 'You keep revising what you already know while the topics that hurt you stay weak.' },
  { icon: Clock, title: 'Last-minute cramming', text: 'Without a schedule tied to a deadline, everything piles into the night before the exam.' },
  { icon: MessageSquare, title: 'No instant doubt support', text: 'A doubt at midnight kills momentum. Waiting for the next class isn\'t good enough.' },
];

const STEPS = [
  { icon: Target, title: 'Set Your Goal', text: 'Tell Nova what you\'re preparing for, your subjects, and your exam deadline.' },
  { icon: Brain, title: 'Assess Your Knowledge', text: 'A short diagnostic finds exactly where you\'re strong and where you need work.' },
  { icon: Sparkles, title: 'Get Your AI Study Plan', text: 'Nova builds a day-by-day plan tuned to your level, time, and weak topics.' },
  { icon: TrendingUp, title: 'Learn + Track + Adapt', text: 'Study, take quizzes, and watch your plan re-adapt as you improve.' },
];

const FEATURES = [
  { icon: CalendarRange, title: 'Personalized Study Plans', text: 'Day-by-day sessions built from your goal, deadline, and available hours.' },
  { icon: MessageSquare, title: 'AI Study Assistant', text: 'Ask questions in plain language and get explanations tuned to your level.' },
  { icon: Brain, title: 'Knowledge Assessment', text: 'Short diagnostics pinpoint strong, weak, and critical topics in minutes.' },
  { icon: RefreshCw, title: 'Adaptive Re-planning', text: 'Missed a session? Nova reshuffles your plan so you still land on target.' },
  { icon: ClipboardList, title: 'Mock Tests', text: 'Generate quizzes by subject, topic, and difficulty — then see your weak spots.' },
  { icon: BarChart3, title: 'Progress Tracking', text: 'Visualize study time, mastery, and accuracy trends week over week.' },
  { icon: Zap, title: 'Spaced Repetition', text: 'Topics you struggle with come back at the right interval so they stick.' },
  { icon: Mic, title: 'Voice Doubt Solving', text: 'Tap the mic, ask your question out loud, and get a spoken explanation back.' },
];

const PERSONALIZATION = [
  { label: 'Knowledge level', value: 'Beginner → Advanced' },
  { label: 'Weak areas', value: 'Detected from quizzes' },
  { label: 'Available hours', value: 'Per day, per week' },
  { label: 'Exam deadline', value: 'Countdown driven' },
  { label: 'Previous performance', value: 'Accuracy trend' },
];

const heroStagger = staggerContainer(0.12, 0.1);

export function Landing() {
  useLenis(true);

  return (
    <div className="dark relative min-h-screen overflow-x-hidden bg-ink-975 text-ink-100">
      <AnimatedBackground />
      <PublicNav />
      <Hero />
      <Problem />
      <HowItWorks />
      <Personalization />
      <Features />
      <ProgressPreview />
      <AIPreview />
      <Gamification />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-20">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial="hidden" animate="visible" variants={heroStagger}>
            <motion.div variants={fadeUp}>
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary-400/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-300">
                <Sparkles size={12} /> AI-powered learning
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Your Study Plan.
              <br />
              <span className="gradient-text-aurora">Your Pace. Your Path.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-xl text-lg text-ink-300">
              Nova builds a personalized study plan from your knowledge level, weak topics, available time, and exam
              deadline — then adapts it every day as you learn.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" variant="gradient" magnetic>
                  Build My Study Plan <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/app">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
                >
                  <Play size={16} /> Explore Demo
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-400">
              {['No credit card', '2-minute setup', 'Adaptive re-planning'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-accent-400" /> {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <div className="relative flex justify-center lg:justify-end">
            <FloatingInsight />
            <LiveStudyDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <SectionReveal className="surface-premium py-20" stagger={0.08}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          light
          tag="The problem"
          title="Traditional learning fails most students"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEM_CARDS.map((card) => (
            <PremiumCard key={card.title} glow className="p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-coral-500/15 text-coral-400">
                <card.icon size={20} />
              </div>
              <h3 className="font-display text-base font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-ink-400">{card.text}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

function HowItWorks() {
  return (
    <SectionReveal id="how-it-works" className="py-20" stagger={0.1}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading light tag="How it works" title="From goal to mastery in four steps" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <PremiumCard key={step.title} tilt={i === 1 || i === 3} gradientBorder className="p-5">
              <span className="absolute right-5 top-5 font-display text-4xl font-bold text-white/5">{i + 1}</span>
              <motion.div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-violet-500 to-accent-400 text-white shadow-glow"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
              >
                <step.icon size={22} />
              </motion.div>
              <h3 className="font-display text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-400">{step.text}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

function Personalization() {
  return (
    <SectionReveal id="personalization" className="surface-premium py-20" stagger={0.1}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <RevealItem>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent-400/30 bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-300">
                <Brain size={12} /> AI personalization
              </span>
            </RevealItem>
            <RevealItem>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                A plan that actually knows you
              </h2>
            </RevealItem>
            <RevealItem>
              <p className="mt-3 text-lg text-ink-400">
                Nova considers everything that affects how you should study — not just what you need to cover.
              </p>
            </RevealItem>
            <div className="mt-8 space-y-3">
              {PERSONALIZATION.map((item, i) => (
                <RevealItem key={item.label}>
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={viewportConfig}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                  >
                    <span className="text-sm font-medium text-ink-200">{item.label}</span>
                    <span className="text-sm text-ink-400">{item.value}</span>
                  </motion.div>
                </RevealItem>
              ))}
            </div>
          </div>
          <RevealItem className="flex flex-col items-center gap-8">
            <motion.div variants={blurIn} className="relative">
              <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-400/20 blur-2xl" />
              <ProgressRing value={78} size={220} stroke={16} label="78%" sublabel="quiz accuracy" />
            </motion.div>
            <AIInsightPanel />
          </RevealItem>
        </div>
      </div>
    </SectionReveal>
  );
}

function Features() {
  return (
    <SectionReveal id="features" className="py-20" stagger={0.06}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading light tag="Features" title="Everything you need to study smarter" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <PremiumCard key={f.title} glow={i % 3 === 0} tilt={i === 2 || i === 5} className="p-5">
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                transition={{ duration: 0.4 }}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 text-primary-300"
              >
                <f.icon size={20} />
              </motion.div>
              <h3 className="font-display text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-400">{f.text}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

function ProgressPreview() {
  const weekData = [
    { d: 'Mon', h: 1.6 },
    { d: 'Tue', h: 2 },
    { d: 'Wed', h: 1.25 },
    { d: 'Thu', h: 2.2 },
    { d: 'Fri', h: 1 },
    { d: 'Sat', h: 2.3 },
    { d: 'Sun', h: 1.7 },
  ];

  const topics = [
    { t: 'Dynamic Programming', v: 42, color: 'from-coral-500 to-pink-500' },
    { t: 'Graph Algorithms', v: 58, color: 'from-warning-500 to-coral-500' },
    { t: 'DBMS', v: 81, color: 'from-aurora-400 to-accent-400' },
    { t: 'Operating Systems', v: 73, color: 'from-aurora-400 to-primary-400' },
    { t: 'Computer Networks', v: 67, color: 'from-accent-400 to-violet-400' },
  ];

  return (
    <SectionReveal id="progress" className="surface-premium py-20" stagger={0.1}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading light tag="Progress" title="See exactly where you stand" subtitle="Live metrics that update as you learn" />
        <div className="grid gap-5 lg:grid-cols-3">
          <PremiumCard glow className="p-6">
            <div className="flex flex-col items-center">
              <ProgressRing value={34} size={140} label="34%" sublabel="overall" />
              <p className="mt-4 text-sm text-ink-400">Overall completion</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-accent-300">
                <TrendingUp size={12} />
                <AnimatedNumber value={12} prefix="+" suffix="% this week" />
              </div>
            </div>
          </PremiumCard>
          <PremiumCard glow className="p-6 lg:col-span-2">
            <h3 className="font-display text-base font-semibold text-white">Weekly study hours</h3>
            <div className="mt-6 flex items-end justify-between gap-2">
              {weekData.map((bar, i) => (
                <div key={bar.d} className="flex flex-1 flex-col items-center gap-2">
                  <motion.div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary-500 via-violet-500 to-accent-400"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${(bar.h / 2.5) * 140}px` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <span className="text-xs text-ink-500">{bar.d}</span>
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <PremiumCard className="p-6">
            <h3 className="font-display text-base font-semibold text-white">Topic strength</h3>
            <div className="mt-4 space-y-3">
              {topics.map((row, i) => (
                <div key={row.t}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ink-300">{row.t}</span>
                    <span className="font-semibold text-white">
                      <AnimatedNumber value={row.v} suffix="%" duration={1000 + i * 200} />
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${row.v}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>
          <PremiumCard className="p-6">
            <h3 className="font-display text-base font-semibold text-white">Upcoming sessions</h3>
            <div className="mt-4 space-y-3">
              {[
                { day: 'Today', topic: 'Dynamic Programming', tone: 'primary' as const },
                { day: 'Tomorrow', topic: 'Graph Algorithms', tone: 'accent' as const },
                { day: 'Friday', topic: 'Mock Test', tone: 'warning' as const },
                { day: 'Saturday', topic: 'Revision', tone: 'neutral' as const },
              ].map((s, i) => (
                <motion.div
                  key={s.day}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-xs text-ink-500">{s.day}</p>
                    <p className="text-sm font-semibold text-white">{s.topic}</p>
                  </div>
                  <Badge tone={s.tone}>Scheduled</Badge>
                </motion.div>
              ))}
            </div>
          </PremiumCard>
        </div>
      </div>
    </SectionReveal>
  );
}

function AIPreview() {
  return (
    <SectionReveal id="ai-preview" className="py-20" stagger={0.1}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading light tag="AI tutor" title="Ask anything. Get a real answer." />
        <RevealItem>
          <div className="relative mx-auto max-w-2xl">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary-500/20 via-violet-500/15 to-accent-400/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900/75 p-6 backdrop-blur-2xl sm:p-8">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportConfig}
                  className="flex justify-end"
                >
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-primary-600 to-violet-600 px-4 py-3 text-sm text-white">
                    Can you explain dynamic programming in simple terms?
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportConfig}
                  transition={{ delay: 0.15 }}
                  className="flex gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 via-violet-500 to-accent-400 text-white">
                    <Sparkles size={14} />
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink-200">
                    Think of dynamic programming as solving a big problem by remembering solutions to smaller problems
                    you've already solved, instead of recomputing them.
                    <span className="ml-1 inline-flex gap-0.5">
                      <span className="animate-blink">.</span>
                      <span className="animate-blink" style={{ animationDelay: '0.2s' }}>.</span>
                      <span className="animate-blink" style={{ animationDelay: '0.4s' }}>.</span>
                    </span>
                  </div>
                </motion.div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Explain like I\'m a beginner', 'Give me an example', 'Quiz me on this'].map((p, i) => (
                  <motion.button
                    key={p}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-300 transition hover:border-primary-400/40 hover:bg-primary-500/10 hover:text-primary-200"
                  >
                    {p}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </RevealItem>
      </div>
    </SectionReveal>
  );
}

function Gamification() {
  const badges = [
    { icon: Flame, title: '7 Day Streak', color: 'text-coral-400 bg-coral-500/15' },
    { icon: Target, title: 'First Goal', color: 'text-primary-300 bg-primary-500/15' },
    { icon: Brain, title: 'Quiz Master', color: 'text-accent-300 bg-accent-500/15' },
    { icon: BookOpen, title: '10 Topics', color: 'text-aurora-400 bg-aurora-500/15' },
    { icon: Zap, title: 'Consistency', color: 'text-violet-300 bg-violet-500/15' },
    { icon: Trophy, title: 'Comeback Kid', color: 'text-coral-400 bg-coral-500/15' },
  ];

  return (
    <SectionReveal className="surface-premium py-20" stagger={0.08}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading light tag="Gamification" title="Stay motivated, build consistency" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Flame, value: 7, suffix: ' days', label: 'Current streak — keep it alive!', color: 'text-coral-400 bg-coral-500/15' },
            { icon: Zap, value: 2450, suffix: ' XP', label: 'Level 6 · 550 XP to level 7', color: 'text-primary-300 bg-primary-500/15' },
            { icon: Trophy, value: 2, suffix: '/6 unlocked', label: 'Achievements earned', color: 'text-accent-300 bg-accent-500/15', extra: true },
          ].map((stat) => (
            <PremiumCard key={stat.label} glow className="flex items-center gap-4 p-5">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.color}`}>
                <stat.icon size={26} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  {stat.extra ? (
                    <>
                      <AnimatedNumber value={2} />/<AnimatedNumber value={6} /> unlocked
                    </>
                  ) : (
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  )}
                </p>
                <p className="text-sm text-ink-400">{stat.label}</p>
              </div>
            </PremiumCard>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {badges.map((b) => (
            <PremiumCard key={b.title} className="flex flex-col items-center gap-2 p-4 text-center">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${b.color}`}>
                <b.icon size={22} />
              </div>
              <p className="text-xs font-semibold text-ink-200">{b.title}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

function FinalCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={viewportConfig}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 sm:p-12">
            <div className="absolute inset-0 aurora opacity-90" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-accent-400/20 blur-2xl" />
            <div className="relative text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Stop Studying More. Start Studying Smarter.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/80">
                Build your personalized plan in under two minutes and see the difference adaptive learning makes.
              </p>
              <Link to="/signup" className="mt-8 inline-block">
                <Button size="lg" variant="secondary" magnetic className="bg-white text-primary-700 hover:bg-primary-50">
                  Create My Personalized Plan <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
