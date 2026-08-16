import { config } from '../config.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

// Resend delivers over HTTPS instead of raw SMTP, which many hosts (including Render's
// free tier) block outbound on ports 25/465/587 — HTTPS is never blocked.
async function sendEmail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  if (!config.resendApiKey) {
    console.log(`[nova-server] RESEND_API_KEY not configured. Skipping email to ${to}: "${subject}"`);
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: config.emailFrom, to, subject, text, html }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`Resend API error (${response.status}) sending to ${to}:`, body.slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail(
    to,
    'Reset your Cadence password',
    `We received a request to reset your Cadence password.\n\nReset it here (expires in 15 minutes):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    `<p>We received a request to reset your Cadence password.</p><p><a href="${resetUrl}">Reset your password</a> (expires in 15 minutes).</p><p>If you didn't request this, you can safely ignore this email.</p>`,
  );
}

export interface ReminderSession {
  topic: string;
  subject: string;
  estimatedMinutes: number;
}

export async function sendStudyReminderEmail(to: string, session: ReminderSession): Promise<boolean> {
  return sendEmail(
    to,
    `Study reminder: ${session.topic}`,
    `You have a study session scheduled for today.\n\nSubject: ${session.subject}\nTopic: ${session.topic}\nEstimated time: ${session.estimatedMinutes} minutes\n\nOpen Cadence to get started: ${config.clientOrigin}/app/plan`,
    `<p>You have a study session scheduled for today.</p><p><strong>Subject:</strong> ${session.subject}<br/><strong>Topic:</strong> ${session.topic}<br/><strong>Estimated time:</strong> ${session.estimatedMinutes} minutes</p><p><a href="${config.clientOrigin}/app/plan">Open your study plan</a></p>`,
  );
}
