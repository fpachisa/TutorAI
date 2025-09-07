'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Play, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface PracticeUnit {
  unit_id: number;
  story_theme: {
    title: string;
    emoji: string;
    intro: string;
  };
  total_questions: number;
  isLocked: boolean;
  isCompleted: boolean;
  score?: number;
  perfectScore?: boolean;
}

interface PracticePathProps {
  topic: string;
  units: PracticeUnit[];
  className?: string;
}

/**
 * 🎮 PracticePath - Duolingo-inspired linear learning path
 */
export function PracticePath({ topic, units, className = '' }: PracticePathProps) {
  const router = useRouter();
  const [hoveredUnit, setHoveredUnit] = useState<number | null>(null);

  const handleUnitClick = (unit: PracticeUnit) => {
    if (unit.isLocked) return;
    
    // Navigate to practice session for this unit
    router.push(`/practice/${topic}/unit/${unit.unit_id}`);
  };

  const getUnitState = (unit: PracticeUnit) => {
    if (unit.isCompleted) return 'completed';
    if (unit.isLocked) return 'locked';
    return 'available';
  };

  const getUnitColors = (state: string) => {
    switch (state) {
      case 'completed':
        return {
          bg: 'bg-success',
          border: 'border-success',
          text: 'text-white',
          shadow: 'shadow-success/20'
        };
      case 'available':
        return {
          bg: 'bg-accent hover:bg-accentAlt',
          border: 'border-accent',
          text: 'text-white',
          shadow: 'shadow-accent/30'
        };
      case 'locked':
      default:
        return {
          bg: 'bg-muted',
          border: 'border-border',
          text: 'text-muted',
          shadow: 'shadow-sm'
        };
    }
  };

  const PathConnector = ({ index, isCompleted }: { index: number; isCompleted: boolean }) => (
    <div className="flex items-center justify-center py-4">
      <motion.div
        className={`h-1 w-16 rounded-full transition-colors duration-500 ${
          isCompleted ? 'bg-success' : 'bg-border'
        }`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
      />
    </div>
  );

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Path Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-heading font-bold gradient-text mb-2">
          {topic.charAt(0).toUpperCase() + topic.slice(1)} Practice
        </h2>
        <p className="text-muted text-sm">
          Complete each adventure to master algebra concepts
        </p>
      </motion.div>

      {/* Practice Path */}
      <div className="space-y-2">
        {units.map((unit, index) => {
          const state = getUnitState(unit);
          const colors = getUnitColors(state);
          const isEven = index % 2 === 0;

          return (
            <div key={unit.unit_id} className="relative">
              {/* Path Connector (except for first unit) */}
              {index > 0 && (
                <PathConnector 
                  index={index} 
                  isCompleted={units[index - 1].isCompleted} 
                />
              )}

              {/* Unit Container */}
              <motion.div
                className={`relative ${isEven ? 'ml-0' : 'ml-8'}`}
                initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                onHoverStart={() => !unit.isLocked && setHoveredUnit(unit.unit_id)}
                onHoverEnd={() => setHoveredUnit(null)}
              >
                {/* Unit Button */}
                <motion.button
                  onClick={() => handleUnitClick(unit)}
                  disabled={unit.isLocked}
                  className={`
                    relative w-20 h-20 rounded-full border-4 transition-all duration-300
                    ${colors.bg} ${colors.border} ${colors.text} ${colors.shadow}
                    ${unit.isLocked 
                      ? 'cursor-not-allowed opacity-60' 
                      : 'cursor-pointer hover:scale-110 active:scale-95'
                    }
                    shadow-lg
                  `}
                  whileHover={!unit.isLocked ? { 
                    scale: 1.1,
                    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)'
                  } : {}}
                  whileTap={!unit.isLocked ? { scale: 0.95 } : {}}
                >
                  {/* Unit Icon */}
                  <div className="flex items-center justify-center">
                    {state === 'locked' && <Lock className="w-8 h-8" />}
                    {state === 'completed' && <Check className="w-8 h-8" />}
                    {state === 'available' && (
                      <span className="text-2xl">{unit.story_theme.emoji}</span>
                    )}
                  </div>

                  {/* Perfect Score Indicator */}
                  {unit.perfectScore && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 bg-warn rounded-full flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: 0.5,
                        type: 'spring',
                        stiffness: 500,
                        damping: 15
                      }}
                    >
                      <Star className="w-3 h-3 text-white fill-current" />
                    </motion.div>
                  )}

                  {/* Glow Effect for Available Units */}
                  {state === 'available' && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-accent opacity-20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}
                </motion.button>

                {/* Unit Info Card */}
                <AnimatePresence>
                  {hoveredUnit === unit.unit_id && !unit.isLocked && (
                    <motion.div
                      className={`
                        absolute top-1/2 -translate-y-1/2 z-10 p-4 bg-surface border border-border rounded-xl shadow-float
                        ${isEven ? 'left-24' : 'right-24'}
                      `}
                      initial={{ opacity: 0, scale: 0.8, x: isEven ? -10 : 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: isEven ? -10 : 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Arrow Pointer */}
                      <div 
                        className={`
                          absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-surface border-border rotate-45
                          ${isEven 
                            ? '-left-1.5 border-r border-b' 
                            : '-right-1.5 border-l border-t'
                          }
                        `} 
                      />
                      
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{unit.story_theme.emoji}</span>
                          <h3 className="font-semibold text-foreground text-sm">
                            {unit.story_theme.title}
                          </h3>
                        </div>
                        
                        <p className="text-xs text-muted mb-3 line-clamp-2">
                          {unit.story_theme.intro}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>{unit.total_questions} questions</span>
                          {unit.score && (
                            <span className="text-success font-medium">
                              {unit.score}% complete
                            </span>
                          )}
                        </div>
                        
                        {state === 'available' && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-accent">
                            <Play className="w-3 h-3" />
                            <span>Click to start</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Unit Number Badge */}
                <div className={`
                  absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full
                  bg-surface border-2 border-border text-xs font-bold text-muted
                  flex items-center justify-center
                `}>
                  {unit.unit_id}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {units.every(unit => unit.isCompleted) && (
        <motion.div
          className="text-center mt-8 p-6 bg-success/10 border border-success/20 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="font-heading font-bold text-success mb-1">
            All Adventures Complete!
          </h3>
          <p className="text-sm text-muted">
            You've mastered all {topic} practice units. Amazing work!
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default PracticePath;