import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!config.smtpHost) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`[nova-server] SMTP not configured. Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await t.sendMail({
    from: config.smtpFrom || config.smtpUser,
    to,
    subject: 'Reset your Cadence password',
    text: `We received a request to reset your Cadence password.\n\nReset it here (expires in 15 minutes):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `<p>We received a request to reset your Cadence password.</p><p><a href="${resetUrl}">Reset your password</a> (expires in 15 minutes).</p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });
}
