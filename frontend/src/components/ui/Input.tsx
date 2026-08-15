import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  premium?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightSlot, className = '', id, premium, onFocus, onBlur, ...props },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || props.name || label;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <motion.div
      animate={premium ? { scale: isFocused ? 1.015 : 1.0 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="w-full relative"
    >
      {label && (
        <label
          htmlFor={inputId}
          className={`mb-1.5 block text-sm font-medium transition-colors duration-300 ${
            premium && isFocused ? 'text-[var(--nova-primary)]' : 'text-[var(--nova-text)] dark:text-ink-200'
          }`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {premium && isFocused && (
          <div className="absolute -inset-[1.5px] rounded-xl bg-gradient-to-r from-[var(--nova-primary)] to-[var(--nova-primary-hover)] opacity-60 blur-[2px] pointer-events-none -z-10 animate-pulse" />
        )}
        {leftIcon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
              premium && isFocused ? 'text-[var(--nova-primary)]' : 'text-ink-400 dark:text-ink-500'
            }`}
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all duration-300 focus:outline-none dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500 ${
            leftIcon ? 'pl-10' : ''
          } ${rightSlot ? 'pr-10' : ''} ${
            error
              ? 'border-error-400 focus:border-error-500 focus:ring-1 focus:ring-error-500/20'
              : premium
                ? isFocused
                  ? 'border-[var(--nova-primary)]/50 bg-[var(--nova-surface)] shadow-[0_0_15px_rgba(37,99,235,0.15)] dark:bg-[#172033]'
                  : 'border-[var(--nova-border)] bg-white/5 dark:bg-ink-900/50'
                : 'border-ink-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 dark:border-ink-700'
          } ${className}`}
          {...props}
        />
        {rightSlot && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-error-600 dark:text-error-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400 dark:text-ink-50">{hint}</p>
      ) : null}
    </motion.div>
  );
});
