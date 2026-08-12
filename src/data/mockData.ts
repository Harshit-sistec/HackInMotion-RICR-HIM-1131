import type {
  Achievement,
  LearningGoal,
  ProgressSnapshot,
  Question,
  StudyPlan,
  StudySession,
  Topic,
  User,
} from '@/types';

export const DEMO_USER: User = {
  id: 'user-harshit',
  name: 'Harshit Dubey',
  email: 'harshit.dubey@example.com',
  avatarColor: '#3763E8',
  createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  onboardingComplete: true,
  dailyStudyTargetMinutes: 120,
  preferredStudyTime: 'evening',
  streakCount: 7,
  xp: 2450,
  level: 6,
};

export const DEMO_GOAL: LearningGoal = {
  id: 'goal-1',
  type: 'exam',
  title: 'CSE Semester Exams',
  subjects: ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks'],
  topics: [
    'Arrays & Complexity',
    'Linked Lists',
    'Recursion',
    'Dynamic Programming',
    'Graph Algorithms',
    'Normalization',
    'CPU Scheduling',
    'Deadlocks',
    'TCP/IP Model',
    'Indexing',
  ],
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
};

export const WEAK_TOPICS = ['Dynamic Programming', 'Graph Algorithms', 'Normalization', 'CPU Scheduling'];

export const TOPIC_STRENGTHS: Topic[] = [
  { id: 't1', name: 'Dynamic Programming', subject: 'DSA', strength: 42, strengthLabel: 'weak' },
  { id: 't2', name: 'Graph Algorithms', subject: 'DSA', strength: 58, strengthLabel: 'moderate' },
  { id: 't3', name: 'DBMS Normalization', subject: 'DBMS', strength: 81, strengthLabel: 'strong' },
  { id: 't4', name: 'Operating Systems', subject: 'OS', strength: 73, strengthLabel: 'strong' },
  { id: 't5', name: 'Computer Networks', subject: 'CN', strength: 67, strengthLabel: 'moderate' },
];

function daysFromNow(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

export const INITIAL_SESSIONS: StudySession[] = [
  {
    id: 's1',
    day: 1,
    date: daysFromNow(-6),
    topic: 'Arrays & Complexity',
    subject: 'DSA',
    objective: 'Understand time/space complexity and array traversal patterns.',
    estimatedMinutes: 90,
    difficulty: 'easy',
    status: 'completed',
    conceptsTotal: 4,
    conceptsDone: 4,
  },
  {
    id: 's2',
    day: 2,
    date: daysFromNow(-5),
    topic: 'Linked Lists',
    subject: 'DSA',
    objective: 'Master singly/doubly linked list operations and reversal.',
    estimatedMinutes: 90,
    difficulty: 'easy',
    status: 'completed',
    conceptsTotal: 5,
    conceptsDone: 5,
  },
  {
    id: 's3',
    day: 3,
    date: daysFromNow(-4),
    topic: 'Recursion',
    subject: 'DSA',
    objective: 'Build intuition for recursive trees and backtracking basics.',
    estimatedMinutes: 100,
    difficulty: 'medium',
    status: 'completed',
    conceptsTotal: 4,
    conceptsDone: 4,
  },
  {
    id: 's4',
    day: 4,
    date: daysFromNow(-3),
    topic: 'Graph Algorithms',
    subject: 'DSA',
    objective: 'Learn BFS/DFS traversal and shortest-path fundamentals.',
    estimatedMinutes: 110,
    difficulty: 'medium',
    status: 'missed',
    conceptsTotal: 5,
    conceptsDone: 1,
  },
  {
    id: 's5',
    day: 5,
    date: daysFromNow(0),
    topic: 'Dynamic Programming',
    subject: 'DSA',
    objective: 'Break problems into overlapping subproblems using memoization.',
    estimatedMinutes: 120,
    difficulty: 'medium',
    status: 'in-progress',
    conceptsTotal: 5,
    conceptsDone: 2,
  },
  {
    id: 's6',
    day: 6,
    date: daysFromNow(1),
    topic: 'Normalization',
    subject: 'DBMS',
    objective: 'Apply 1NF-3NF rules to eliminate redundancy in schemas.',
    estimatedMinutes: 90,
    difficulty: 'medium',
    status: 'upcoming',
    conceptsTotal: 4,
    conceptsDone: 0,
  },
  {
    id: 's7',
    day: 7,
    date: daysFromNow(2),
    topic: 'CPU Scheduling',
    subject: 'Operating Systems',
    objective: 'Compare FCFS, SJF, Round Robin and priority scheduling.',
    estimatedMinutes: 100,
    difficulty: 'medium',
    status: 'locked',
    conceptsTotal: 4,
    conceptsDone: 0,
  },
  {
    id: 's8',
    day: 8,
    date: daysFromNow(3),
    topic: 'Mock Test — DSA Foundations',
    subject: 'DSA',
    objective: 'Validate readiness across arrays, lists, recursion and graphs.',
    estimatedMinutes: 60,
    difficulty: 'medium',
    status: 'locked',
    conceptsTotal: 1,
    conceptsDone: 0,
  },
  {
    id: 's9',
    day: 9,
    date: daysFromNow(4),
    topic: 'TCP/IP Model',
    subject: 'Computer Networks',
    objective: 'Trace how data flows through the network layers.',
    estimatedMinutes: 90,
    difficulty: 'easy',
    status: 'locked',
    conceptsTotal: 4,
    conceptsDone: 0,
  },
  {
    id: 's10',
    day: 10,
    date: daysFromNow(5),
    topic: 'Revision — Weak Topics',
    subject: 'DSA',
    objective: 'Targeted revision of Dynamic Programming and Graphs.',
    estimatedMinutes: 90,
    difficulty: 'hard',
    status: 'locked',
    conceptsTotal: 3,
    conceptsDone: 0,
  },
];

export const INITIAL_PLAN: StudyPlan = {
  id: 'plan-1',
  goalTitle: DEMO_GOAL.title,
  examDate: DEMO_GOAL.deadline,
  totalStudyHours: 60,
  completionPercent: 34,
  sessions: INITIAL_SESSIONS,
  lastAdaptedAt: null,
};

export const PROGRESS_SNAPSHOT: ProgressSnapshot = {
  overallCompletion: 34,
  streakDays: 7,
  hoursStudied: 18.5,
  topicsMastered: 6,
  weeklyActivity: [
    { day: 'Mon', minutes: 95 },
    { day: 'Tue', minutes: 120 },
    { day: 'Wed', minutes: 75 },
    { day: 'Thu', minutes: 130 },
    { day: 'Fri', minutes: 60 },
    { day: 'Sat', minutes: 140 },
    { day: 'Sun', minutes: 100 },
  ],
  topicStrengths: TOPIC_STRENGTHS,
  quizAccuracyTrend: [
    { label: 'Week 1', accuracy: 52 },
    { label: 'Week 2', accuracy: 61 },
    { label: 'Week 3', accuracy: 70 },
    { label: 'Week 4', accuracy: 78 },
  ],
  consistencyPercent: 86,
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', icon: 'flame', title: '7 Day Streak', description: 'Studied consistently for 7 days in a row.', unlocked: true },
  { id: 'a2', icon: 'target', title: 'First Goal Completed', description: 'Completed your first learning goal.', unlocked: true },
  { id: 'a3', icon: 'brain', title: 'Quiz Master', description: 'Scored above 80% on 3 mock tests.', unlocked: false, progress: 1, goal: 3 },
  { id: 'a4', icon: 'book', title: '10 Topics Completed', description: 'Finished studying 10 distinct topics.', unlocked: false, progress: 6, goal: 10 },
  { id: 'a5', icon: 'zap', title: 'Consistency Champion', description: 'Maintained a 14-day study streak.', unlocked: false, progress: 7, goal: 14 },
  { id: 'a6', icon: 'trophy', title: 'Comeback Kid', description: 'Recovered from a missed session with auto re-planning.', unlocked: false },
];

export const DIAGNOSTIC_QUESTIONS: Question[] = [
  {
    id: 'd1',
    type: 'mcq',
    prompt: 'What is the time complexity of binary search on a sorted array of n elements?',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctAnswer: 'O(log n)',
    topic: 'Arrays & Complexity',
    difficulty: 'easy',
  },
  {
    id: 'd2',
    type: 'mcq',
    prompt: 'Reversing a singly linked list iteratively requires tracking which pointers?',
    options: ['head only', 'prev, curr, next', 'tail only', 'no pointers needed'],
    correctAnswer: 'prev, curr, next',
    topic: 'Linked Lists',
    difficulty: 'easy',
  },
  {
    id: 'd3',
    type: 'true-false',
    prompt: 'Every recursive function must have a base case to terminate.',
    options: ['True', 'False'],
    correctAnswer: 'True',
    topic: 'Recursion',
    difficulty: 'easy',
  },
  {
    id: 'd4',
    type: 'mcq',
    prompt: 'Dynamic programming is most useful when a problem has:',
    options: ['No repeated subproblems', 'Overlapping subproblems and optimal substructure', 'Only one possible solution', 'Purely random inputs'],
    correctAnswer: 'Overlapping subproblems and optimal substructure',
    topic: 'Dynamic Programming',
    difficulty: 'medium',
  },
  {
    id: 'd5',
    type: 'mcq',
    prompt: 'Which traversal is typically used to find the shortest path in an unweighted graph?',
    options: ['DFS', 'BFS', 'In-order traversal', 'Topological sort'],
    correctAnswer: 'BFS',
    topic: 'Graph Algorithms',
    difficulty: 'medium',
  },
  {
    id: 'd6',
    type: 'mcq',
    prompt: 'A relation is in 2NF if it is in 1NF and has no:',
    options: ['Transitive dependency', 'Partial dependency on a candidate key', 'Multi-valued attribute', 'Foreign key'],
    correctAnswer: 'Partial dependency on a candidate key',
    topic: 'Normalization',
    difficulty: 'medium',
  },
  {
    id: 'd7',
    type: 'mcq',
    prompt: 'Which CPU scheduling algorithm can cause starvation of longer processes?',
    options: ['Round Robin', 'FCFS', 'Shortest Job First', 'Multilevel Queue'],
    correctAnswer: 'Shortest Job First',
    topic: 'CPU Scheduling',
    difficulty: 'medium',
  },
  {
    id: 'd8',
    type: 'true-false',
    prompt: 'TCP guarantees ordered, reliable delivery of packets.',
    options: ['True', 'False'],
    correctAnswer: 'True',
    topic: 'TCP/IP Model',
    difficulty: 'easy',
  },
];

export const QUESTION_BANK: Question[] = [
  ...DIAGNOSTIC_QUESTIONS,
  {
    id: 'q9',
    type: 'mcq',
    prompt: 'What does memoization primarily eliminate in recursive solutions?',
    options: ['Function calls', 'Redundant recomputation of subproblems', 'Stack usage', 'Base cases'],
    correctAnswer: 'Redundant recomputation of subproblems',
    topic: 'Dynamic Programming',
    difficulty: 'medium',
  },
  {
    id: 'q10',
    type: 'mcq',
    prompt: "Dijkstra's algorithm fails to give correct results when the graph has:",
    options: ['Negative weight edges', 'Cycles', 'Disconnected components', 'Self loops'],
    correctAnswer: 'Negative weight edges',
    topic: 'Graph Algorithms',
    difficulty: 'hard',
  },
  {
    id: 'q11',
    type: 'short-answer',
    prompt: 'Name the OS deadlock condition where a process holds a resource while waiting for another.',
    correctAnswer: 'hold and wait',
    topic: 'CPU Scheduling',
    difficulty: 'hard',
  },
  {
    id: 'q12',
    type: 'mcq',
    prompt: 'A composite index on (a, b) can efficiently serve a query filtering only on:',
    options: ['b alone', 'a alone', 'neither column', 'only aggregate queries'],
    correctAnswer: 'a alone',
    topic: 'Indexing',
    difficulty: 'medium',
  },
];

export function knowledgeAnalysisFromAnswers(answers: Record<string, string>) {
  const strong: string[] = [];
  const improve: string[] = [];
  const critical: string[] = [];

  const byTopic = new Map<string, { correct: number; total: number }>();
  DIAGNOSTIC_QUESTIONS.forEach((q) => {
    const entry = byTopic.get(q.topic) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (answers[q.id] === q.correctAnswer) entry.correct += 1;
    byTopic.set(q.topic, entry);
  });

  byTopic.forEach((value, topic) => {
    const ratio = value.correct / value.total;
    if (ratio >= 0.75) strong.push(topic);
    else if (ratio >= 0.4) improve.push(topic);
    else critical.push(topic);
  });

  return { strong, improve, critical };
}
