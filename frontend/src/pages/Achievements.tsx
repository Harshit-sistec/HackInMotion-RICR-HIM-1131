import { motion } from 'framer-motion';
import { Flame, Target, Brain, BookOpen, Zap, Trophy, Lock, Award } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ACHIEVEMENTS } from '@/data/mockData';

const ICONS: Record<string, typeof Flame> = {
  flame: Flame,
  target: Target,
  brain: Brain,
  book: BookOpen,
  zap: Zap,
  trophy: Trophy,
};

export function Achievements() {
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked);
  const locked = ACHIEVEMENTS.filter((a) => !a.unlocked);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader title="Achievements" subtitle="Celebrate your milestones and keep building consistency." />

        {/* Summary */}
        <div className="grid gap-5 sm:grid-cols-3">
          <Card padding="lg" className="flex items-center gap-4" hover>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-50 text-warning-600 dark:bg-warning-700/20">
              <Flame size={28} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50"><AnimatedNumber value={7} suffix=" days" /></p>
              <p className="text-sm text-ink-500">Current streak</p>
            </div>
          </Card>
          <Card padding="lg" className="flex items-center gap-4" hover>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/40">
              <Zap size={28} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50"><AnimatedNumber value={2450} suffix=" XP" /></p>
              <p className="text-sm text-ink-500">Level 6 · 550 to next</p>
            </div>
          </Card>
          <Card padding="lg" className="flex items-center gap-4" hover>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 dark:bg-accent-900/40">
              <Trophy size={28} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50"><AnimatedNumber value={unlocked.length} />/<AnimatedNumber value={ACHIEVEMENTS.length} /></p>
              <p className="text-sm text-ink-500">Achievements unlocked</p>
            </div>
          </Card>
        </div>

        {/* Unlocked */}
        <h2 className="mb-4 mt-8 font-display text-lg font-bold text-ink-900 dark:text-ink-50">Unlocked</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unlocked.map((a, i) => {
            const Icon = ICONS[a.icon] ?? Award;
            return (
              <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                <Card padding="lg" hover className="border-accent-200 dark:border-accent-800">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-primary-600 text-white shadow-soft">
                      <Icon size={26} />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{a.title}</h3>
                      <p className="text-sm text-ink-500 dark:text-ink-400">{a.description}</p>
                    </div>
                  </div>
                  <div className="mt-3"><Badge tone="success">Unlocked</Badge></div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Locked */}
        <h2 className="mb-4 mt-8 font-display text-lg font-bold text-ink-900 dark:text-ink-50">In Progress</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locked.map((a, i) => {
            const Icon = ICONS[a.icon] ?? Award;
            const pct = a.progress && a.goal ? (a.progress / a.goal) * 100 : 0;
            return (
              <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                <Card padding="lg" hover className="opacity-80">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{a.title}</h3>
                      <p className="text-sm text-ink-500 dark:text-ink-400">{a.description}</p>
                    </div>
                  </div>
                  {a.progress && a.goal && (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-ink-400">Progress</span>
                        <span className="font-semibold text-ink-700 dark:text-ink-200">{a.progress}/{a.goal}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
