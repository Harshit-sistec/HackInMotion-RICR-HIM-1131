import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';
import { fadeUp } from '@/lib/animations';

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  glow?: boolean;
  gradientBorder?: boolean;
}

export function PremiumCard({
  children,
  className = '',
  tilt = true,
  glow = true,
  gradientBorder = true,
}: PremiumCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Framer Motion spring values for smooth 3D tilt
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 150, damping: 20, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Transform 0-1 values to very subtle rotation degrees (-2.5 to 2.5 degrees) for premium feel
  const rotateX = useTransform(springY, [0, 1], [2.5, -2.5]);
  const rotateY = useTransform(springX, [0, 1], [-2.5, 2.5]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Normalized position from 0 to 1
    const posX = (e.clientX - rect.left) / rect.width;
    const posY = (e.clientY - rect.top) / rect.height;
    
    x.set(posX);
    y.set(posY);

    // Set glow position coordinates in percentages
    setGlowPos({ x: posX * 100, y: posY * 100 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smoothly spring back to center
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
      style={
        tilt
          ? {
              perspective: '1000px',
            }
          : undefined
      }
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={
          tilt
            ? {
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }
            : undefined
        }
        className={`group relative h-full rounded-2xl overflow-hidden transition-all duration-200 ease-out border ${
          isHovered
            ? 'shadow-[0_8px_24px_rgba(15,23,42,0.08)] border-blue-500/20 dark:border-blue-400/25'
            : 'shadow-[0_1px_3px_rgba(15,23,42,0.06)] border-slate-200/50 dark:border-white/5'
        }`}
      >
        {/* Moving Border Spotlight (Subtle 100px circle) */}
        {gradientBorder && (
          <div
            className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none z-0 overflow-hidden"
            style={{
              background: isDark
                ? `radial-gradient(100px circle at ${glowPos.x}% ${glowPos.y}%, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.12) 50%, transparent 75%)`
                : `radial-gradient(100px circle at ${glowPos.x}% ${glowPos.y}%, rgba(37, 99, 235, 0.15) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 75%)`,
            }}
          />
        )}

        {/* Card Inner Body (Subtle 120px hover glow) */}
        <div
          className={`relative h-full overflow-hidden rounded-2xl border transition-colors duration-200 ease-out z-10 ${
            isDark
              ? 'border-white/5 bg-ink-900/60 group-hover:border-white/10 group-hover:bg-ink-900/85 text-ink-100'
              : 'border-slate-200/60 bg-white/80 group-hover:border-slate-200/90 group-hover:bg-white text-slate-800'
          } ${
            gradientBorder ? 'm-[1px]' : ''
          } ${className}`}
          style={
            glow
              ? {
                  background: isHovered
                    ? isDark
                      ? `radial-gradient(120px circle at ${glowPos.x}% ${glowPos.y}%, rgba(99, 102, 241, 0.08) 0%, rgba(13, 15, 23, 0.85) 75%)`
                      : `radial-gradient(120px circle at ${glowPos.x}% ${glowPos.y}%, rgba(37, 99, 235, 0.06) 0%, rgba(255, 255, 255, 0.95) 75%)`
                    : undefined,
                }
              : undefined
          }
        >
          {/* Subtle 3D lift for content inside the tilted card */}
          <div
            style={
              tilt
                ? {
                    transform: 'translateZ(8px)',
                  }
                : undefined
            }
          >
            {children}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
