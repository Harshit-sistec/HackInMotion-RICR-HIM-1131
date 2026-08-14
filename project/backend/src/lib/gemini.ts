import { GoogleGenerativeAI, SchemaType, type Part } from '@google/generative-ai';
import { config } from '../config.js';
import type { ExtractedDocument } from './extractText.js';

export interface DocumentAnalysis {
  summary: string;
  topics: { name: string; importance: 'high' | 'medium' | 'low'; frequency: number }[];
  chapters: string[];
  questionPatterns: string[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
  priorities: string[];
}

export interface GeneratedQuestion {
  type: 'mcq' | 'true-false' | 'short-answer';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export class GeminiError extends Error {}

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!config.geminiApiKey) {
    throw new GeminiError('Document analysis is not configured yet. Set GEMINI_API_KEY in server/.env and restart the server.');
  }
  if (!client) client = new GoogleGenerativeAI(config.geminiApiKey);
  return client;
}

function buildParts(extracted: ExtractedDocument, instructionText: string): Part[] {
  const parts: Part[] = [{ text: instructionText }];
  if (extracted.kind === 'text') {
    parts.push({ text: `\n\nDOCUMENT CONTENT:\n"""\n${extracted.text.slice(0, 60000)}\n"""` });
  } else {
    parts.push({ inlineData: { mimeType: extracted.mimeType, data: extracted.base64 } });
    parts.push({ text: '\n\n(The document content above is an image — read the text visible in it.)' });
  }
  return parts;
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenceMatch ? fenceMatch[1] : trimmed).trim();
}

const MAX_OVERLOAD_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateJson<T>(parts: Part[], schema: object): Promise<T> {
  const model = getClient().getGenerativeModel({
    model: config.geminiModel,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema as never,
    },
  });

  let responseText: string | undefined;
  let lastMessage = '';
  for (let attempt = 0; attempt <= MAX_OVERLOAD_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(parts);
      responseText = result.response.text();
      break;
    } catch (err) {
      lastMessage = err instanceof Error ? err.message : String(err);
      console.error(`Gemini raw error (attempt ${attempt + 1}/${MAX_OVERLOAD_RETRIES + 1}):`, lastMessage);
      const isOverloaded = /503|unavailable|overloaded|high demand/i.test(lastMessage);
      if (isOverloaded && attempt < MAX_OVERLOAD_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      if (/quota|rate limit|429/i.test(lastMessage)) {
        throw new GeminiError('The AI service is temporarily rate-limited. Please try again in a moment.');
      }
      if (/api key|permission|401|403/i.test(lastMessage)) {
        throw new GeminiError('The AI service rejected the request. Check the server GEMINI_API_KEY configuration.');
      }
      if (isOverloaded) {
        throw new GeminiError('The AI service is experiencing high demand right now. Please try again in a moment.');
      }
      throw new GeminiError('Could not reach the AI service. Please try again.');
    }
  }
  if (responseText === undefined) {
    throw new GeminiError('Could not reach the AI service. Please try again.');
  }

  try {
    return JSON.parse(extractJsonText(responseText)) as T;
  } catch {
    throw new GeminiError('The AI returned a response that could not be understood. Please try again.');
  }
}

const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    topics: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          importance: { type: SchemaType.STRING, format: 'enum', enum: ['high', 'medium', 'low'] },
          frequency: { type: SchemaType.NUMBER },
        },
        required: ['name', 'importance', 'frequency'],
      },
    },
    chapters: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    questionPatterns: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    difficultyDistribution: {
      type: SchemaType.OBJECT,
      properties: {
        easy: { type: SchemaType.NUMBER },
        medium: { type: SchemaType.NUMBER },
        hard: { type: SchemaType.NUMBER },
      },
      required: ['easy', 'medium', 'hard'],
    },
    priorities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['summary', 'topics', 'chapters', 'questionPatterns', 'difficultyDistribution', 'priorities'],
};

function validateAnalysis(data: unknown): DocumentAnalysis {
  const d = data as Partial<DocumentAnalysis> | null;
  if (
    !d ||
    typeof d.summary !== 'string' ||
    !Array.isArray(d.topics) ||
    d.topics.length === 0 ||
    !Array.isArray(d.chapters) ||
    !Array.isArray(d.questionPatterns) ||
    !Array.isArray(d.priorities) ||
    !d.difficultyDistribution
  ) {
    throw new GeminiError('The AI analysis was incomplete. Please try again.');
  }
  return {
    summary: d.summary,
    topics: d.topics
      .filter((t) => t && typeof t.name === 'string')
      .map((t) => ({
        name: t.name,
        importance: (['high', 'medium', 'low'] as const).includes(t.importance as never) ? t.importance! : 'medium',
        frequency: typeof t.frequency === 'number' ? t.frequency : 0,
      })),
    chapters: d.chapters.filter((c): c is string => typeof c === 'string'),
    questionPatterns: d.questionPatterns.filter((c): c is string => typeof c === 'string'),
    difficultyDistribution: {
      easy: Number(d.difficultyDistribution.easy) || 0,
      medium: Number(d.difficultyDistribution.medium) || 0,
      hard: Number(d.difficultyDistribution.hard) || 0,
    },
    priorities: d.priorities.filter((c): c is string => typeof c === 'string'),
  };
}

export async function analyzeDocument(extracted: ExtractedDocument, fileName: string): Promise<DocumentAnalysis> {
  const instruction = `You are an exam-preparation analyst. Analyze the following uploaded study document (filename: "${fileName}") and identify what actually appears in it — do not invent content that is not present.

Return a structured analysis with:
- summary: 2-3 sentence overview of what this document actually contains.
- topics: the important topics/concepts that actually appear, each with an importance rating and a rough frequency (how many times it comes up, as an integer).
- chapters: chapter/section names if identifiable, else an empty array.
- questionPatterns: recurring question styles or patterns you notice (e.g. "numerical problems on kinematics", "definition-based recall"), else an empty array.
- difficultyDistribution: your best-effort estimate of the approximate percentage split of easy/medium/hard content (should sum to roughly 100).
- priorities: 3-6 concrete study-priority recommendations grounded in what is actually in the document.

Base everything strictly on the document content provided below. If the document contains very little identifiable subject content, keep topics/chapters minimal and say so in the summary rather than fabricating detail.`;

  const parts = buildParts(extracted, instruction);
  const raw = await generateJson<unknown>(parts, analysisSchema);
  return validateAnalysis(raw);
}

const questionsSchema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, format: 'enum', enum: ['mcq', 'true-false', 'short-answer'] },
          prompt: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctAnswer: { type: SchemaType.STRING },
          topic: { type: SchemaType.STRING },
          difficulty: { type: SchemaType.STRING, format: 'enum', enum: ['easy', 'medium', 'hard'] },
        },
        required: ['type', 'prompt', 'correctAnswer', 'topic', 'difficulty'],
      },
    },
  },
  required: ['questions'],
};

function validateQuestions(data: unknown): GeneratedQuestion[] {
  const d = data as { questions?: unknown[] } | null;
  if (!d || !Array.isArray(d.questions)) {
    throw new GeminiError('The AI did not return any questions. Please try again.');
  }

  const valid: GeneratedQuestion[] = [];
  for (const raw of d.questions) {
    const q = raw as Partial<GeneratedQuestion> | null;
    if (!q || typeof q.prompt !== 'string' || typeof q.correctAnswer !== 'string') continue;
    if (!['mcq', 'true-false', 'short-answer'].includes(q.type as string)) continue;
    if (!['easy', 'medium', 'hard'].includes(q.difficulty as string)) continue;

    if (q.type === 'mcq' || q.type === 'true-false') {
      const options = Array.isArray(q.options) ? q.options.filter((o): o is string => typeof o === 'string') : [];
      const normalizedOptions = options.map((o) => o.trim().toLowerCase());
      const normalizedAnswer = q.correctAnswer.trim().toLowerCase();
      if (options.length < 2 || !normalizedOptions.includes(normalizedAnswer)) continue;
      valid.push({
        type: q.type,
        prompt: q.prompt,
        options,
        correctAnswer: q.correctAnswer,
        topic: typeof q.topic === 'string' && q.topic ? q.topic : 'General',
        difficulty: q.difficulty as GeneratedQuestion['difficulty'],
      });
    } else {
      valid.push({
        type: 'short-answer',
        prompt: q.prompt,
        correctAnswer: q.correctAnswer,
        topic: typeof q.topic === 'string' && q.topic ? q.topic : 'General',
        difficulty: q.difficulty as GeneratedQuestion['difficulty'],
      });
    }
  }

  if (valid.length === 0) {
    throw new GeminiError('The AI response did not contain any usable questions. Please try again.');
  }
  return valid;
}

export async function generateQuestionsFromDocument(
  extracted: ExtractedDocument,
  analysis: DocumentAnalysis,
  opts: { numQuestions: number; difficulty: 'easy' | 'medium' | 'hard' | 'mixed' },
): Promise<GeneratedQuestion[]> {
  const difficultyInstruction =
    opts.difficulty === 'mixed'
      ? 'Mix easy, medium, and hard questions.'
      : `All questions should be "${opts.difficulty}" difficulty.`;

  const instruction = `You are an exam question setter. Using ONLY the content of the uploaded document below (and the prior analysis of it), write exactly ${opts.numQuestions} exam-style practice questions grounded in that document's actual content.

Prior analysis of this document:
- Key topics: ${analysis.topics.map((t) => t.name).join(', ') || 'none identified'}
- Study priorities: ${analysis.priorities.join('; ') || 'none identified'}

Rules:
- Prefer multiple-choice (type "mcq") questions with exactly 4 plausible options, exactly one of which is correct and matches "correctAnswer" verbatim.
- Only use "short-answer" if a concept truly cannot be turned into a good multiple-choice question.
- Do NOT invent facts, numbers, or claims that are not supported by the document content. If the document does not contain enough material for ${opts.numQuestions} distinct grounded questions, return as many high-quality grounded questions as you honestly can instead.
- ${difficultyInstruction}
- Set "topic" to the specific concept/topic each question covers (should align with the key topics above where possible).

Document content is below.`;

  const parts = buildParts(extracted, instruction);
  const raw = await generateJson<unknown>(parts, questionsSchema);
  return validateQuestions(raw);
}

export async function generateQuestionsFromTopic(opts: {
  subject: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  numQuestions: number;
}): Promise<GeneratedQuestion[]> {
  const difficultyInstruction =
    opts.difficulty === 'mixed'
      ? 'Mix easy, medium, and hard questions.'
      : `All questions should be "${opts.difficulty}" difficulty.`;
  const topicInstruction = opts.topics.length > 0 ? `focusing specifically on: ${opts.topics.join(', ')}` : '';

  const instruction = `You are an exam question setter for a computer science student. Write exactly ${opts.numQuestions} exam-style practice questions on the subject "${opts.subject}"${topicInstruction ? ` (${topicInstruction})` : ''}.

Rules:
- Base every question on well-established, accurate academic knowledge of this subject. Do NOT fabricate facts, numbers, or claims.
- Prefer multiple-choice (type "mcq") questions with exactly 4 plausible options, exactly one of which is correct and matches "correctAnswer" verbatim.
- Only use "short-answer" if a concept truly cannot be turned into a good multiple-choice question.
- ${difficultyInstruction}
- Set "topic" to the specific concept each question covers.`;

  const raw = await generateJson<unknown>([{ text: instruction }], questionsSchema);
  return validateQuestions(raw);
}

const TUTOR_SYSTEM_INSTRUCTION = `You are Nova, an AI study tutor inside a personalized learning platform called Cadence. You are warm, encouraging, and pedagogically sharp.

Be concise. Default to 3-5 sentences or a short bullet list. Answer the question directly first, then add at most one brief example or analogy only if it genuinely aids understanding — do not always include one. Never pad with restated context, multi-part overviews, or "let's break this down" preambles. If the user wants more depth, they will ask a follow-up.

Explain concepts using simple language. If asked, quiz the user with a single question and wait for their answer. Use markdown (bold, short lists) sparingly, only where it aids clarity. If asked something unrelated to academics/studying, gently redirect back to their studies in one sentence. Only discuss topics grounded in accurate, well-established knowledge — do not fabricate facts.

If a short YouTube video would genuinely help the user understand this specific topic — they explicitly asked for a video, or the concept is highly visual/procedural (e.g. an algorithm trace, a diagram-heavy process) — end your reply with a new line containing exactly: [VIDEO: <focused search query for a good educational video on this exact topic>]. Only do this when it is genuinely useful, never for greetings, quizzes, follow-up chit-chat, or topics that don't benefit from video.`;

export interface TutorTurn {
  role: 'user' | 'model';
  text: string;
}

export interface TutorReply {
  content: string;
  videoQuery: string | null;
}

const VIDEO_MARKER_PATTERN = /\n?\[VIDEO:\s*([^\]\n]+)\]\s*$/i;

export function parseTutorReply(raw: string): TutorReply {
  const match = raw.match(VIDEO_MARKER_PATTERN);
  if (!match) return { content: raw.trim(), videoQuery: null };
  return {
    content: raw.slice(0, match.index).trim(),
    videoQuery: match[1].trim(),
  };
}

export async function generateTutorReply(history: TutorTurn[], message: string): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: config.geminiModel,
    systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
    generationConfig: { maxOutputTokens: 400 },
  });

  const chat = model.startChat({
    history: history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
  });

  let lastMessage = '';
  for (let attempt = 0; attempt <= MAX_OVERLOAD_RETRIES; attempt++) {
    try {
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (err) {
      lastMessage = err instanceof Error ? err.message : String(err);
      console.error(`Gemini tutor error (attempt ${attempt + 1}/${MAX_OVERLOAD_RETRIES + 1}):`, lastMessage);
      const isOverloaded = /503|unavailable|overloaded|high demand/i.test(lastMessage);
      if (isOverloaded && attempt < MAX_OVERLOAD_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      if (/quota|rate limit|429/i.test(lastMessage)) {
        throw new GeminiError('The AI tutor is temporarily rate-limited. Please try again in a moment.');
      }
      if (/api key|permission|401|403/i.test(lastMessage)) {
        throw new GeminiError('The AI service rejected the request. Check the server GEMINI_API_KEY configuration.');
      }
      if (isOverloaded) {
        throw new GeminiError('The AI tutor is experiencing high demand right now. Please try again in a moment.');
      }
      throw new GeminiError('Could not reach the AI tutor. Please try again.');
    }
  }
  throw new GeminiError('Could not reach the AI tutor. Please try again.');
}

export interface GeneratedStudySession {
  topic: string;
  subject: string;
  objective: string;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  conceptsTotal: number;
}

const studyPlanSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sessions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          subject: { type: SchemaType.STRING },
          objective: { type: SchemaType.STRING },
          estimatedMinutes: { type: SchemaType.NUMBER },
          difficulty: { type: SchemaType.STRING, format: 'enum', enum: ['easy', 'medium', 'hard'] },
          conceptsTotal: { type: SchemaType.NUMBER },
        },
        required: ['topic', 'subject', 'objective', 'estimatedMinutes', 'difficulty', 'conceptsTotal'],
      },
    },
  },
  required: ['sessions'],
};

function validateStudySessions(data: unknown): GeneratedStudySession[] {
  const d = data as { sessions?: unknown[] } | null;
  if (!d || !Array.isArray(d.sessions)) {
    throw new GeminiError('The AI did not return a study plan. Please try again.');
  }

  const valid: GeneratedStudySession[] = [];
  for (const raw of d.sessions) {
    const s = raw as Partial<GeneratedStudySession> | null;
    if (!s || typeof s.topic !== 'string' || typeof s.subject !== 'string' || typeof s.objective !== 'string') continue;
    if (!['easy', 'medium', 'hard'].includes(s.difficulty as string)) continue;
    valid.push({
      topic: s.topic,
      subject: s.subject,
      objective: s.objective,
      estimatedMinutes: Math.min(Math.max(Number(s.estimatedMinutes) || 60, 20), 240),
      difficulty: s.difficulty as GeneratedStudySession['difficulty'],
      conceptsTotal: Math.min(Math.max(Number(s.conceptsTotal) || 3, 1), 10),
    });
  }

  if (valid.length === 0) {
    throw new GeminiError('The AI response did not contain a usable study plan. Please try again.');
  }
  return valid;
}

export async function generateStudyPlanSessions(opts: {
  goalTitle: string;
  subjects: string[];
  topics: string[];
  deadline: string;
  hoursPerDay: number;
  preferredTime: string;
  knowledgeLevel: string;
  weakTopics: string[];
  numSessions: number;
}): Promise<GeneratedStudySession[]> {
  const daysUntilDeadline = Math.max(
    1,
    Math.ceil((new Date(opts.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  const instruction = `You are an expert academic study planner. Build a study schedule of exactly ${opts.numSessions} sessions for a student working toward this goal:

- Goal: "${opts.goalTitle}"
- Subjects: ${opts.subjects.join(', ') || 'not specified'}
- Topics to cover: ${opts.topics.join(', ') || 'not specified'}
- Deadline: ${opts.deadline} (${daysUntilDeadline} days from now)
- Available study time: ~${opts.hoursPerDay} hour(s) per day, preferred time: ${opts.preferredTime}
- Current knowledge level: ${opts.knowledgeLevel}
- Topics the student is currently weak in (prioritize these earlier and more often): ${opts.weakTopics.join(', ') || 'none identified yet'}

Rules:
- Order sessions so foundational topics come before topics that depend on them, and weak topics get reinforced.
- Each session covers ONE specific, concrete topic (not a vague catch-all like "study DSA").
- "objective" should be a single concrete sentence describing what the student will be able to do after the session.
- "estimatedMinutes" should fit within the available daily study time (roughly ${Math.round(opts.hoursPerDay * 60)} minutes), between 30 and 150.
- "difficulty" should escalate sensibly given the student's knowledge level — do not start a beginner on hard material.
- "conceptsTotal" is the number of distinct sub-concepts within that session (2-6 is typical).
- Include at least one revision/practice-test session near the end if there are enough sessions to allow for it.
- Base this entirely on the goal/subjects/topics given — do not invent unrelated subjects.`;

  const raw = await generateJson<unknown>([{ text: instruction }], studyPlanSchema);
  return validateStudySessions(raw);
}
