import { Router } from 'express';
import { generateQuestionsFromTopic, GeminiError } from '../lib/gemini.js';
import { requireAuth } from '../middleware/auth.js';

export const mocktestRouter = Router();

const DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'];

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
    const questions = await generateQuestionsFromTopic({ subject, topics: safeTopics, difficulty: diff, numQuestions: count });
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
