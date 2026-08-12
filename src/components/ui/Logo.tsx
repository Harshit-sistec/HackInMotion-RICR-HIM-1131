import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Logo({ to = '/', size = 'md' }: { to?: string; size?: 'sm' | 'md' | 'lg' }) {
  const text = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const icon = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  return (
    <Link to={to} className="inline-flex items-center gap-2 font-display font-bold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 text-white shadow-soft">
        <Sparkles size={icon} />
      </span>
      <span className={`${text} text-ink-900 dark:text-ink-50`}>Nova</span>
    </Link>
  );
}
