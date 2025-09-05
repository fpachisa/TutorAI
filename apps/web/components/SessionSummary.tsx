'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, BookOpen, Target, Clock, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useConfetti, confettiPresets } from '@/lib/confetti';
import { useAnalytics } from '@/lib/analytics';

interface SessionSummaryProps {
  topicName: string;
  masteryScore: number; // 0-1
  totalTurns: number;
  timeSpent?: number; // minutes
  conceptsLearned: string[];
  onRestart: () => void;
  onContinue?: () => void;
  className?: string;
  sessionId?: string;
  userId?: string;
  topicKey?: string;
}

/**
 * 🎊 SessionSummary - Beautiful completion summary with celebration
 */
export function SessionSummary({
  topicName,
  masteryScore,
  totalTurns,
  timeSpent = 0,
  conceptsLearned,
  onRestart,
  onContinue,
  className = '',
  sessionId,
  userId,
  topicKey = 'fractions_divide_by_whole'
}: SessionSummaryProps) {
  const [mounted, setMounted] = useState(false);
  const { canvasRef, fire } = useConfetti();
  const analytics = useAnalytics(sessionId, userId);
  
  const masteryLevel = getMasteryLevel(masteryScore);
  const achievements = getAchievements(masteryScore, totalTurns, timeSpent);

  // Mount and trigger celebration
  useEffect(() => {
    setMounted(true);
    analytics.trackSessionCompleted(topicKey, totalTurns, masteryScore);
    
    // Celebration based on mastery level
    setTimeout(() => {
      if (masteryLevel.level === 'mastered') {
        fire(confettiPresets.victory);
      } else if (masteryLevel.level === 'solid') {
        fire(confettiPresets.success);
      } else {
        fire(confettiPresets.progress);
      }
    }, 800);
  }, [fire, masteryLevel.level, analytics, topicKey, totalTurns, masteryScore]);

  if (!mounted) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
        style={{ width: '100%', height: '100%' }}
      />

      <motion.div
        className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Header with Trophy */}
        <motion.div
          className={`px-6 py-8 bg-gradient-to-br ${masteryLevel.gradient} text-center relative overflow-hidden`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>

          {/* Trophy Icon */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.4, 
              type: 'spring', 
              stiffness: 300, 
              damping: 15 
            }}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-soft">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative z-10"
          >
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              {masteryLevel.title}
            </h2>
            <p className="text-white/90 text-sm">
              Great work on <strong>{topicName}</strong>!
            </p>
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mastery Band */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-tutor">Understanding Level</span>
              <span className={`font-semibold ${masteryLevel.color}`}>
                {Math.round(masteryScore * 100)}%
              </span>
            </div>
            
            <div className="h-3 bg-surfaceAlt rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${masteryLevel.bgColor} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${masteryScore * 100}%` }}
                transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted mt-2">
              <span>Getting there</span>
              <span>Solid</span>
              <span>Mastered</span>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <StatCard
              icon={<Target className="w-4 h-4" />}
              label="Questions"
              value={totalTurns.toString()}
              delay={1.1}
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="Time"
              value={timeSpent ? `${timeSpent}m` : '~15m'}
              delay={1.2}
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Progress"
              value={masteryLevel.badge}
              delay={1.3}
            />
          </motion.div>

          {/* What You Learned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-accent" />
              <h3 className="font-medium text-tutor">What you learned</h3>
            </div>
            
            <div className="space-y-2">
              {conceptsLearned.slice(0, 3).map((concept, index) => (
                <motion.div
                  key={concept}
                  className="flex items-center gap-3 p-3 bg-surfaceAlt rounded-lg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 + index * 0.1 }}
                >
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span className="text-sm text-tutor">{concept}</span>
                </motion.div>
              ))}
              
              {conceptsLearned.length > 3 && (
                <motion.div
                  className="text-center text-xs text-muted pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                >
                  +{conceptsLearned.length - 3} more concepts mastered
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
            >
              <h3 className="font-medium text-tutor mb-3">Achievements unlocked</h3>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.name}
                    className="px-3 py-1.5 bg-warn/10 border border-warn/20 rounded-full text-xs font-medium text-warn"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.7 + index * 0.1 }}
                  >
                    {achievement.icon} {achievement.name}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            className="flex gap-3 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
          >
            <motion.button
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surfaceAlt border border-border rounded-xl font-medium text-tutor hover:bg-surfaceHover hover:border-accent/30 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw className="w-4 h-4" />
              Practice Again
            </motion.button>
            
            {onContinue && (
              <motion.button
                onClick={onContinue}
                className="flex-1 btn btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue Learning
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * 📊 Stat card component
 */
function StatCard({ icon, label, value, delay }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      className="text-center p-4 bg-surfaceAlt rounded-xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 300 }}
    >
      <div className="text-accent mb-2 flex justify-center">
        {icon}
      </div>
      <div className="font-semibold text-tutor text-lg mb-1">
        {value}
      </div>
      <div className="text-xs text-muted">
        {label}
      </div>
    </motion.div>
  );
}

/**
 * 🎯 Get mastery level configuration
 */
function getMasteryLevel(score: number) {
  if (score >= 0.8) {
    return {
      level: 'mastered' as const,
      title: '🎉 Mastered!',
      badge: 'Expert',
      color: 'text-success',
      bgColor: 'bg-success',
      gradient: 'from-success to-success/80'
    };
  } else if (score >= 0.6) {
    return {
      level: 'solid' as const,
      title: '🌟 Solid Understanding!',
      badge: 'Good',
      color: 'text-accentAlt',
      bgColor: 'bg-accentAlt',
      gradient: 'from-accentAlt to-accent'
    };
  } else {
    return {
      level: 'learning' as const,
      title: '💪 Good Progress!',
      badge: 'Learning',
      color: 'text-warn',
      bgColor: 'bg-warn',
      gradient: 'from-warn to-warn/80'
    };
  }
}

/**
 * 🏆 Get achievements based on performance
 */
function getAchievements(masteryScore: number, turns: number, timeSpent: number) {
  const achievements = [];

  if (masteryScore >= 0.9) {
    achievements.push({ name: 'Math Genius', icon: '🧠' });
  }
  if (turns >= 10) {
    achievements.push({ name: 'Persistent Learner', icon: '💪' });
  }
  if (timeSpent > 0 && timeSpent < 10) {
    achievements.push({ name: 'Quick Thinker', icon: '⚡' });
  }
  if (masteryScore >= 0.8 && turns <= 8) {
    achievements.push({ name: 'Efficient Learner', icon: '🎯' });
  }

  return achievements;
}

export default SessionSummary;