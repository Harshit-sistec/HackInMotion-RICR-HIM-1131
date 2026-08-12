import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Brain, Trophy } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-ink-950">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 p-12 text-white lg:flex">
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative">
          <Logo to="/" size="lg" />
        </div>
        <div className="relative">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Your AI study coach.
            <br />
            Personalized, adaptive, always on.
          </h2>
          <div className="mt-10 space-y-4">
            {[
              { icon: Brain, text: 'Diagnostic finds your weak topics in minutes' },
              { icon: TrendingUp, text: 'Plans adapt as you learn and take quizzes' },
              { icon: Trophy, text: 'Streaks, XP, and achievements keep you consistent' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <item.icon size={18} />
                </div>
                <p className="text-primary-50">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-sm text-primary-100">
          <Sparkles size={14} /> Trusted by 12,000+ students preparing for exams.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function AuthSwitchLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400">
      {label}
    </Link>
  );
}
