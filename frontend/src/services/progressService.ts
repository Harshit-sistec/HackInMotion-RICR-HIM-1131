import type { Achievement, ProgressSnapshot, Topic, TopicStrength } from '@/types';
import { api } from '@/services/api';

const DEFAULT_SNAPSHOT: ProgressSnapshot = {
  overallCompletion: 0,
  streakDays: 0,
  hoursStudied: 0,
  topicsMastered: 0,
  weeklyActivity: [
    { day: 'Mon', minutes: 0 },
    { day: 'Tue', minutes: 0 },
    { day: 'Wed', minutes: 0 },
    { day: 'Thu', minutes: 0 },
    { day: 'Fri', minutes: 0 },
    { day: 'Sat', minutes: 0 },
    { day: 'Sun', minutes: 0 },
  ],
  topicStrengths: [],
  quizAccuracyTrend: [],
  consistencyPercent: 0
};

export const progressService = {
  async getSnapshot(): Promise<ProgressSnapshot> {
    try {
      const { data: userData } = await api.auth.getUser();
      if (!userData?.user) return DEFAULT_SNAPSHOT;

      const userId = userData.user.id;

      // Fetch user data in parallel
      const [
        { data: subjects },
        { data: topics },
        { data: chatSessions },
        { data: quizAttempts }
      ] = await Promise.all([
        api.from('subjects').select('*').eq('user_id', userId),
        api.from('topics').select('*').eq('user_id', userId),
        api.from('chat_sessions').select('*').eq('user_id', userId),
        api.from('quiz_attempts').select('*').eq('user_id', userId)
      ]);

      if (!subjects || subjects.length === 0) {
        return DEFAULT_SNAPSHOT;
      }

      const totalTopicsCount = topics?.length || 0;

      // Calculate overall completion: topics studied or scored >= 60%
      const studiedTopicIds = new Set((chatSessions || []).map(cs => cs.topic_id).filter(Boolean));
      const passedTopicIds = new Set((quizAttempts || [])
        .filter(q => q.total_questions > 0 && (q.score / q.total_questions) >= 0.6)
        .map(q => q.topic_id)
        .filter(Boolean)
      );

      const uniqueStudiedCount = new Set([...studiedTopicIds, ...passedTopicIds]).size;
      const overallCompletion = totalTopicsCount > 0 ? Math.round((uniqueStudiedCount / totalTopicsCount) * 100) : 0;

      // Calculate total hours studied from chat sessions (duration in seconds)
      const totalStudySeconds = (chatSessions || []).reduce((acc, curr) => acc + (curr.duration || 0), 0);
      const hoursStudied = Math.round((totalStudySeconds / 3600) * 10) / 10;

      // Topics Mastered: scored >= 80% on quiz or spent > 10 mins studying
      const masteredTopicIds = new Set<string>();
      (quizAttempts || []).forEach(q => {
        if (q.total_questions > 0 && (q.score / q.total_questions) >= 0.8 && q.topic_id) {
          masteredTopicIds.add(q.topic_id);
        }
      });
      (chatSessions || []).forEach(cs => {
        if (cs.duration && cs.duration >= 600 && cs.topic_id) {
          masteredTopicIds.add(cs.topic_id);
        }
      });
      const topicsMastered = masteredTopicIds.size;

      // Calculate Weekly Activity: hours spent studying in last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyActivity = days.map(dayName => ({ day: dayName, minutes: 0 }));
      
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      (chatSessions || []).forEach(cs => {
        const date = new Date(cs.created_at || cs.updated_at);
        if (date >= sevenDaysAgo) {
          const dayName = days[date.getDay()];
          const item = weeklyActivity.find(w => w.day === dayName);
          if (item) {
            item.minutes += Math.round((cs.duration || 0) / 60);
          }
        }
      });

      // Topic strengths
      const subjectMap = new Map((subjects || []).map(s => [s.id, s.name]));
      const topicStrengths: Topic[] = (topics || []).slice(0, 5).map(t => {
        const topicQuizzes = (quizAttempts || []).filter(q => q.topic_id === t.id);
        let maxAccuracy = 0;
        if (topicQuizzes.length > 0) {
          maxAccuracy = Math.max(...topicQuizzes.map(q => q.total_questions > 0 ? (q.score / q.total_questions) * 100 : 0));
        }

        let strength = 50;
        let strengthLabel: TopicStrength = 'moderate';
        if (maxAccuracy >= 80) {
          strength = 85;
          strengthLabel = 'strong';
        } else if (maxAccuracy >= 60) {
          strength = 65;
          strengthLabel = 'moderate';
        } else if (maxAccuracy > 0) {
          strength = 35;
          strengthLabel = 'weak';
        } else if (studiedTopicIds.has(t.id)) {
          strength = 60;
          strengthLabel = 'moderate';
        }

        return {
          id: t.id,
          name: t.name,
          subject: subjectMap.get(t.subject_id) || 'General',
          strength,
          strengthLabel
        };
      });

      // Quiz accuracy trend
      const quizAccuracyTrend = (quizAttempts || [])
        .slice(0, 6)
        .reverse()
        .map((q, idx) => ({
          label: `Quiz ${idx + 1}`,
          accuracy: q.total_questions > 0 ? Math.round((q.score / q.total_questions) * 100) : 0
        }));

      // Calculate streak days (consecutive days with study activity)
      const activeDates = new Set<string>();
      (chatSessions || []).forEach(cs => activeDates.add(new Date(cs.created_at || cs.updated_at).toDateString()));
      (quizAttempts || []).forEach(q => activeDates.add(new Date(q.created_at || q.updated_at).toDateString()));

      let streakDays = 0;
      let checkDate = new Date();
      
      // If no activity today, check starting from yesterday
      if (!activeDates.has(checkDate.toDateString())) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (activeDates.has(checkDate.toDateString())) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      const consistencyPercent = Math.round((activeDates.size / 7) * 100);

      return {
        overallCompletion,
        streakDays,
        hoursStudied,
        topicsMastered,
        weeklyActivity,
        topicStrengths,
        quizAccuracyTrend,
        consistencyPercent
      };
    } catch (err) {
      console.error('Error fetching progress snapshot:', err);
      return DEFAULT_SNAPSHOT;
    }
  },

  async getAchievements(): Promise<Achievement[]> {
    try {
      const snap = await this.getSnapshot();
      return [
        {
          id: 'first-step',
          icon: '🎯',
          title: 'First Step',
          description: 'Enrolled in your first learning goal subjects.',
          unlocked: snap.overallCompletion > 0,
        },
        {
          id: 'studious',
          icon: '⚡',
          title: 'Dedication',
          description: 'Studied for a total of 5 hours.',
          unlocked: snap.hoursStudied >= 5,
          progress: Math.min(snap.hoursStudied, 5),
          goal: 5,
        },
        {
          id: 'quiz-master',
          icon: '🏆',
          title: 'Quiz Master',
          description: 'Mastered 3 separate learning topics.',
          unlocked: snap.topicsMastered >= 3,
          progress: Math.min(snap.topicsMastered, 3),
          goal: 3,
        },
        {
          id: 'streak-3',
          icon: '🔥',
          title: 'Consistency',
          description: 'Maintained a 3-day study streak.',
          unlocked: snap.streakDays >= 3,
          progress: Math.min(snap.streakDays, 3),
          goal: 3,
        }
      ];
    } catch (err) {
      console.error('Error loading achievements:', err);
      return [];
    }
  },
};
