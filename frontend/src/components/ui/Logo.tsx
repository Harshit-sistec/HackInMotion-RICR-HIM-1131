import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Logo({
  to = '/',
  size = 'md',
  className = '',
  lightText = false,
  iconOnly = false,
}: {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  lightText?: boolean;
  iconOnly?: boolean;
}) {
  const text = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const icon = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  return (
    <Link to={to} className={`inline-flex items-center gap-2 font-display font-bold tracking-tight ${className}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--nova-primary)] text-white shadow-soft shadow-[var(--nova-primary)]/10">
        <Sparkles size={icon} />
      </span>
      {!iconOnly && (
        <span className={`${text} ${lightText ? 'text-white' : 'text-[var(--nova-text)] dark:text-white'}`}>
          Cadence
        </span>
      )}
    </Link>
  );
}
