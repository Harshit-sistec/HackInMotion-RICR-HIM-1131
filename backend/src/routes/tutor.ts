import { Router } from 'express';
import { generateTutorReply, parseTutorReply, GeminiError, type TutorTurn } from '../lib/gemini.js';
import { searchEducationalVideo } from '../lib/youtube.js';
import { chatStore } from '../lib/chatHistory.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const tutorRouter = Router();

interface IncomingChatMessage {
  role: 'user' | 'ai';
  content: string;
}

tutorRouter.get('/history', requireAuth, async (req: AuthedRequest, res) => {
  const history = await chatStore.listByUser(req.userId!);
  res.json({ data: { history } });
});

tutorRouter.post('/chat', requireAuth, async (req: AuthedRequest, res) => {
  const { history, message } = req.body ?? {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: { message: 'A message is required.' } });
    return;
  }
  if (!Array.isArray(history)) {
    res.status(400).json({ error: { message: 'history must be an array.' } });
    return;
  }

  const cleaned = (history as IncomingChatMessage[]).filter(
    (m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'ai'),
  );
  // Gemini requires chat history to start with a 'user' turn — drop any leading
  // assistant turns (e.g. a static welcome greeting the frontend seeds the chat with).
  const firstUserIndex = cleaned.findIndex((m) => m.role === 'user');
  const trimmed = firstUserIndex === -1 ? [] : cleaned.slice(firstUserIndex);
  const turns: TutorTurn[] = trimmed.map((m) => ({ role: m.role === 'ai' ? 'model' : 'user', text: m.content }));

  try {
    const raw = await generateTutorReply(turns, message.trim());
    const { content, videoQuery } = parseTutorReply(raw);

    const video = videoQuery
      ? await searchEducationalVideo(videoQuery).catch((err) => {
          console.error('Video lookup failed:', err instanceof Error ? err.message : err);
          return null;
        })
      : null;

    await chatStore.append({ userId: req.userId!, role: 'user', content: message.trim(), videoQuery: null });
    await chatStore.append({ userId: req.userId!, role: 'ai', content, videoQuery });

    res.json({ data: { content, video } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Tutor chat failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
  }
});
