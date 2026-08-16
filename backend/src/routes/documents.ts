import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { extractDocument, ExtractionError } from '../lib/extractText.js';
import { analyzeDocument, generateQuestionsFromDocument, GeminiError } from '../lib/gemini.js';
import { documentStore } from '../lib/documentStore.js';
import { mockTestSessionStore } from '../lib/mockTestSessions.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const documentsRouter = Router();

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new ExtractionError('Unsupported file type. Please upload a PDF, DOCX, or an image (JPG/PNG/WEBP).'));
  },
});

documentsRouter.post('/analyze', requireAuth, (req: AuthedRequest, res) => {
  upload.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) {
      const message =
        uploadErr instanceof multer.MulterError && uploadErr.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large. Maximum size is 20MB.'
          : uploadErr instanceof Error
            ? uploadErr.message
            : 'Upload failed.';
      res.status(400).json({ error: { message } });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: { message: 'No file was uploaded.' } });
      return;
    }

    try {
      const extracted = await extractDocument({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      });

      const analysis = await analyzeDocument(extracted, req.file.originalname);

      const documentId = randomUUID();
      documentStore.save({
        id: documentId,
        userId: req.userId!,
        fileName: req.file.originalname,
        extracted,
        analysis,
        createdAt: Date.now(),
      });

      res.json({ data: { documentId, fileName: req.file.originalname, analysis } });
    } catch (err) {
      if (err instanceof ExtractionError) {
        res.status(422).json({ error: { message: err.message } });
        return;
      }
      if (err instanceof GeminiError) {
        res.status(502).json({ error: { message: err.message } });
        return;
      }
      console.error('Document analysis failed:', err);
      res.status(500).json({ error: { message: 'Something went wrong analyzing this document. Please try again.' } });
    }
  });
});

documentsRouter.post('/generate-test', requireAuth, async (req: AuthedRequest, res) => {
  const { documentId, numQuestions, difficulty } = req.body ?? {};

  if (!documentId || typeof documentId !== 'string') {
    res.status(400).json({ error: { message: 'documentId is required.' } });
    return;
  }

  const doc = documentStore.get(documentId, req.userId!);
  if (!doc) {
    res.status(404).json({ error: { message: 'This analyzed document has expired. Please re-upload it.' } });
    return;
  }

  const count = Math.min(Math.max(Number(numQuestions) || 5, 3), 15);
  const diff = ['easy', 'medium', 'hard', 'mixed'].includes(difficulty) ? difficulty : 'mixed';

  try {
    const questions = await generateQuestionsFromDocument(doc.extracted, doc.analysis, {
      numQuestions: count,
      difficulty: diff,
    });
    const session = mockTestSessionStore.create(req.userId!, doc.fileName, questions);
    res.json({ data: { fileName: doc.fileName, testId: session.id, questions: session.questions } });
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: { message: err.message } });
      return;
    }
    console.error('Question generation failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong generating the test. Please try again.' } });
  }
});
