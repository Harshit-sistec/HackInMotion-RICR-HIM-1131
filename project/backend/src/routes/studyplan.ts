import { Router } from 'express';
import { generateStudyPlanSessions, GeminiError } from '../lib/gemini.js';
import { requireAuth } from '../middleware/auth.js';

export const studyPlanRouter = Router();

studyPlanRouter.post('/generate', requireAuth, async (req, res) => {
  const { goalTitle, subjects, topics, deadline, hoursPerDay, preferredTime, knowledgeLevel, weakTopics } =
    req.body ?? {};

  if (!goalTitle || typeof goalTitle !== 'string') {
    res.status(400).json({ error: { message: 'goalTitle is required.' } });
    return;
  }
  if (!deadline || typeof deadline !== 'string' || Number.isNaN(new Date(deadline).getTime())) {
    res.status(400).json({ error: { message: 'A valid deadline is required.' } });
    return;
  }

  const daysUntilDeadline = Math.max(
    1,
    Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const numSessions = Math.min(Math.max(daysUntilDeadline, 3), 14);

  try {
    const sessions = await generateStudyPlanSessions({
      goalTitle,
      subjects: Array.isArray(subjects) ? subjects.filter((s): s is string => typeof s === 'string') : [],
      topics: Array.isArray(topics) ? topics.filter((t): t is string => typeof t === 'string') : [],
      deadline,
      hoursPerDay: Number(hoursPerDay) > 0 ? Number(hoursPerDay) : 2,
      preferredTime: typeof preferredTime === 'string' ? preferredTime : 'evening',
      knowledgeLevel: typeof knowledgeLevel === 'string' ? knowledgeLevel : 'intermediate',
      weakTopics: Array.isArray(weakTopics) ? weakTopics.filter((t): t is string => typeof t === 'string') : [],
      numSessions,
    });
    res.json({ data: { sessions } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Study plan generation failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong generating your study plan. Please try again.' } });
  }
});
