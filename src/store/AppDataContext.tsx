import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  AvailableTime,
  KnowledgeLevel,
  LearningGoal,
  MockTest,
  MockTestConfig,
  MockTestResult,
  ProgressSnapshot,
  StudyPlan,
} from '@/types';
import { DEMO_GOAL, PROGRESS_SNAPSHOT, WEAK_TOPICS } from '@/data/mockData';
import { goalService, type CreateGoalInput } from '@/services/goalService';
import { assessmentService, type DiagnosticOutcome } from '@/services/assessmentService';
import { studyPlanService } from '@/services/studyPlanService';
import { progressService } from '@/services/progressService';
import { mockTestService } from '@/services/mockTestService';
import { useToast } from '@/store/ToastContext';

interface AppDataContextValue {
  goal: LearningGoal | null;
  plan: StudyPlan | null;
  progress: ProgressSnapshot | null;
  weakTopics: string[];
  isReady: boolean;

  createGoal: (input: CreateGoalInput) => Promise<LearningGoal>;
  saveAvailableTime: (time: AvailableTime) => Promise<void>;
  saveKnowledgeLevel: (level: KnowledgeLevel) => Promise<void>;
  submitDiagnostic: (answers: Record<string, string>) => Promise<DiagnosticOutcome>;
  generatePlan: () => Promise<StudyPlan>;

  markSessionComplete: (sessionId: string) => Promise<void>;
  updateConceptProgress: (sessionId: string, conceptsDone: number) => Promise<void>;
  rescheduleSession: (sessionId: string, newDate: string) => Promise<void>;
  autoAdjustPlan: () => Promise<void>;

  generateMockTest: (config: MockTestConfig) => Promise<MockTest>;
  submitMockTest: (test: MockTest, answers: Record<string, string>) => Promise<MockTestResult>;

  loadDemoData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>(WEAK_TOPICS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const existingGoal = goalService.getGoal();
    const existingPlan = studyPlanService.getPlan();
    setGoal(existingGoal);
    setPlan(existingPlan);
    progressService.getSnapshot().then(setProgress);
    setIsReady(true);
  }, []);

  const loadDemoData = () => {
    setGoal(DEMO_GOAL);
    setPlan(studyPlanService.getPlan() ?? null);
    setProgress(PROGRESS_SNAPSHOT);
    setWeakTopics(WEAK_TOPICS);
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

  const submitDiagnostic = async (answers: Record<string, string>) => {
    const outcome = await assessmentService.submitDiagnostic(answers);
    setWeakTopics([...outcome.critical, ...outcome.improve]);
    showToast('Assessment submitted — analyzing your knowledge.');
    return outcome;
  };

  const generatePlan = async () => {
    const activeGoal = goal ?? DEMO_GOAL;
    const time = goalService.getAvailableTime() ?? { hoursPerDay: 2, studyDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], preferredTime: 'evening' as const };
    const level = goalService.getKnowledgeLevel() ?? ('intermediate' as const);
    const generated = await studyPlanService.generatePlan(activeGoal, time, level, weakTopics);
    setPlan(generated);
    showToast('Your personalized study plan is ready.');
    return generated;
  };

  const markSessionComplete = async (sessionId: string) => {
    const updated = await studyPlanService.markSessionComplete(sessionId);
    setPlan(updated);
    showToast('Session marked complete. Great work!');
  };

  const updateConceptProgress = async (sessionId: string, conceptsDone: number) => {
    const updated = await studyPlanService.updateConceptProgress(sessionId, conceptsDone);
    setPlan(updated);
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
  };

  const generateMockTest = async (config: MockTestConfig) => {
    return mockTestService.generateTest(config);
  };

  const submitMockTest = async (test: MockTest, answers: Record<string, string>) => {
    const result = await mockTestService.submitTest(test, { answers });
    showToast('Mock test submitted.');
    return result;
  };

  return (
    <AppDataContext.Provider
      value={{
        goal,
        plan,
        progress,
        weakTopics,
        isReady,
        createGoal,
        saveAvailableTime,
        saveKnowledgeLevel,
        submitDiagnostic,
        generatePlan,
        markSessionComplete,
        updateConceptProgress,
        rescheduleSession,
        autoAdjustPlan,
        generateMockTest,
        submitMockTest,
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
