import { sessionStore } from './studyPlans.js';
import { userStore } from './users.js';
import { sendStudyReminderEmail } from './email.js';
import { config } from '../config.js';

export async function sendDueStudyReminders(): Promise<void> {
  if (!config.resendApiKey) return;

  const due = await sessionStore.findDueForReminder();
  if (due.length === 0) return;

  for (const session of due) {
    try {
      const user = await userStore.findById(session.userId);
      if (user) {
        await sendStudyReminderEmail(user.email, {
          topic: session.topic,
          subject: session.subject,
          estimatedMinutes: session.estimatedMinutes,
        });
      }
    } catch (err) {
      console.error(`Failed to send study reminder for session ${session.id}:`, err instanceof Error ? err.message : err);
    } finally {
      // Mark sent even on user-lookup miss or send failure — avoids retry storms on a
      // permanently-broken address; the session simply won't be reminded again today.
      await sessionStore.markReminderSent(session.id);
    }
  }
}
