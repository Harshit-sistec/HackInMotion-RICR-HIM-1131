import { Router } from 'express';
import {
  generateStudyPlanSessions,
  generateSessionAssessment,
  evaluateSessionUnderstanding,
  GeminiError,
} from '../lib/gemini.js';
import { goalStore } from '../lib/goals.js';
import { planStore, sessionStore, type StoredStudySession } from '../lib/studyPlans.js';
import { assessmentStore } from '../lib/assessments.js';
import { computeProgressForUser } from '../lib/progressCompute.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const studyPlanRouter = Router();

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function recomputeCompletion(sessions: StoredStudySession[]): number {
  if (sessions.length === 0) return 0;
  const totalConcepts = sessions.reduce((sum, s) => sum + s.conceptsTotal, 0);
  const doneConcepts = sessions.reduce((sum, s) => sum + s.conceptsDone, 0);
  if (totalConcepts === 0) return 0;
  return Math.round((doneConcepts / totalConcepts) * 100);
}

function scheduleDates(
  sessions: {
    topic: string;
    subject: string;
    objective: string;
    estimatedMinutes: number;
    difficulty: 'easy' | 'medium' | 'hard';
    conceptsTotal: number;
  }[],
  studyDays: string[],
  startDayNumber: number,
  startFrom: Date,
): Omit<StoredStudySession, 'id' | 'planId' | 'userId'>[] {
  const cursor = new Date(startFrom);
  return sessions.map((s, i) => {
    while (studyDays.length > 0 && !studyDays.includes(DAY_SHORT_NAMES[cursor.getDay()])) {
      cursor.setDate(cursor.getDate() + 1);
    }
    const date = cursor.toISOString();
    cursor.setDate(cursor.getDate() + 1);
    return {
      day: startDayNumber + i,
      date,
      topic: s.topic,
      subject: s.subject,
      objective: s.objective,
      estimatedMinutes: s.estimatedMinutes,
      difficulty: s.difficulty,
      status: (i === 0 ? 'upcoming' : 'locked') as StoredStudySession['status'],
      conceptsTotal: s.conceptsTotal,
      conceptsDone: 0,
    };
  });
}

studyPlanRouter.post('/generate', requireAuth, async (req: AuthedRequest, res) => {
  const goal = await goalStore.getActive(req.userId!);
  if (!goal) {
    res.status(400).json({ error: { message: 'Create a learning goal first.' } });
    return;
  }

  const daysUntilDeadline = Math.max(
    1,
    Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const numSessions = Math.min(Math.max(daysUntilDeadline, 3), 14);
  const { weakTopics } = await computeProgressForUser(req.userId!);

  try {
    const generated = await generateStudyPlanSessions({
      goalTitle: goal.title,
      subjects: goal.subjects,
      topics: goal.topics,
      deadline: goal.deadline,
      hoursPerDay: goal.availableTime.hoursPerDay,
      preferredTime: goal.availableTime.preferredTime,
      knowledgeLevel: goal.knowledgeLevel,
      weakTopics,
      numSessions,
    });

    const totalStudyHours = Math.round((generated.reduce((sum, s) => sum + s.estimatedMinutes, 0) / 60) * 10) / 10;
    const plan = await planStore.create({
      userId: req.userId!,
      goalId: goal.id,
      goalTitle: goal.title,
      examDate: goal.deadline,
      totalStudyHours,
      completionPercent: 0,
      lastAdaptedAt: null,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduled = scheduleDates(generated, goal.availableTime.studyDays, 1, tomorrow);
    const sessions = await sessionStore.insertMany(
      scheduled.map((s) => ({ ...s, planId: plan.id, userId: req.userId! })),
    );

    res.json({ data: { plan, sessions } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Study plan generation failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong generating your study plan. Please try again.' } });
  }
});

studyPlanRouter.get('/current', requireAuth, async (req: AuthedRequest, res) => {
  const plan = await planStore.getActive(req.userId!);
  const sessions = plan ? await sessionStore.listByPlan(plan.id) : [];
  res.json({ data: { plan: plan ?? null, sessions } });
});

studyPlanRouter.post('/sessions/:id/complete', requireAuth, async (req: AuthedRequest, res) => {
  const session = await sessionStore.findById(req.params.id);
  if (!session || session.userId !== req.userId) {
    res.status(404).json({ error: { message: 'Session not found.' } });
    return;
  }
  const updated = await sessionStore.update(session.id, {
    status: 'completed',
    conceptsDone: session.conceptsTotal,
    completedAt: new Date().toISOString(),
  });
  const allSessions = await sessionStore.listByPlan(session.planId);
  const plan = await planStore.update(session.planId, { completionPercent: recomputeCompletion(allSessions) });
  res.json({ data: { session: updated, plan } });
});

studyPlanRouter.post('/sessions/:id/reschedule', requireAuth, async (req: AuthedRequest, res) => {
  const { newDate } = req.body ?? {};
  if (!newDate || typeof newDate !== 'string' || Number.isNaN(new Date(newDate).getTime())) {
    res.status(400).json({ error: { message: 'A valid newDate is required.' } });
    return;
  }
  const session = await sessionStore.findById(req.params.id);
  if (!session || session.userId !== req.userId) {
    res.status(404).json({ error: { message: 'Session not found.' } });
    return;
  }
  const updated = await sessionStore.update(session.id, { date: newDate, status: 'upcoming' });
  res.json({ data: { session: updated } });
});

studyPlanRouter.post('/replan', requireAuth, async (req: AuthedRequest, res) => {
  const goal = await goalStore.getActive(req.userId!);
  const plan = await planStore.getActive(req.userId!);
  if (!goal || !plan) {
    res.status(400).json({ error: { message: 'No active study plan to replan.' } });
    return;
  }

  const now = new Date();
  const allSessions = await sessionStore.listByPlan(plan.id);
  const completed = allSessions.filter((s) => s.status === 'completed');
  const incomplete = allSessions.filter((s) => s.status !== 'completed');
  const missedTopics = incomplete.filter((s) => s.status === 'missed' || new Date(s.date) < now).map((s) => s.topic);
  const remainingTopics = Array.from(new Set(incomplete.map((s) => s.topic)));

  const daysUntilExam = Math.max(
    1,
    Math.ceil((new Date(plan.examDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const numSessions = Math.min(Math.max(daysUntilExam, 2), 14);
  const { weakTopics } = await computeProgressForUser(req.userId!);

  try {
    const generated = await generateStudyPlanSessions({
      goalTitle: goal.title,
      subjects: goal.subjects,
      topics: remainingTopics.length > 0 ? remainingTopics : goal.topics,
      deadline: plan.examDate,
      hoursPerDay: goal.availableTime.hoursPerDay,
      preferredTime: goal.availableTime.preferredTime,
      knowledgeLevel: goal.knowledgeLevel,
      weakTopics: Array.from(new Set([...missedTopics, ...weakTopics])),
      numSessions,
    });

    await sessionStore.deleteMany(incomplete.map((s) => s.id));
    const startDay = completed.length > 0 ? Math.max(...completed.map((s) => s.day)) + 1 : 1;
    const scheduled = scheduleDates(generated, goal.availableTime.studyDays, startDay, now);
    const newSessions = await sessionStore.insertMany(
      scheduled.map((s) => ({ ...s, planId: plan.id, userId: req.userId! })),
    );

    const finalSessions = [...completed, ...newSessions].sort((a, b) => a.day - b.day);
    const updatedPlan = await planStore.update(plan.id, {
      completionPercent: recomputeCompletion(finalSessions),
      lastAdaptedAt: now.toISOString(),
    });

    res.json({ data: { plan: updatedPlan, sessions: finalSessions } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Replan failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong adjusting your plan. Please try again.' } });
  }
});

studyPlanRouter.post('/session-assessment', requireAuth, async (req, res) => {
  const { topic, subject, objective, difficulty, supplementaryMaterial } = req.body ?? {};

  if (
    !topic ||
    typeof topic !== 'string' ||
    !subject ||
    typeof subject !== 'string' ||
    !objective ||
    typeof objective !== 'string'
  ) {
    res.status(400).json({ error: { message: 'topic, subject, and objective are required.' } });
    return;
  }
  const diff = DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';

  try {
    const questions = await generateSessionAssessment({
      topic,
      subject,
      objective,
      difficulty: diff,
      supplementaryMaterial: typeof supplementaryMaterial === 'string' ? supplementaryMaterial : undefined,
    });
    res.json({ data: { questions } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Session assessment generation failed:', err);
    res
      .status(500)
      .json({ error: { message: 'Something went wrong generating your knowledge check. Please try again.' } });
  }
});

studyPlanRouter.post('/session-evaluate', requireAuth, async (req: AuthedRequest, res) => {
  const { sessionId, qa } = req.body ?? {};

  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ error: { message: 'sessionId is required.' } });
    return;
  }
  if (!Array.isArray(qa) || qa.length === 0) {
    res.status(400).json({ error: { message: 'qa answers are required.' } });
    return;
  }
  const session = await sessionStore.findById(sessionId);
  if (!session || session.userId !== req.userId) {
    res.status(404).json({ error: { message: 'Session not found.' } });
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
    const evaluation = await evaluateSessionUnderstanding({
      topic: session.topic,
      subject: session.subject,
      objective: session.objective,
      qa: safeQa,
    });

    await assessmentStore.create({
      userId: req.userId!,
      kind: 'session-check',
      subject: session.subject,
      topic: session.topic,
      understood: evaluation.understood,
      masteryLevel: evaluation.masteryLevel,
      weakAreas: evaluation.weakConcepts,
    });

    let updatedSession: StoredStudySession | undefined;
    let updatedPlan = await planStore.findById(session.planId);

    if (evaluation.understood) {
      updatedSession = await sessionStore.update(session.id, {
        status: 'completed',
        conceptsDone: session.conceptsTotal,
        completedAt: new Date().toISOString(),
      });
      const allSessions = await sessionStore.listByPlan(session.planId);
      updatedPlan = await planStore.update(session.planId, { completionPercent: recomputeCompletion(allSessions) });
    } else {
      const newDate = new Date(Date.now() + Math.max(evaluation.recommendedRescheduleDays, 1) * 24 * 60 * 60 * 1000);
      updatedSession = await sessionStore.update(session.id, { date: newDate.toISOString(), status: 'upcoming' });
    }

    res.json({ data: { evaluation, session: updatedSession, plan: updatedPlan } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Session evaluation failed:', err);
    res
      .status(500)
      .json({ error: { message: 'Something went wrong evaluating your understanding. Please try again.' } });
  }
});
