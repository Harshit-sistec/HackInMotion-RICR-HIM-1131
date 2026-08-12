import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Target,
  Clock,
  Brain,
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/store/AuthContext';
import { useAppData } from '@/store/AppDataContext';
import { useToast } from '@/store/ToastContext';
import { assessmentService, type DiagnosticOutcome } from '@/services/assessmentService';
import type { GoalType, KnowledgeLevel, Question } from '@/types';

const STEPS = [
  { label: 'Goal', icon: Target },
  { label: 'Time', icon: Clock },
  { label: 'Level', icon: Brain },
  { label: 'Assessment', icon: ClipboardList },
];

const GOAL_TYPES: { id: GoalType; label: string; description: string }[] = [
  { id: 'exam', label: 'Prepare for an exam', description: 'Target a specific test or semester exam' },
  { id: 'subject', label: 'Learn a subject', description: 'Build mastery across a full subject' },
  { id: 'topic-mastery', label: 'Master a topic', description: 'Go deep on one specific topic' },
  { id: 'weak-areas', label: 'Improve weak areas', description: 'Focus on what you struggle with' },
  { id: 'placement', label: 'Placement / interview', description: 'Prep for interviews or placements' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES: { id: KnowledgeLevel; label: string; description: string; emoji: string }[] = [
  { id: 'beginner', label: 'Beginner', description: 'Starting fresh — need the foundations', emoji: '🌱' },
  { id: 'intermediate', label: 'Intermediate', description: 'Know the basics, ready to go deeper', emoji: '🚀' },
  { id: 'advanced', label: 'Advanced', description: 'Comfortable — refining and applying', emoji: '🏆' },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const { createGoal, saveAvailableTime, saveKnowledgeLevel, submitDiagnostic, generatePlan } = useAppData();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);

  // Step 1
  const [goalType, setGoalType] = useState<GoalType>('exam');
  const [title, setTitle] = useState('');
  const [subjects, setSubjects] = useState('');
  const [topics, setTopics] = useState('');
  const [deadline, setDeadline] = useState('');

  // Step 2
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [studyDays, setStudyDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('evening');

  // Step 3
  const [level, setLevel] = useState<KnowledgeLevel>('intermediate');

  // Step 4
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<DiagnosticOutcome | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (step === 3 && questions.length === 0) {
      assessmentService.getDiagnosticQuestions().then(setQuestions);
    }
  }, [step, questions.length]);

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canContinueStep1 = title.trim() && subjects.trim() && deadline;
  const canContinueStep2 = hoursPerDay > 0 && studyDays.length > 0;

  const handleStep1Next = async () => {
    try {
      await createGoal({
        type: goalType,
        title: title.trim(),
        subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
        topics: topics.split(',').map((s) => s.trim()).filter(Boolean),
        deadline: new Date(deadline).toISOString(),
      });
      next();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save goal.', 'error');
    }
  };

  const handleStep2Next = async () => {
    await saveAvailableTime({ hoursPerDay, studyDays, preferredTime });
    next();
  };

  const handleStep3Next = async () => {
    await saveKnowledgeLevel(level);
    next();
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const result = await submitDiagnostic(answers);
      setOutcome(result);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      await generatePlan();
      await completeOnboarding();
      showToast('Your personalized plan is ready!');
      navigate('/app');
    } catch {
      showToast('Could not generate plan. Try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="flex h-16 items-center justify-between border-b border-ink-200 bg-white px-4 sm:px-6 dark:border-ink-800 dark:bg-ink-900">
        <Logo to="/" />
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Welcome, {user?.name.split(' ')[0] ?? 'there'}! Let's set up your plan.
        </p>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Stepper currentStep={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            {step === 0 && (
              <Step1
                goalType={goalType}
                setGoalType={setGoalType}
                title={title}
                setTitle={setTitle}
                subjects={subjects}
                setSubjects={setSubjects}
                topics={topics}
                setTopics={setTopics}
                deadline={deadline}
                setDeadline={setDeadline}
                onNext={handleStep1Next}
                canContinue={canContinueStep1}
              />
            )}
            {step === 1 && (
              <Step2
                hoursPerDay={hoursPerDay}
                setHoursPerDay={setHoursPerDay}
                studyDays={studyDays}
                setStudyDays={setStudyDays}
                preferredTime={preferredTime}
                setPreferredTime={setPreferredTime}
                onBack={back}
                onNext={handleStep2Next}
              />
            )}
            {step === 2 && (
              <Step3 level={level} setLevel={setLevel} onBack={back} onNext={handleStep3Next} />
            )}
            {step === 3 && !outcome && (
              <Step4
                questions={questions}
                currentQ={currentQ}
                setCurrentQ={setCurrentQ}
                answers={answers}
                setAnswers={setAnswers}
                onBack={back}
                onSubmit={submitAssessment}
                submitting={submitting}
              />
            )}
            {step === 3 && outcome && (
              <Analysis outcome={outcome} generating={generating} onGenerate={handleGeneratePlan} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-center">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                i < currentStep
                  ? 'border-accent-500 bg-accent-500 text-white'
                  : i === currentStep
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-ink-200 bg-white text-ink-400 dark:border-ink-700 dark:bg-ink-900'
              }`}
            >
              {i < currentStep ? <Check size={18} /> : <s.icon size={18} />}
            </div>
            <span
              className={`text-xs font-medium ${
                i <= currentStep ? 'text-ink-900 dark:text-ink-50' : 'text-ink-400 dark:text-ink-500'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-2 h-0.5 flex-1 rounded-full transition ${
                i < currentStep ? 'bg-accent-500' : 'bg-ink-200 dark:bg-ink-800'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">{title}</h2>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
    </div>
  );
}

function Step1({
  goalType,
  setGoalType,
  title,
  setTitle,
  subjects,
  setSubjects,
  topics,
  setTopics,
  deadline,
  setDeadline,
  onNext,
  canContinue,
}: {
  goalType: GoalType;
  setGoalType: (t: GoalType) => void;
  title: string;
  setTitle: (s: string) => void;
  subjects: string;
  setSubjects: (s: string) => void;
  topics: string;
  setTopics: (s: string) => void;
  deadline: string;
  setDeadline: (s: string) => void;
  onNext: () => void;
  canContinue: boolean;
}) {
  return (
    <Card padding="lg">
      <StepHeader title="What do you want to achieve?" subtitle="Tell Nova your goal so we can build the right plan." />
      <div className="space-y-3">
        {GOAL_TYPES.map((g) => (
          <button
            key={g.id}
            onClick={() => setGoalType(g.id)}
            className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
              goalType === g.id
                ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30'
                : 'border-ink-200 hover:border-ink-300 dark:border-ink-700 dark:hover:border-ink-600'
            }`}
          >
            <div>
              <p className="font-semibold text-ink-900 dark:text-ink-50">{g.label}</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">{g.description}</p>
            </div>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                goalType === g.id ? 'border-primary-600 bg-primary-600' : 'border-ink-300 dark:border-ink-600'
              }`}
            >
              {goalType === g.id && <Check size={12} className="text-white" />}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <Input
          label="Goal / exam name"
          placeholder="e.g. CSE Semester Exams"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Subjects (comma separated)"
          placeholder="DSA, DBMS, Operating Systems"
          value={subjects}
          onChange={(e) => setSubjects(e.target.value)}
        />
        <Input
          label="Topics (comma separated, optional)"
          placeholder="Dynamic Programming, Graphs, Normalization"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
        />
        <Input
          label="Deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} disabled={!canContinue}>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

function Step2({
  hoursPerDay,
  setHoursPerDay,
  studyDays,
  setStudyDays,
  preferredTime,
  setPreferredTime,
  onBack,
  onNext,
}: {
  hoursPerDay: number;
  setHoursPerDay: (n: number) => void;
  studyDays: string[];
  setStudyDays: (d: string[]) => void;
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
  setPreferredTime: (t: 'morning' | 'afternoon' | 'evening' | 'night') => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const toggleDay = (day: string) => {
    setStudyDays(studyDays.includes(day) ? studyDays.filter((d) => d !== day) : [...studyDays, day]);
  };

  return (
    <Card padding="lg">
      <StepHeader title="How much time can you study?" subtitle="We'll plan sessions that fit your schedule." />

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-ink-700 dark:text-ink-200">Hours per day</label>
          <Badge tone="primary">{hoursPerDay}h</Badge>
        </div>
        <input
          type="range"
          min={0.5}
          max={8}
          step={0.5}
          value={hoursPerDay}
          onChange={(e) => setHoursPerDay(Number(e.target.value))}
          className="w-full accent-primary-600"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-400">
          <span>0.5h</span>
          <span>8h</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Preferred study days</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`h-11 w-14 rounded-xl border text-sm font-semibold transition ${
                studyDays.includes(day)
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                  : 'border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Preferred study time</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(['morning', 'afternoon', 'evening', 'night'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPreferredTime(t)}
              className={`rounded-xl border p-3 text-sm font-medium capitalize transition ${
                preferredTime === t
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                  : 'border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button onClick={onNext}>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

function Step3({
  level,
  setLevel,
  onBack,
  onNext,
}: {
  level: KnowledgeLevel;
  setLevel: (l: KnowledgeLevel) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Card padding="lg">
      <StepHeader title="How confident are you?" subtitle="Pick your current knowledge level. You can adjust later." />
      <div className="space-y-3">
        {TIMES.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setLevel(opt.id)}
            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
              level === opt.id
                ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30'
                : 'border-ink-200 hover:border-ink-300 dark:border-ink-700 dark:hover:border-ink-600'
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-ink-900 dark:text-ink-50">{opt.label}</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">{opt.description}</p>
            </div>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                level === opt.id ? 'border-primary-600 bg-primary-600' : 'border-ink-300 dark:border-ink-600'
              }`}
            >
              {level === opt.id && <Check size={12} className="text-white" />}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button onClick={onNext}>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

function Step4({
  questions,
  currentQ,
  setCurrentQ,
  answers,
  setAnswers,
  onBack,
  onSubmit,
  submitting,
}: {
  questions: Question[];
  currentQ: number;
  setCurrentQ: (n: number) => void;
  answers: Record<string, string>;
  setAnswers: (a: Record<string, string>) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  if (questions.length === 0) {
    return (
      <Card padding="lg" className="flex flex-col items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-primary-600" />
        <p className="mt-3 text-sm text-ink-500">Generating your diagnostic quiz…</p>
      </Card>
    );
  }

  const q = questions[currentQ];
  const answered = Object.keys(answers).length;
  const isLast = currentQ === questions.length - 1;
  const canSubmit = answered === questions.length;
  const selected = answers[q.id];

  const pick = (value: string) => {
    setAnswers({ ...answers, [q.id]: value });
  };

  return (
    <Card padding="lg">
      <div className="mb-5 flex items-center justify-between">
        <Badge tone="primary">
          Question {currentQ + 1} of {questions.length}
        </Badge>
        <div className="flex items-center gap-1.5 text-sm font-medium text-ink-500 dark:text-ink-400">
          <Clock size={14} />
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>

      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className="h-full rounded-full bg-primary-600 transition-all"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      <h3 className="mt-5 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{q.prompt}</h3>

      <div className="mt-5 space-y-2">
        {q.options?.map((opt) => (
          <button
            key={opt}
            onClick={() => pick(opt)}
            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
              selected === opt
                ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30'
                : 'border-ink-200 hover:border-ink-300 dark:border-ink-700 dark:hover:border-ink-600'
            }`}
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                selected === opt ? 'border-primary-600 bg-primary-600' : 'border-ink-300 dark:border-ink-600'
              }`}
            >
              {selected === opt && <Check size={12} className="text-white" />}
            </div>
            <span className="text-sm text-ink-800 dark:text-ink-100">{opt}</span>
          </button>
        ))}
        {q.type === 'short-answer' && (
          <Input
            placeholder="Type your answer…"
            value={selected ?? ''}
            onChange={(e) => pick(e.target.value)}
          />
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={currentQ === 0}>
          <ArrowLeft size={16} /> Back
        </Button>
        {isLast ? (
          <Button onClick={onSubmit} loading={submitting} disabled={!canSubmit}>
            Submit assessment
          </Button>
        ) : (
          <Button onClick={() => setCurrentQ(currentQ + 1)} disabled={!selected}>
            Next <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </Card>
  );
}

function Analysis({
  outcome,
  generating,
  onGenerate,
}: {
  outcome: DiagnosticOutcome;
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <Card padding="lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 text-white shadow-soft">
          <Brain size={26} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Knowledge Analysis</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Based on your diagnostic, here's where you stand.
        </p>
      </div>

      <div className="space-y-4">
        {outcome.strong.length > 0 && (
          <AnalysisGroup
            label="Strong"
            topics={outcome.strong}
            icon={TrendingUp}
            tone="success"
          />
        )}
        {outcome.improve.length > 0 && (
          <AnalysisGroup
            label="Needs Improvement"
            topics={outcome.improve}
            icon={Sparkles}
            tone="warning"
          />
        )}
        {outcome.critical.length > 0 && (
          <AnalysisGroup
            label="Critical"
            topics={outcome.critical}
            icon={AlertTriangle}
            tone="error"
          />
        )}
      </div>

      <div className="mt-6 rounded-xl2 bg-gradient-to-br from-primary-50 to-accent-50 p-5 text-center dark:from-primary-900/30 dark:to-accent-900/30">
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Nova will prioritize your critical and weak topics first, then reinforce strong areas with spaced repetition.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <Button size="lg" onClick={onGenerate} loading={generating}>
          <Sparkles size={18} /> Generate My Personalized Plan
        </Button>
      </div>
    </Card>
  );
}

function AnalysisGroup({
  label,
  topics,
  icon: Icon,
  tone,
}: {
  label: string;
  topics: string[];
  icon: typeof TrendingUp;
  tone: 'success' | 'warning' | 'error';
}) {
  const styles = {
    success: 'border-success-200 bg-success-50 text-success-700 dark:border-success-700 dark:bg-success-700/20 dark:text-success-200',
    warning: 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-700 dark:bg-warning-700/20 dark:text-warning-200',
    error: 'border-error-200 bg-error-50 text-error-700 dark:border-error-700 dark:bg-error-700/20 dark:text-error-200',
  };
  return (
    <div className={`rounded-xl2 border p-4 ${styles[tone]}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} />
        <h3 className="font-display text-sm font-bold uppercase tracking-wide">{label}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <span key={t} className="rounded-lg bg-white/60 px-3 py-1.5 text-sm font-medium dark:bg-ink-900/40">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
