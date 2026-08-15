import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Play,
  Check,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Upload,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppData } from '@/store/AppDataContext';
import { useToast } from '@/store/ToastContext';
import type { DocumentAnalysisResponse, MockTest, MockTestResult, Question } from '@/types';

const ACCEPTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const SUBJECTS = ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks'];
const TOPIC_OPTIONS = [
  'Dynamic Programming', 'Graph Algorithms', 'Arrays & Complexity', 'Linked Lists',
  'Normalization', 'CPU Scheduling', 'TCP/IP Model', 'Indexing',
];
const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'] as const;

export function Assessments() {
  const { generateMockTest, submitMockTest, analyzeDocument, generateMockTestFromDocument } = useAppData();
  const { showToast } = useToast();

  const [source, setSource] = useState<'manual' | 'document'>('manual');
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number]>('mixed');
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [test, setTest] = useState<MockTest | null>(null);
  const [phase, setPhase] = useState<'config' | 'taking' | 'result'>('config');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MockTestResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'analyzing' | 'analyzed' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [docAnalysis, setDocAnalysis] = useState<DocumentAnalysisResponse | null>(null);
  const [generatingFromDoc, setGeneratingFromDoc] = useState(false);

  const toggleTopic = (t: string) => {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const t = await generateMockTest({ subject: subject || 'DSA', topics, difficulty, numQuestions });
      setTest(t);
      setAnswers({});
      setCurrentQ(0);
      setPhase('taking');
      showToast('Mock test generated. Good luck!');
    } catch {
      showToast('Could not generate test.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      setUploadStatus('error');
      setUploadError('Unsupported file type. Please upload a PDF, DOCX, or an image (JPG/PNG/WEBP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadError('File is too large. Maximum size is 20MB.');
      return;
    }

    setUploadStatus('analyzing');
    setUploadError(null);
    setDocAnalysis(null);
    try {
      const analysis = await analyzeDocument(file);
      setDocAnalysis(analysis);
      setUploadStatus('analyzed');
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'Could not analyze this document.');
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadError(null);
    setDocAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateFromDocument = async () => {
    if (!docAnalysis) return;
    setGeneratingFromDoc(true);
    try {
      const t = await generateMockTestFromDocument(docAnalysis.documentId, docAnalysis.fileName, {
        numQuestions,
        difficulty,
      });
      setTest(t);
      setAnswers({});
      setCurrentQ(0);
      setPhase('taking');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not generate test from this document.', 'error');
    } finally {
      setGeneratingFromDoc(false);
    }
  };

  const handleSubmit = async () => {
    if (!test) return;
    setSubmitting(true);
    try {
      const r = await submitMockTest(test, answers);
      setResult(r);
      setPhase('result');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setTest(null);
    setResult(null);
    setAnswers({});
    setPhase('config');
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Assessments"
          subtitle="Generate mock tests and find your weak spots."
          action={<Badge tone="primary"><ClipboardList size={12} /> Mock tests</Badge>}
        />

        <AnimatePresence mode="wait">
          {phase === 'config' && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card padding="lg" className="max-w-2xl">
                <h3 className="mb-5 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">Configure your mock test</h3>

                <div className="mb-6 inline-flex rounded-xl border border-ink-200 p-1 dark:border-ink-700">
                  <button
                    onClick={() => setSource('manual')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      source === 'manual'
                        ? 'bg-primary-600 text-white shadow-soft'
                        : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100'
                    }`}
                  >
                    Manual Setup
                  </button>
                  <button
                    onClick={() => setSource('document')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      source === 'document'
                        ? 'bg-primary-600 text-white shadow-soft'
                        : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100'
                    }`}
                  >
                    <Upload size={14} className="mr-1.5 inline" /> Upload Document
                  </button>
                </div>

                {source === 'document' ? (
                  <DocumentUploadPanel
                    fileInputRef={fileInputRef}
                    uploadStatus={uploadStatus}
                    uploadError={uploadError}
                    docAnalysis={docAnalysis}
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    numQuestions={numQuestions}
                    setNumQuestions={setNumQuestions}
                    onFileSelect={handleFileSelect}
                    onReset={resetUpload}
                    onGenerate={handleGenerateFromDocument}
                    generating={generatingFromDoc}
                  />
                ) : (
                  <>
                <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Subject</label>
                <div className="mb-5 flex flex-wrap gap-2">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        subject === s
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                          : 'border-ink-200 text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:text-ink-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Topics (optional)</label>
                <div className="mb-5 flex flex-wrap gap-2">
                  {TOPIC_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTopic(t)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        topics.includes(t)
                          ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200'
                          : 'border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Difficulty</label>
                <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`rounded-xl border p-3 text-sm font-medium capitalize transition ${
                        difficulty === d
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                          : 'border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Number of questions</label>
                <div className="mb-6 flex items-center gap-4">
                  <input
                    type="range"
                    min={3}
                    max={12}
                    step={1}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="flex-1 accent-primary-600"
                  />
                  <Badge tone="primary">{numQuestions} Qs</Badge>
                </div>

                <Button size="lg" fullWidth onClick={handleGenerate} loading={generating}>
                  <Play size={16} /> Generate Mock Test
                </Button>
                  </>
                )}
              </Card>
            </motion.div>
          )}

          {phase === 'taking' && test && (
            <motion.div key="taking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TakingView
                test={test}
                currentQ={currentQ}
                setCurrentQ={setCurrentQ}
                answers={answers}
                setAnswers={setAnswers}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </motion.div>
          )}

          {phase === 'result' && result && test && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultView result={result} test={test} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

function TakingView({
  test,
  currentQ,
  setCurrentQ,
  answers,
  setAnswers,
  onSubmit,
  submitting,
}: {
  test: MockTest;
  currentQ: number;
  setCurrentQ: (n: number) => void;
  answers: Record<string, string>;
  setAnswers: (a: Record<string, string>) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const q = test.questions[currentQ];
  const answered = Object.keys(answers).length;
  const isLast = currentQ === test.questions.length - 1;
  const selected = answers[q.id];

  const pick = (value: string) => setAnswers({ ...answers, [q.id]: value });

  return (
    <div className="mx-auto max-w-2xl">
      <Card padding="lg">
        <div className="mb-5 flex items-center justify-between">
          <Badge tone="primary">Question {currentQ + 1} of {test.questions.length}</Badge>
          <span className="text-sm text-ink-400">{answered}/{test.questions.length} answered</span>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
          <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${((currentQ + 1) / test.questions.length) * 100}%` }} />
        </div>

        <div className="mb-2 flex gap-2">
          <Badge tone="neutral">{q.topic}</Badge>
          <Badge tone="accent">{q.difficulty}</Badge>
        </div>

        <h3 className="mt-3 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{q.prompt}</h3>

        <div className="mt-5 space-y-2">
          {q.options?.map((opt) => (
            <button
              key={opt}
              onClick={() => pick(opt)}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                selected === opt
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30'
                  : 'border-ink-200 hover:border-ink-300 dark:border-ink-700'
              }`}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                selected === opt ? 'border-primary-600 bg-primary-600' : 'border-ink-300 dark:border-ink-600'
              }`}>
                {selected === opt && <Check size={12} className="text-white" />}
              </div>
              <span className="text-sm text-ink-800 dark:text-ink-100">{opt}</span>
            </button>
          ))}
          {q.type === 'short-answer' && (
            <input
              value={selected ?? ''}
              onChange={(e) => pick(e.target.value)}
              placeholder="Type your answer…"
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm dark:border-ink-700 dark:bg-ink-900"
            />
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>
            <ChevronLeft size={16} /> Previous
          </Button>
          {isLast ? (
            <Button onClick={onSubmit} loading={submitting} disabled={answered < test.questions.length}>
              Submit Test
            </Button>
          ) : (
            <Button onClick={() => setCurrentQ(currentQ + 1)} disabled={!selected}>
              Next <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function ResultView({ result, test, onReset }: { result: MockTestResult; test: MockTest; onReset: () => void }) {
  const passed = result.scorePercent >= 60;
  return (
    <div className="mx-auto max-w-2xl">
      <Card padding="lg">
        <div className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-soft ${
            passed ? 'bg-gradient-to-br from-accent-500 to-primary-600' : 'bg-gradient-to-br from-warning-500 to-error-500'
          }`}>
            <Trophy size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Test Complete</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">You scored</p>
          <p className="font-display text-4xl font-bold text-ink-900 dark:text-ink-50">{result.scorePercent}%</p>
          <p className="text-sm text-ink-500">{result.correctCount}/{result.totalQuestions} correct</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-success-200 bg-success-50 p-4 text-center dark:border-success-700 dark:bg-success-700/20">
            <p className="font-display text-xl font-bold text-success-700 dark:text-success-300">{result.correctCount}</p>
            <p className="text-xs text-ink-500">Correct</p>
          </div>
          <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-center dark:border-error-700 dark:bg-error-700/20">
            <p className="font-display text-xl font-bold text-error-700 dark:text-error-300">{result.totalQuestions - result.correctCount}</p>
            <p className="text-xs text-ink-500">Wrong</p>
          </div>
        </div>

        {result.weakAreas.length > 0 && (
          <div className="mt-5 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-700 dark:bg-warning-700/20">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-warning-700 dark:text-warning-200">
              <AlertTriangle size={16} /> Weak Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.weakAreas.map((t) => (
                <span key={t} className="rounded-lg bg-white/60 px-3 py-1.5 text-sm font-medium dark:bg-ink-900/40">{t}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 space-y-2">
          <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">Review answers</h3>
          {test.questions.map((q, i) => {
            const userAns = result.perQuestion.find((p) => p.questionId === q.id);
            const correct = userAns?.correct ?? false;
            return <ReviewRow key={q.id} q={q} index={i} correct={correct} />;
          })}
        </div>

        <Button className="mt-6" fullWidth size="lg" onClick={onReset}>
          <RotateCcw size={16} /> Take Another Test
        </Button>
      </Card>
    </div>
  );
}

function ReviewRow({ q, index, correct }: { q: Question; index: number; correct: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${correct ? 'border-success-200 bg-success-50/50 dark:border-success-700 dark:bg-success-700/10' : 'border-error-200 bg-error-50/50 dark:border-error-700 dark:bg-error-700/10'}`}>
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${correct ? 'bg-success-500' : 'bg-error-500'}`}>
          {correct ? '✓' : '✗'}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{index + 1}. {q.prompt}</p>
          {!correct && <p className="mt-1 text-xs text-ink-500">Correct answer: <span className="text-success-700">{q.correctAnswer}</span></p>}
        </div>
      </div>
    </div>
  );
}

const IMPORTANCE_TONE = { high: 'error', medium: 'warning', low: 'neutral' } as const;

function DocumentUploadPanel({
  fileInputRef,
  uploadStatus,
  uploadError,
  docAnalysis,
  difficulty,
  setDifficulty,
  numQuestions,
  setNumQuestions,
  onFileSelect,
  onReset,
  onGenerate,
  generating,
}: {
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadStatus: 'idle' | 'analyzing' | 'analyzed' | 'error';
  uploadError: string | null;
  docAnalysis: DocumentAnalysisResponse | null;
  difficulty: typeof DIFFICULTIES[number];
  setDifficulty: (d: typeof DIFFICULTIES[number]) => void;
  numQuestions: number;
  setNumQuestions: (n: number) => void;
  onFileSelect: (file: File | undefined) => void;
  onReset: () => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files?.[0])}
      />

      {uploadStatus === 'idle' && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-300 p-10 text-center transition hover:border-primary-400 hover:bg-primary-50/40 dark:border-ink-700 dark:hover:border-primary-600 dark:hover:bg-primary-900/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
            <Upload size={20} />
          </div>
          <div>
            <p className="font-medium text-ink-800 dark:text-ink-100">Upload a syllabus, question paper, or study material</p>
            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">PDF, DOCX, or image (JPG/PNG/WEBP) — up to 20MB</p>
          </div>
        </button>
      )}

      {uploadStatus === 'analyzing' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-ink-200 p-10 text-center dark:border-ink-700">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm font-medium text-ink-700 dark:text-ink-200">Analyzing your document with AI…</p>
          <p className="text-xs text-ink-400">This can take up to a minute for longer documents.</p>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-700 dark:bg-error-700/10">
          <AlertTriangle className="mx-auto mb-2 text-error-600" size={24} />
          <p className="text-sm font-medium text-error-700 dark:text-error-300">{uploadError}</p>
          <Button variant="outline" className="mt-4" onClick={onReset}>
            Try again
          </Button>
        </div>
      )}

      {uploadStatus === 'analyzed' && docAnalysis && (
        <div>
          <div className="mb-4 flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-800/50">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-200">
              <FileText size={16} /> {docAnalysis.fileName}
            </div>
            <button onClick={onReset} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-100" aria-label="Remove file">
              <X size={16} />
            </button>
          </div>

          <p className="mb-4 text-sm text-ink-600 dark:text-ink-300">{docAnalysis.analysis.summary}</p>

          {docAnalysis.analysis.topics.length > 0 && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Important topics found</label>
              <div className="flex flex-wrap gap-2">
                {docAnalysis.analysis.topics.map((t) => (
                  <Badge key={t.name} tone={IMPORTANCE_TONE[t.importance]}>{t.name}</Badge>
                ))}
              </div>
            </div>
          )}

          {docAnalysis.analysis.priorities.length > 0 && (
            <div className="mb-5 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-200">
                <Sparkles size={14} /> Study priorities
              </h4>
              <ul className="space-y-1 text-sm text-ink-600 dark:text-ink-300">
                {docAnalysis.analysis.priorities.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-primary-500">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Difficulty</label>
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-xl border p-3 text-sm font-medium capitalize transition ${
                  difficulty === d
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                    : 'border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">Number of questions</label>
          <div className="mb-6 flex items-center gap-4">
            <input
              type="range"
              min={3}
              max={12}
              step={1}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="flex-1 accent-primary-600"
            />
            <Badge tone="primary">{numQuestions} Qs</Badge>
          </div>

          <Button size="lg" fullWidth onClick={onGenerate} loading={generating}>
            <Play size={16} /> Generate Mock Test
          </Button>
        </div>
      )}
    </div>
  );
}
