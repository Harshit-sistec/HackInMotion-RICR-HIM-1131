import { planStore, sessionStore, type StoredStudySession } from './studyPlans.js';
import { assessmentStore, type StoredAssessmentResult } from './assessments.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CONSISTENCY_WINDOW_DAYS = 14;

export interface Topic {
  id: string;
  name: string;
  subject: string;
  strength: number;
  strengthLabel: 'critical' | 'weak' | 'moderate' | 'strong';
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

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  goal?: number;
}

function toDateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function strengthLabelFor(pct: number): Topic['strengthLabel'] {
  if (pct >= 80) return 'strong';
  if (pct >= 60) return 'moderate';
  if (pct >= 40) return 'weak';
  return 'critical';
}

function computeActivityDates(sessions: StoredStudySession[], results: StoredAssessmentResult[]): Set<string> {
  const dates = new Set<string>();
  sessions.forEach((s) => {
    if (s.completedAt) dates.add(toDateKey(s.completedAt));
  });
  results.forEach((r) => dates.add(toDateKey(r.takenAt)));
  return dates;
}

function computeStreak(activityDates: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  if (!activityDates.has(toDateKey(cursor.toISOString()))) cursor.setDate(cursor.getDate() - 1);
  while (activityDates.has(toDateKey(cursor.toISOString()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function computeWeeklyActivity(sessions: StoredStudySession[]): { day: string; minutes: number }[] {
  const days: { day: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateKey(d.toISOString());
    const minutes = sessions
      .filter((s) => s.completedAt && toDateKey(s.completedAt) === key)
      .reduce((sum, s) => sum + s.estimatedMinutes, 0);
    days.push({ day: DAY_LABELS[d.getDay()], minutes });
  }
  return days;
}

function computeTopicStrengths(results: StoredAssessmentResult[]): Topic[] {
  const totals = new Map<string, { correct: number; total: number }>();
  results.forEach((r) => {
    (r.topicBreakdown ?? []).forEach(({ topic, correct, total }) => {
      const entry = totals.get(topic) ?? { correct: 0, total: 0 };
      entry.correct += correct;
      entry.total += total;
      totals.set(topic, entry);
    });
  });
  return Array.from(totals.entries())
    .map(([name, v], i) => {
      const strength = Math.round((v.correct / v.total) * 100);
      return { id: `topic-${i}-${name}`, name, subject: name, strength, strengthLabel: strengthLabelFor(strength) };
    })
    .sort((a, b) => a.strength - b.strength);
}

function computeQuizAccuracyTrend(results: StoredAssessmentResult[]): { label: string; accuracy: number }[] {
  const scored = results.filter((r) => typeof r.scorePercent === 'number');
  if (scored.length === 0) return [];
  const sorted = [...scored].sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());
  const firstWeekStart = new Date(sorted[0].takenAt);
  firstWeekStart.setHours(0, 0, 0, 0);

  const weeks = new Map<number, { sum: number; count: number }>();
  sorted.forEach((r) => {
    const weekIndex = Math.floor(
      (new Date(r.takenAt).getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    const entry = weeks.get(weekIndex) ?? { sum: 0, count: 0 };
    entry.sum += r.scorePercent!;
    entry.count += 1;
    weeks.set(weekIndex, entry);
  });

  return Array.from(weeks.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekIndex, v]) => ({ label: `Week ${weekIndex + 1}`, accuracy: Math.round(v.sum / v.count) }));
}

function computeSnapshot(
  sessions: StoredStudySession[],
  completionPercent: number,
  results: StoredAssessmentResult[],
): ProgressSnapshot | null {
  const hasActivity = sessions.some((s) => s.completedAt) || results.length > 0;
  if (!hasActivity) return null;

  const activityDates = computeActivityDates(sessions, results);
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const hoursStudied = Math.round((completedSessions.reduce((sum, s) => sum + s.estimatedMinutes, 0) / 60) * 10) / 10;
  const topicsMastered = new Set(completedSessions.map((s) => s.topic)).size;

  let activeDaysInWindow = 0;
  for (let i = 0; i < CONSISTENCY_WINDOW_DAYS; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (activityDates.has(toDateKey(d.toISOString()))) activeDaysInWindow++;
  }

  return {
    overallCompletion: completionPercent,
    streakDays: computeStreak(activityDates),
    hoursStudied,
    topicsMastered,
    weeklyActivity: computeWeeklyActivity(sessions),
    topicStrengths: computeTopicStrengths(results),
    quizAccuracyTrend: computeQuizAccuracyTrend(results),
    consistencyPercent: Math.round((activeDaysInWindow / CONSISTENCY_WINDOW_DAYS) * 100),
  };
}

function computeAchievements(
  sessions: StoredStudySession[],
  completionPercent: number,
  lastAdaptedAt: string | null,
  results: StoredAssessmentResult[],
  snapshot: ProgressSnapshot | null,
): Achievement[] {
  const streakDays = snapshot?.streakDays ?? 0;
  const topicsMastered = snapshot?.topicsMastered ?? 0;
  const highScoreCount = results.filter((r) => (r.scorePercent ?? 0) >= 80).length;

  return [
    {
      id: 'a1',
      icon: 'flame',
      title: '7 Day Streak',
      description: 'Studied consistently for 7 days in a row.',
      unlocked: streakDays >= 7,
      progress: Math.min(streakDays, 7),
      goal: 7,
    },
    {
      id: 'a2',
      icon: 'target',
      title: 'First Goal Completed',
      description: 'Reached 100% completion on a learning goal.',
      unlocked: completionPercent >= 100,
    },
    {
      id: 'a3',
      icon: 'brain',
      title: 'Quiz Master',
      description: 'Scored above 80% on 3 mock tests.',
      unlocked: highScoreCount >= 3,
      progress: Math.min(highScoreCount, 3),
      goal: 3,
    },
    {
      id: 'a4',
      icon: 'book',
      title: '10 Topics Completed',
      description: 'Finished studying 10 distinct topics.',
      unlocked: topicsMastered >= 10,
      progress: Math.min(topicsMastered, 10),
      goal: 10,
    },
    {
      id: 'a5',
      icon: 'zap',
      title: 'Consistency Champion',
      description: 'Maintained a 14-day study streak.',
      unlocked: streakDays >= 14,
      progress: Math.min(streakDays, 14),
      goal: 14,
    },
    {
      id: 'a6',
      icon: 'trophy',
      title: 'Comeback Kid',
      description: 'Recovered from a missed session with auto re-planning.',
      unlocked: Boolean(lastAdaptedAt),
    },
  ];
}

export async function computeProgressForUser(userId: string): Promise<{
  snapshot: ProgressSnapshot | null;
  achievements: Achievement[];
  weakTopics: string[];
}> {
  const plan = await planStore.getActive(userId);
  const sessions = plan ? await sessionStore.listByPlan(plan.id) : [];
  const results = await assessmentStore.listByUser(userId);

  const snapshot = computeSnapshot(sessions, plan?.completionPercent ?? 0, results);
  const achievements = computeAchievements(
    sessions,
    plan?.completionPercent ?? 0,
    plan?.lastAdaptedAt ?? null,
    results,
    snapshot,
  );
  const weakTopics = snapshot
    ? snapshot.topicStrengths
        .filter((t) => t.strengthLabel === 'critical' || t.strengthLabel === 'weak')
        .map((t) => t.name)
    : [];

  return { snapshot, achievements, weakTopics };
}
