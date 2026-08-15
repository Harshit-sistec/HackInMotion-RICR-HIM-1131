import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  Achievement,
  AvailableTime,
  DocumentAnalysisResponse,
  KnowledgeLevel,
  LearningGoal,
  MockTest,
  MockTestConfig,
  MockTestResult,
  ProgressSnapshot,
  StudyPlan,
} from '@/types';
import { DEMO_GOAL, INITIAL_PLAN } from '@/data/mockData';
import { goalService, type CreateGoalInput } from '@/services/goalService';
import { studyPlanService } from '@/services/studyPlanService';
import { progressService } from '@/services/progressService';
import { mockTestService } from '@/services/mockTestService';
import { documentService } from '@/services/documentService';
import { useToast } from '@/store/ToastContext';

interface AppDataContextValue {
  goal: LearningGoal | null;
  plan: StudyPlan | null;
  progress: ProgressSnapshot | null;
  achievements: Achievement[];
  weakTopics: string[];
  isReady: boolean;

  createGoal: (input: CreateGoalInput) => Promise<LearningGoal>;
  saveAvailableTime: (time: AvailableTime) => Promise<void>;
  saveKnowledgeLevel: (level: KnowledgeLevel) => Promise<void>;
  generatePlan: () => Promise<StudyPlan>;

  markSessionComplete: (sessionId: string) => Promise<void>;
  updateConceptProgress: (sessionId: string, conceptsDone: number) => Promise<void>;
  rescheduleSession: (sessionId: string, newDate: string) => Promise<void>;
  autoAdjustPlan: () => Promise<void>;

  generateMockTest: (config: MockTestConfig) => Promise<MockTest>;
  submitMockTest: (test: MockTest, answers: Record<string, string>) => Promise<MockTestResult>;

  analyzeDocument: (file: File) => Promise<DocumentAnalysisResponse>;
  generateMockTestFromDocument: (
    documentId: string,
    fileName: string,
    config: { numQuestions: number; difficulty: 'easy' | 'medium' | 'hard' | 'mixed' },
  ) => Promise<MockTest>;

  loadDemoData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refreshProgress = async () => {
    const [snapshot, unlockedAchievements] = await Promise.all([
      progressService.getSnapshot(),
      progressService.getAchievements(),
    ]);
    setProgress(snapshot);
    setAchievements(unlockedAchievements);
    setWeakTopics(progressService.getWeakTopics());
  };

  useEffect(() => {
    const existingGoal = goalService.getGoal();
    const existingPlan = studyPlanService.getPlan();
    setGoal(existingGoal);
    setPlan(existingPlan);
    refreshProgress().then(() => setIsReady(true));
  }, []);

  const loadDemoData = () => {
    const seededSessions = INITIAL_PLAN.sessions.map((s) =>
      s.status === 'completed' && !s.completedAt ? { ...s, completedAt: s.date } : s,
    );
    const seededPlan = studyPlanService.seedPlan({ ...INITIAL_PLAN, sessions: seededSessions });
    setGoal(DEMO_GOAL);
    setPlan(seededPlan);
    refreshProgress();
  };

  const createGoal = async (input: CreateGoalInput) => {
    const created = await goalService.createGoal(input);
    setGoal(created);
    showToast('Learning goal created.');
    return created;
  };

  const saveAvailableTime = async (time: AvailableTime) => {
    await goalService.saveAvailableTime(time);
  };

  const saveKnowledgeLevel = async (level: KnowledgeLevel) => {
    await goalService.saveKnowledgeLevel(level);
  };

  const generatePlan = async () => {
    const activeGoal = goal ?? DEMO_GOAL;
    const time = goalService.getAvailableTime() ?? { hoursPerDay: 2, studyDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], preferredTime: 'evening' as const };
    const level = goalService.getKnowledgeLevel() ?? ('intermediate' as const);
    const generated = await studyPlanService.generatePlan(activeGoal, time, level, weakTopics);
    setPlan(generated);
    showToast('Your personalized study plan is ready.');
    await refreshProgress();
    return generated;
  };

  const markSessionComplete = async (sessionId: string) => {
    const updated = await studyPlanService.markSessionComplete(sessionId);
    setPlan(updated);
    showToast('Session marked complete. Great work!');
    await refreshProgress();
  };

  const updateConceptProgress = async (sessionId: string, conceptsDone: number) => {
    const updated = await studyPlanService.updateConceptProgress(sessionId, conceptsDone);
    setPlan(updated);
    await refreshProgress();
  };

  const rescheduleSession = async (sessionId: string, newDate: string) => {
    const updated = await studyPlanService.rescheduleSession(sessionId, newDate);
    setPlan(updated);
    showToast('Session rescheduled.');
  };

  const autoAdjustPlan = async () => {
    const updated = await studyPlanService.autoAdjustPlan();
    setPlan(updated);
    showToast('Your plan has been adapted to get you back on track.');
    await refreshProgress();
  };

  const generateMockTest = async (config: MockTestConfig) => {
    return mockTestService.generateTest(config);
  };

  const submitMockTest = async (test: MockTest, answers: Record<string, string>) => {
    const result = await mockTestService.submitTest(test, { answers });
    showToast('Mock test submitted.');
    await refreshProgress();
    return result;
  };

  const analyzeDocument = async (file: File) => {
    return documentService.analyze(file);
  };

  const generateMockTestFromDocument = async (
    documentId: string,
    fileName: string,
    config: { numQuestions: number; difficulty: 'easy' | 'medium' | 'hard' | 'mixed' },
  ) => {
    const test = await documentService.generateMockTestFromDocument(documentId, fileName, config);
    showToast('Mock test generated from your document.');
    return test;
  };

  return (
    <AppDataContext.Provider
      value={{
        goal,
        plan,
        progress,
        achievements,
        weakTopics,
        isReady,
        createGoal,
        saveAvailableTime,
        saveKnowledgeLevel,
        generatePlan,
        markSessionComplete,
        updateConceptProgress,
        rescheduleSession,
        autoAdjustPlan,
        generateMockTest,
        submitMockTest,
        analyzeDocument,
        generateMockTestFromDocument,
        loadDemoData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
