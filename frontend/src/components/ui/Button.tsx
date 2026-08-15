import { forwardRef, useRef, type ButtonHTMLAttributes } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'gradient';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  magnetic?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft disabled:bg-primary-300',
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
  const localRef = useRef<HTMLButtonElement>(null);

  // Set up motion values for magnetic translation
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for translation
  const springConfig = { stiffness: 120, damping: 12, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || disabled || loading || !localRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = localRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Pull button up to 16px towards the cursor
    x.set(distanceX * 0.35);
    y.set(distanceY * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const setRefs = (node: HTMLButtonElement) => {
    // @ts-ignore
    localRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  // transition-colors prevents transform lag from conflicting CSS transition rules
  const classes = `inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${magnetic || variant === 'gradient' ? 'magnetic-btn' : ''} ${className}`;

  return (
    <MotionButton
      ref={setRefs}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { scale: 1.025 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      style={magnetic && !disabled && !loading ? { x: springX, y: springY } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={classes}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </MotionButton>
  );
});
