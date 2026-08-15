import { Router } from 'express';
import { generateQuestionsFromTopic, suggestTopics, GeminiError } from '../lib/gemini.js';
import { assessmentStore } from '../lib/assessments.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const mocktestRouter = Router();

const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'];

interface SubmittedQuestion {
  id: string;
  correctAnswer: string;
  topic: string;
}

mocktestRouter.post('/generate', requireAuth, async (req, res) => {
  const { subject, topics, difficulty, numQuestions } = req.body ?? {};

  if (!subject || typeof subject !== 'string') {
    res.status(400).json({ error: { message: 'subject is required.' } });
    return;
  }

  const safeTopics = Array.isArray(topics) ? topics.filter((t): t is string => typeof t === 'string') : [];
  const diff = DIFFICULTIES.includes(difficulty) ? difficulty : 'mixed';
  const count = Math.min(Math.max(Number(numQuestions) || 5, 3), 15);

  try {
    const questions = await generateQuestionsFromTopic({
      subject,
      topics: safeTopics,
      difficulty: diff,
      numQuestions: count,
    });
    res.json({ data: { questions } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Mock test generation failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong generating the test. Please try again.' } });
  }
});

mocktestRouter.post('/suggest-topics', requireAuth, async (req, res) => {
  const { subject, weakTopics } = req.body ?? {};

  if (!subject || typeof subject !== 'string') {
    res.status(400).json({ error: { message: 'subject is required.' } });
    return;
  }

  const safeWeakTopics = Array.isArray(weakTopics) ? weakTopics.filter((t): t is string => typeof t === 'string') : [];

  try {
    const topics = await suggestTopics({ subject, weakTopics: safeWeakTopics });
    res.json({ data: { topics } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Topic suggestion failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong suggesting topics. Please try again.' } });
  }
});

mocktestRouter.post('/submit', requireAuth, async (req: AuthedRequest, res) => {
  const { subject, questions, answers, timeSpentSeconds } = req.body ?? {};

  if (!subject || typeof subject !== 'string') {
    res.status(400).json({ error: { message: 'subject is required.' } });
    return;
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: { message: 'questions are required.' } });
    return;
  }

  const safeQuestions = (questions as SubmittedQuestion[]).filter(
    (q) => q && typeof q.id === 'string' && typeof q.correctAnswer === 'string' && typeof q.topic === 'string',
  );
  const safeAnswers: Record<string, string> = answers && typeof answers === 'object' ? answers : {};

  const perQuestion = safeQuestions.map((q) => ({
    questionId: q.id,
    correct: (safeAnswers[q.id] ?? '').trim().toLowerCase() === q.correctAnswer.trim().toLowerCase(),
  }));
  const correctCount = perQuestion.filter((p) => p.correct).length;
  const weakAreas = Array.from(
    new Set(safeQuestions.filter((q) => !perQuestion.find((p) => p.questionId === q.id)?.correct).map((q) => q.topic)),
  );

  const topicTotals = new Map<string, { correct: number; total: number }>();
  safeQuestions.forEach((q) => {
    const entry = topicTotals.get(q.topic) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (perQuestion.find((p) => p.questionId === q.id)?.correct) entry.correct += 1;
    topicTotals.set(q.topic, entry);
  });
  const topicBreakdown = Array.from(topicTotals.entries()).map(([topic, v]) => ({ topic, ...v }));
  const scorePercent = Math.round((correctCount / safeQuestions.length) * 100);

  const result = await assessmentStore.create({
    userId: req.userId!,
    kind: 'mock-test',
    subject,
    scorePercent,
    correctCount,
    totalQuestions: safeQuestions.length,
    timeSpentSeconds: Number(timeSpentSeconds) || 0,
    weakAreas,
    topicBreakdown,
  });

  res.json({
    data: {
      testId: result.id,
      subject: result.subject,
      takenAt: result.takenAt,
      scorePercent: result.scorePercent,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      timeSpentSeconds: result.timeSpentSeconds,
      weakAreas: result.weakAreas,
      perQuestion,
      topicBreakdown: result.topicBreakdown,
    },
  });
});

mocktestRouter.get('/results', requireAuth, async (req: AuthedRequest, res) => {
  const results = await assessmentStore.listByUser(req.userId!);
  const mockTestResults = results
    .filter((r) => r.kind === 'mock-test')
    .map((r) => ({
      testId: r.id,
      subject: r.subject,
      takenAt: r.takenAt,
      scorePercent: r.scorePercent ?? 0,
      correctCount: r.correctCount ?? 0,
      totalQuestions: r.totalQuestions ?? 0,
      timeSpentSeconds: r.timeSpentSeconds ?? 0,
      weakAreas: r.weakAreas,
      topicBreakdown: r.topicBreakdown ?? [],
    }));
  res.json({ data: { results: mockTestResults } });
});
