'use client';

import { motion } from 'framer-motion';
import { Search, Lightbulb, CheckSquare, BookOpen } from 'lucide-react';

interface ProgressChipsProps {
  step: number;
  total?: number;
  className?: string;
}

const STEPS = [
  { id: 1, label: 'Probe', icon: Search, color: 'accent' },
  { id: 2, label: 'Hint', icon: Lightbulb, color: 'warn' },
  { id: 3, label: 'Check', icon: CheckSquare, color: 'accentAlt' },
  { id: 4, label: 'Summary', icon: BookOpen, color: 'success' },
] as const;

/**
 * 📊 ProgressChips - Visual progress indicator for the learning journey
 */
export function ProgressChips({ step, total = 4, className = '' }: ProgressChipsProps) {
  return (
    <div className={`flex items-center justify-center gap-3 mb-6 ${className}`}>
      {STEPS.slice(0, total).map((chipStep, index) => {
        const isActive = index + 1 === step;
        const isCompleted = index + 1 < step;
        const isUpcoming = index + 1 > step;
        
        return (
          <motion.div
            key={chipStep.id}
            className="flex items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Chip */}
            <motion.div
              className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                transition-all duration-base cursor-pointer
                ${isActive 
                  ? 'bg-accent/20 border-2 border-accent text-accent shadow-glow' 
                  : isCompleted
                    ? 'bg-success/10 border border-success/30 text-success'
                    : 'bg-surface border border-border text-muted hover:border-accent/30'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isActive ? { 
                boxShadow: [
                  '0 0 15px rgba(139,92,246,0.3)',
                  '0 0 25px rgba(139,92,246,0.5)',
                  '0 0 15px rgba(139,92,246,0.3)'
                ]
              } : {}}
              transition={isActive ? { duration: 2, repeat: Infinity } : {}}
            >
              {/* Background Glow for Active */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gradient-primary rounded-xl opacity-10"
                  animate={{ opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {/* Icon */}
              <motion.div
                className="relative z-10"
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <chipStep.icon className="w-4 h-4" />
              </motion.div>
              
              {/* Label */}
              <span className="relative z-10">
                {chipStep.label}
              </span>
              
              {/* Completed Check */}
              {isCompleted && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </motion.div>
              )}
            </motion.div>
            
            {/* Connector Line */}
            {index < total - 1 && (
              <motion.div
                className="h-px w-8 mx-2"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: (index + 1) * 0.1, duration: 0.3 }}
              >
                <div className={`h-full transition-colors duration-base ${
                  isCompleted ? 'bg-success' : 'bg-border'
                }`} />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default ProgressChips;