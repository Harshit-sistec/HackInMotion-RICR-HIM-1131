import { Router } from 'express';
import { computeProgressForUser } from '../lib/progressCompute.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const progressRouter = Router();

progressRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const { snapshot, achievements, weakTopics } = await computeProgressForUser(req.userId!);
  res.json({ data: { snapshot, achievements, weakTopics } });
});
