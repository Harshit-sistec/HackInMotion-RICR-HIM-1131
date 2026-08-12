import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, ArrowRight, Flame, Brain } from 'lucide-react';

const INSIGHTS = [
  {
    icon: Brain,
    labels: ['AI analyzing...', 'AI analyzing your progress...'],
    className: 'left-[-4%] top-[12%] lg:left-[-8%]',
    delay: 0,
    duration: 5,
    color: 'from-primary-500/25 to-violet-500/20',
    iconColor: 'text-primary-300',
  },
  {
    icon: TrendingUp,
    labels: ['+12% retention', '+18% this week'],
    className: 'right-[-4%] top-[6%] lg:right-[-6%]',
    delay: 0.5,
    duration: 6.5,
    color: 'from-accent-500/25 to-primary-500/20',
    iconColor: 'text-accent-300',
  },
  {
    icon: AlertTriangle,
    labels: ['Weak topic detected', 'DP needs attention'],
    className: 'left-[-6%] bottom-[28%] lg:left-[-10%]',
    delay: 1,
    duration: 7,
    color: 'from-coral-500/25 to-pink-500/20',
    iconColor: 'text-coral-300',
  },
  {
    icon: ArrowRight,
    labels: ['Next: Dynamic Programming', 'Up next: Graphs'],
    className: 'right-[-6%] bottom-[18%] lg:right-[-8%]',
    delay: 1.5,
    duration: 5.5,
    color: 'from-violet-500/25 to-accent-500/20',
    iconColor: 'text-violet-300',
  },
  {
    icon: Flame,
    labels: ['7 day streak', 'Study streak: 7 days'],
    className: 'right-[2%] bottom-[-4%] lg:right-[5%]',
    delay: 2,
    duration: 8,
    color: 'from-coral-500/25 to-warning-500/20',
    iconColor: 'text-coral-300',
  },
];

export function FloatingInsight() {
  return (
    <>
      {INSIGHTS.map((insight, i) => (
        <FloatingCard key={i} insight={insight} index={i} />
      ))}
    </>
  );
}

function FloatingCard({
  insight,
  index,
}: {
  insight: (typeof INSIGHTS)[number];
  index: number;
}) {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    if (insight.labels.length <= 1) return;
    const interval = setInterval(() => {
      setLabelIndex((i) => (i + 1) % insight.labels.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [insight.labels.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: 0.9 + insight.delay * 0.25, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute z-20 hidden md:block ${insight.className}`}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: insight.duration, repeat: Infinity, ease: 'easeInOut', delay: insight.delay }}
        className={`flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r ${insight.color} px-3 py-2 shadow-lg backdrop-blur-xl`}
      >
        <insight.icon size={14} className={insight.iconColor} />
        <motion.span
          key={labelIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="whitespace-nowrap text-xs font-medium text-white/90"
        >
          {insight.labels[labelIndex]}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
