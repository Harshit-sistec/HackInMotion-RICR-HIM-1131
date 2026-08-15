export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

export type GoalType =
  | 'exam'
  | 'subject'
  | 'topic-mastery'
  | 'weak-areas'
  | 'placement';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  createdAt: string;
  dailyStudyTargetMinutes: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  streakCount: number;
  xp: number;
  level: number;
}

export interface LearningGoal {
  id: string;
  type: GoalType;
  title: string;
  subjects: string[];
  topics: string[];
  deadline: string;
  createdAt: string;
}

export interface AvailableTime {
  hoursPerDay: number;
  studyDays: string[];
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
}

export type TopicStrength = 'critical' | 'weak' | 'moderate' | 'strong';

export interface Topic {
  id: string;
  name: string;
  subject: string;
  strength: number;
  strengthLabel: TopicStrength;
}

export interface Question {
  id: string;
  type: 'mcq' | 'true-false' | 'short-answer';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type SessionStatus = 'completed' | 'in-progress' | 'upcoming' | 'locked' | 'missed';

export interface StudySession {
  id: string;
  day: number;
  date: string;
  topic: string;
  subject: string;
  objective: string;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: SessionStatus;
  conceptsTotal: number;
  conceptsDone: number;
  completedAt?: string;
}

export interface StudyPlan {
  id: string;
  goalTitle: string;
  examDate: string;
  totalStudyHours: number;
  completionPercent: number;
  sessions: StudySession[];
  lastAdaptedAt: string | null;
}

export interface ProgressSnapshot {
  overallCompletion: number;
  streakDays: number;
  hoursStudied: number;
  topicsMastered: number;
  weeklyActivity: { day: string; minutes: number }[];
  topicStrengths: Topic[];
  quizAccuracyTrend: { label: string; accuracy: number }[];
  consistencyPercent: number;
}

export interface ChatVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  isTyping?: boolean;
  video?: ChatVideo;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  goal?: number;
}

export interface MockTestConfig {
  subject: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  numQuestions: number;
}

export interface MockTest {
  id: string;
  config: MockTestConfig;
  questions: Question[];
  createdAt: string;
}

export interface MockTestSubmission {
  answers: Record<string, string>;
}

export interface MockTestResult {
  testId: string;
  takenAt: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  weakAreas: string[];
  perQuestion: { questionId: string; correct: boolean }[];
  topicBreakdown: { topic: string; correct: number; total: number }[];
}

export interface DocumentTopic {
  name: string;
  importance: 'high' | 'medium' | 'low';
  frequency: number;
}

export interface DocumentAnalysis {
  summary: string;
  topics: DocumentTopic[];
  chapters: string[];
  questionPatterns: string[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
  priorities: string[];
}

export interface DocumentAnalysisResponse {
  documentId: string;
  fileName: string;
  analysis: DocumentAnalysis;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}
