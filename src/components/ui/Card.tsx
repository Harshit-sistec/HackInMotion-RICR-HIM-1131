import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function Card({ hover = false, padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-ink-200/70 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900 ${hover ? 'transition-all duration-300 hover:shadow-card hover:-translate-y-0.5' : ''} ${PADDING[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
