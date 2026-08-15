import { Router } from 'express';
import { goalStore } from '../lib/goals.js';
import { planStore, sessionStore } from '../lib/studyPlans.js';
import { documentStore } from '../lib/documentStore.js';
import { generateDiagnosticAssessment, evaluateDiagnosticAssessment, GeminiError } from '../lib/gemini.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const goalsRouter = Router();

function safeStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

goalsRouter.get('/current', requireAuth, async (req: AuthedRequest, res) => {
  const goal = await goalStore.getActive(req.userId!);
  res.json({ data: { goal: goal ?? null } });
});

goalsRouter.post('/diagnostic', requireAuth, async (req: AuthedRequest, res) => {
  const { subjects, topics, documentId } = req.body ?? {};
  const safeSubjects = safeStrings(subjects);
  if (safeSubjects.length === 0) {
    res.status(400).json({ error: { message: 'At least one subject is required.' } });
    return;
  }

  let supplementaryMaterial: string | undefined;
  if (typeof documentId === 'string' && documentId) {
    const doc = documentStore.get(documentId, req.userId!);
    if (doc && doc.extracted.kind === 'text') supplementaryMaterial = doc.extracted.text;
  }

  try {
    const questions = await generateDiagnosticAssessment({
      subjects: safeSubjects,
      topics: safeStrings(topics),
      supplementaryMaterial,
    });
    res.json({ data: { questions } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Diagnostic generation failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong generating the diagnostic. Please try again.' } });
  }
});

goalsRouter.post('/diagnostic/evaluate', requireAuth, async (req: AuthedRequest, res) => {
  const { subjects, qa } = req.body ?? {};
  const safeSubjects = safeStrings(subjects);
  if (!Array.isArray(qa) || qa.length === 0) {
    res.status(400).json({ error: { message: 'qa answers are required.' } });
    return;
  }
  const safeQa = qa
    .filter((item): item is Record<string, unknown> => !!item)
    .map((item) => ({
      prompt: typeof item.prompt === 'string' ? item.prompt : '',
      correctAnswer: typeof item.correctAnswer === 'string' ? item.correctAnswer : '',
      studentAnswer: typeof item.studentAnswer === 'string' ? item.studentAnswer : '',
      topic: typeof item.topic === 'string' ? item.topic : 'General',
    }));

  try {
    const evaluation = await evaluateDiagnosticAssessment({ subjects: safeSubjects, qa: safeQa });
    res.json({ data: evaluation });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Diagnostic evaluation failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong evaluating the diagnostic. Please try again.' } });
  }
});

goalsRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { type, title, subjects, topics, deadline, availableTime, knowledgeLevel } = req.body ?? {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: { message: 'Give your goal a name.' } });
    return;
  }
  if (!deadline || typeof deadline !== 'string' || Number.isNaN(new Date(deadline).getTime())) {
    res.status(400).json({ error: { message: 'Pick a valid target deadline.' } });
    return;
  }
  const safeSubjects = safeStrings(subjects);
  if (safeSubjects.length === 0) {
    res.status(400).json({ error: { message: 'At least one subject is required.' } });
    return;
  }
  const validTypes = ['exam', 'subject', 'topic-mastery', 'weak-areas', 'placement'];
  const validLevels = ['beginner', 'intermediate', 'advanced'];
  const at = availableTime ?? {};

  const goal = await goalStore.create({
    userId: req.userId!,
    type: validTypes.includes(type) ? type : 'exam',
    title: title.trim(),
    subjects: safeSubjects,
    topics: safeStrings(topics),
    deadline,
    availableTime: {
      hoursPerDay: Number(at.hoursPerDay) > 0 ? Number(at.hoursPerDay) : 2,
      studyDays: safeStrings(at.studyDays).length > 0 ? safeStrings(at.studyDays) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      preferredTime: typeof at.preferredTime === 'string' ? at.preferredTime : 'evening',
    },
    knowledgeLevel: validLevels.includes(knowledgeLevel) ? knowledgeLevel : 'beginner',
  });
  res.json({ data: { goal } });
});

goalsRouter.delete('/current', requireAuth, async (req: AuthedRequest, res) => {
  await goalStore.clearActive(req.userId!);
  const activePlan = await planStore.getActive(req.userId!);
  if (activePlan) {
    await sessionStore.deleteByPlan(activePlan.id);
    await planStore.clearActive(req.userId!);
  }
  res.json({ data: { ok: true } });
});
