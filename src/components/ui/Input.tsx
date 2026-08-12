import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightSlot, className = '', id, ...props },
  ref,
) {
  const inputId = id || props.name || label;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500 ${
            leftIcon ? 'pl-10' : ''
          } ${rightSlot ? 'pr-10' : ''} ${
            error
              ? 'border-error-400 focus:border-error-500 focus:ring-error-500/20'
              : 'border-ink-200 focus:border-primary-500 dark:border-ink-700'
          } ${className}`}
          {...props}
        />
        {rightSlot && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-error-600 dark:text-error-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400 dark:text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});
