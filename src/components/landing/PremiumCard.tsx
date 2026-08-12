import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  glow?: boolean;
  gradientBorder?: boolean;
}

export function PremiumCard({ children, className = '', tilt = false, glow = false, gradientBorder = false }: PremiumCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPos({ x, y });

    if (tilt && window.matchMedia('(hover: hover)').matches) {
      const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
      const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      ref.current.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    }
  };

  const handleLeave = () => {
    setIsHovered(false);
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <motion.div variants={fadeUp} className="h-full">
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleLeave}
        className={`group relative h-full rounded-2xl transition-shadow duration-300 ${
          glow && isHovered ? 'shadow-glow-violet' : 'shadow-soft'
        }`}
      >
        {gradientBorder && (
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary-500/40 via-violet-500/30 to-accent-400/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
        <div
          className={`relative h-full overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60 backdrop-blur-xl transition-all duration-300 group-hover:border-white/20 group-hover:bg-ink-900/80 ${
            gradientBorder ? 'm-px' : ''
          } ${className}`}
          style={
            glow
              ? {
                  background: isHovered
                    ? `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(99,102,241,0.12) 0%, rgba(13,15,23,0.85) 50%)`
                    : undefined,
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
}
