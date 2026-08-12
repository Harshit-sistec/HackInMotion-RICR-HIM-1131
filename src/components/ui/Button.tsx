import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'gradient';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  magnetic?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft disabled:bg-primary-300',
  gradient:
    'bg-gradient-to-r from-primary-500 via-violet-500 to-accent-500 text-white shadow-glow hover:shadow-glow-cyan disabled:opacity-60',
  secondary:
    'bg-ink-100 text-ink-800 hover:bg-ink-200 active:bg-ink-300 dark:bg-ink-800 dark:text-ink-100 dark:hover:bg-ink-700',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50',
  outline:
    'border border-ink-200 text-ink-700 hover:bg-ink-50 hover:border-ink-300 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800',
  danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-700 shadow-soft',
  success: 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 shadow-soft',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const MotionButton = motion.create(
  forwardRef<HTMLButtonElement, ButtonProps>(function ButtonInner(props, ref) {
    const { className = '', children, ...rest } = props;
    return (
      <button ref={ref} className={className} {...rest}>
        {children}
      </button>
    );
  }),
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    magnetic = false,
    className = '',
    children,
    disabled,
    ...props
  },
  ref,
) {
  const classes = `inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${magnetic || variant === 'gradient' ? 'magnetic-btn' : ''} ${className}`;

  return (
    <MotionButton
      ref={ref}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { scale: 1.03 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={classes}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </MotionButton>
  );
});
