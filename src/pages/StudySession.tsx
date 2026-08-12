import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Check,
  Clock,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  BookOpen,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppData } from '@/store/AppDataContext';
import { useToast } from '@/store/ToastContext';

const CONCEPTS = [
  { id: 'c1', title: 'Overlapping subproblems', desc: 'Identify when the same calculation repeats.' },
  { id: 'c2', title: 'Optimal substructure', desc: 'Build the best answer from smaller best answers.' },
  { id: 'c3', title: 'Memoization (top-down)', desc: 'Cache results as you recurse.' },
  { id: 'c4', title: 'Tabulation (bottom-up)', desc: 'Fill a table from smallest to largest.' },
  { id: 'c5', title: 'State & recurrence', desc: 'Define the state and write the recurrence relation.' },
];

export function StudySession() {
  const navigate = useNavigate();
  const { plan, markSessionComplete, updateConceptProgress } = useAppData();
  const { showToast } = useToast();

  const session = plan?.sessions.find((s) => s.status === 'in-progress') ?? plan?.sessions.find((s) => s.status === 'upcoming');

  const [activeConcept, setActiveConcept] = useState(0);
  const [completedConcepts, setCompletedConcepts] = useState<Set<string>>(new Set());
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  if (!session) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <p className="text-ink-500">No active session. <Link to="/app/plan" className="text-primary-600">Back to plan</Link></p>
        </div>
      </AppLayout>
    );
  }

  const concepts = CONCEPTS.slice(0, session.conceptsTotal);
  const progress = (completedConcepts.size / concepts.length) * 100;

  const toggleConcept = (id: string) => {
    setCompletedConcepts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleComplete = async () => {
    await updateConceptProgress(session.id, concepts.length);
    await markSessionComplete(session.id);
    setDone(true);
    showToast('Session complete! Streak extended.');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <Link to="/app/plan" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-ink-50">
          <ArrowLeft size={16} /> Back to plan
        </Link>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md pt-8 text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-primary-600 text-white shadow-lift">
                <PartyPopper size={32} />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Session Complete!</h2>
              <p className="mt-2 text-ink-500 dark:text-ink-400">
                You finished <span className="font-semibold">{session.topic}</span>. Your streak and XP have been updated.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/app/tutor"><Button variant="outline"><MessageSquare size={16} /> Ask a doubt</Button></Link>
                <Link to="/app"><Button>Back to dashboard</Button></Link>
              </div>
            </motion.div>
          ) : (
            <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Badge tone="accent">In Progress</Badge>
                  <h1 className="mt-2 font-display text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">{session.topic}</h1>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{session.objective}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral"><Clock size={12} /> {session.estimatedMinutes} min</Badge>
                  <Badge tone="primary">{session.subject}</Badge>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {/* Concepts list */}
                <div className="lg:col-span-2">
                  <Card padding="lg">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">Concepts</h3>
                      <span className="text-sm text-ink-400">{completedConcepts.size}/{concepts.length} done</span>
                    </div>
                    <div className="mb-5 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <div className="space-y-2">
                      {concepts.map((c, i) => {
                        const isDone = completedConcepts.has(c.id);
                        const isActive = i === activeConcept;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setActiveConcept(i)}
                            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                              isActive
                                ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30'
                                : 'border-ink-200 hover:border-ink-300 dark:border-ink-700'
                            }`}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleConcept(c.id); }}
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                isDone ? 'border-accent-500 bg-accent-500 text-white' : 'border-ink-300 dark:border-ink-600'
                              }`}
                            >
                              {isDone && <Check size={14} />}
                            </button>
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${isDone ? 'text-ink-400 line-through' : 'text-ink-900 dark:text-ink-50'}`}>{c.title}</p>
                              <p className="text-xs text-ink-500 dark:text-ink-400">{c.desc}</p>
                            </div>
                            <ChevronRight size={16} className="text-ink-300" />
                          </button>
                        );
                      })}
                    </div>
                    <Button className="mt-5" fullWidth size="lg" onClick={handleComplete} disabled={completedConcepts.size < concepts.length}>
                      <Check size={18} /> Complete Session
                    </Button>
                  </Card>
                </div>

                {/* Side panel: timer + AI help */}
                <div className="space-y-5">
                  <Card padding="lg">
                    <h3 className="mb-4 font-display text-base font-semibold text-ink-900 dark:text-ink-50">Study Timer</h3>
                    <div className="flex flex-col items-center">
                      <div className="font-display text-4xl font-bold text-ink-900 dark:text-ink-50 tabular-nums">
                        {formatTime(elapsed)}
                      </div>
                      <p className="mt-1 text-xs text-ink-400">of {session.estimatedMinutes} min target</p>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant={timerRunning ? 'outline' : 'primary'} onClick={() => setTimerRunning(!timerRunning)}>
                          {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                          {timerRunning ? 'Pause' : 'Start'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setElapsed(0); setTimerRunning(false); }}>Reset</Button>
                      </div>
                    </div>
                  </Card>

                  <Card padding="lg" className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 text-white">
                        <Sparkles size={16} />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">AI Tutor</h3>
                    </div>
                    <p className="text-sm text-ink-600 dark:text-ink-300">Stuck on a concept? Ask Nova for help.</p>
                    <Link to="/app/tutor" className="mt-3 inline-block">
                      <Button size="sm" variant="outline"><MessageSquare size={14} /> Ask a question</Button>
                    </Link>
                  </Card>

                  <Card padding="lg">
                    <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
                      <BookOpen size={16} /> Session info
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between"><dt className="text-ink-400">Subject</dt><dd className="font-medium text-ink-700 dark:text-ink-200">{session.subject}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink-400">Difficulty</dt><dd className="font-medium text-ink-700 dark:text-ink-200">{session.difficulty}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink-400">Day</dt><dd className="font-medium text-ink-700 dark:text-ink-200">Day {session.day}</dd></div>
                    </dl>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
