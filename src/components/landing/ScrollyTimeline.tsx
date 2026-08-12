import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useTheme } from '@/store/ThemeContext';

interface Stage {
  num: string;
  label: string;
}

interface ScrollyTimelineProps {
  scrollYProgress: MotionValue<number>;
  stages: Stage[];
  onStageClick: (index: number) => void;
}

export function ScrollyTimeline({ scrollYProgress, stages, onStageClick }: ScrollyTimelineProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Height of the filled timeline path
  const height = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const baseBorderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)';
  const activeBorderColor = isDark ? 'rgba(99,102,241,1)' : 'rgba(37,99,235,1)';

  return (
    <div className="absolute left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center lg:flex pl-4 pointer-events-auto">
      {/* Vertical Line Container */}
      <div className={`relative h-[320px] w-[3px] rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200/80'}`}>
        {/* Progress Fill Line */}
        <motion.div
          className="absolute top-0 w-full rounded-full bg-gradient-to-b from-primary-500 via-violet-500 to-accent-400"
          style={{ height }}
        />

        {/* Stage Interactive Nodes */}
        <div className="absolute top-0 left-1/2 flex h-full -translate-x-1/2 flex-col justify-between py-1">
          {stages.map((stage, index) => {
            // Define active range for styling node scale
            const targetPos = index * 0.25;
            const minRange = targetPos - 0.125;
            const maxRange = targetPos + 0.125;

            // Map scroll progress to node scale
            const scale = useTransform(
              scrollYProgress,
              [
                Math.max(0, minRange - 0.05),
                Math.max(0, minRange),
                targetPos,
                Math.min(1, maxRange),
                Math.min(1, maxRange + 0.05)
              ],
              [1, 1.2, 1.45, 1.2, 1]
            );

            // Completed or current nodes stay bright, future nodes stay dim
            const fillOpacity = useTransform(
              scrollYProgress,
              [Math.max(0, targetPos - 0.05), targetPos],
              [0.15, 1]
            );

            // Change border color on active stage
            const borderStyle = useTransform(
              scrollYProgress,
              [Math.max(0, minRange), targetPos, Math.min(1, maxRange)],
              [baseBorderColor, activeBorderColor, baseBorderColor]
            );

            return (
              <button
                key={stage.num}
                onClick={() => onStageClick(index)}
                className="group relative flex items-center justify-center outline-none focus:outline-none"
              >
                {/* Node circle */}
                <motion.div
                  style={{ scale, borderColor: borderStyle }}
                  className={`h-4.5 w-4.5 rounded-full border-2 transition-shadow duration-300 ${
                    isDark
                      ? 'bg-ink-950 group-hover:border-primary-400 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                      : 'bg-white group-hover:border-blue-500 group-hover:shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                  }`}
                >
                  {/* Innermost filled glow */}
                  <motion.div
                    className="h-full w-full rounded-full bg-gradient-to-br from-primary-400 via-violet-500 to-accent-400"
                    style={{ opacity: fillOpacity }}
                  />
                </motion.div>

                {/* Stage tooltip revealed on hover */}
                <div className="absolute left-8 flex origin-left translate-x-2 items-center opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 pointer-events-none">
                  <div className={`rounded-xl border px-3 py-1.5 backdrop-blur-md shadow-lift whitespace-nowrap ${
                    isDark ? 'border-white/10 bg-ink-900/90 text-white' : 'border-slate-200 bg-white/95 text-slate-800'
                  }`}>
                    <span className={`text-xs font-bold mr-2 ${isDark ? 'text-primary-400' : 'text-blue-600'}`}>{stage.num}</span>
                    <span className="text-xs font-semibold">{stage.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
