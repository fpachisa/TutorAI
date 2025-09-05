'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useConfetti, confettiPresets } from '@/lib/confetti';
import { useAnalytics } from '@/lib/analytics';

interface MCQItem {
  stem: string;
  choices: [string, string, string, string];
  answer: 'A' | 'B' | 'C' | 'D';
}

interface CheckpointCardProps {
  items: MCQItem[];
  onSelect: (choice: 'A' | 'B' | 'C' | 'D') => void;
  disabled?: boolean;
  showResult?: boolean;
  selectedChoice?: 'A' | 'B' | 'C' | 'D';
  isCorrect?: boolean;
  className?: string;
  sessionId?: string;
  userId?: string;
  topicKey?: string;
}

/**
 * 🎯 CheckpointCard - Interactive quiz component with beautiful animations
 */
export function CheckpointCard({ 
  items,
  onSelect,
  disabled = false,
  showResult = false,
  selectedChoice,
  isCorrect,
  className = '',
  sessionId,
  userId,
  topicKey = 'fractions_divide_by_whole'
}: CheckpointCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { fire, celebrate } = useConfetti();
  const analytics = useAnalytics(sessionId, userId);

  // Assume single question for now (can be extended)
  const question = items[0];
  const choices: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }> = [
    { key: 'A', text: question.choices[0] },
    { key: 'B', text: question.choices[1] },
    { key: 'C', text: question.choices[2] },
    { key: 'D', text: question.choices[3] },
  ];

  // Handle result display
  useEffect(() => {
    if (showResult && selectedChoice) {
      setSelectedAnswer(selectedChoice);
      setIsLocked(true);
      setShowFeedback(true);
      
      // Track analytics
      analytics.trackCheckpointAnswered(isCorrect || false, selectedChoice, topicKey);
      
      // Celebrate if correct
      if (isCorrect) {
        setTimeout(() => celebrate(), 300);
      }
    }
  }, [showResult, selectedChoice, isCorrect, celebrate, analytics, topicKey]);

  const handleSelect = (choice: 'A' | 'B' | 'C' | 'D') => {
    if (isLocked || disabled) return;
    
    setSelectedAnswer(choice);
    setIsLocked(true);
    onSelect(choice);
  };

  const handleKeyDown = (e: React.KeyboardEvent, choice: 'A' | 'B' | 'C' | 'D') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(choice);
    }
  };

  return (
    <motion.div
      className={`bg-surface border border-border rounded-2xl shadow-surface overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header */}
      <motion.div 
        className="px-6 py-4 bg-gradient-to-r from-accentAlt/10 to-accent/10 border-b border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-tutor">
              Checkpoint Quiz
            </h3>
            <p className="text-xs text-muted">
              Let's check your understanding so far
            </p>
          </div>
        </div>
      </motion.div>

      {/* Question */}
      <div className="p-6">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-tutor font-medium leading-relaxed text-lg mb-2">
            {question.stem}
          </p>
          <div className="text-xs text-muted">
            Choose the best answer:
          </div>
        </motion.div>

        {/* Choices */}
        <div className="space-y-3">
          {choices.map((choice, index) => {
            const isSelected = selectedAnswer === choice.key;
            const isCorrectAnswer = choice.key === question.answer;
            const showAsCorrect = showFeedback && isCorrectAnswer;
            const showAsIncorrect = showFeedback && isSelected && !isCorrectAnswer;
            
            return (
              <motion.button
                key={choice.key}
                onClick={() => handleSelect(choice.key)}
                onKeyDown={(e) => handleKeyDown(e, choice.key)}
                disabled={isLocked || disabled}
                className={`
                  w-full p-4 rounded-xl text-left transition-all duration-base min-h-[56px]
                  flex items-center gap-4 group
                  ${isLocked || disabled
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer hover:scale-[1.02] hover:shadow-surface'
                  }
                  ${showAsCorrect
                    ? 'bg-success/10 border-2 border-success text-success'
                    : showAsIncorrect
                      ? 'bg-danger/10 border-2 border-danger text-danger'
                      : isSelected
                        ? 'bg-accent/10 border-2 border-accent text-accent'
                        : 'bg-surfaceAlt border border-border text-tutor hover:border-accent/40 hover:bg-surfaceHover'
                  }
                `}
                initial={{ opacity: 0, x: -10 }}
                animate={showAsIncorrect ? {
                  opacity: 1,
                  x: [0, -8, 8, -4, 4, 0]
                } : { opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={!isLocked && !disabled ? { x: 4 } : undefined}
                whileTap={!isLocked && !disabled ? { scale: 0.98 } : undefined}
                role="radio"
                aria-checked={isSelected}
                aria-label={`Choice ${choice.key}: ${choice.text}`}
              >
                {/* Choice Letter */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm
                  transition-colors
                  ${showAsCorrect
                    ? 'bg-success text-white'
                    : showAsIncorrect
                      ? 'bg-danger text-white'
                      : isSelected
                        ? 'bg-accent text-white'
                        : 'bg-border text-muted group-hover:bg-accent/20 group-hover:text-accent'
                  }
                `}>
                  {choice.key}
                </div>
                
                {/* Choice Text */}
                <div className="flex-1 font-medium">
                  {choice.text}
                </div>
                
                {/* Result Icon */}
                <AnimatePresence>
                  {showFeedback && isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {isCorrectAnswer ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-danger" />
                      )}
                    </motion.div>
                  )}
                  {showFeedback && !isSelected && isCorrectAnswer && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              className={`mt-6 p-4 rounded-xl ${
                isCorrect 
                  ? 'bg-success/10 border border-success/20' 
                  : 'bg-warn/10 border border-warn/20'
              }`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`flex items-start gap-3 ${isCorrect ? 'text-success' : 'text-warn'}`}>
                <div className="mt-0.5">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">
                    {isCorrect ? '🎉 Excellent!' : '🤔 Not quite right'}
                  </div>
                  <div className="text-sm opacity-90">
                    {isCorrect 
                      ? 'You\'re understanding this concept well! Let\'s continue building on this knowledge.'
                      : `The correct answer is ${question.answer}. Let's explore this concept a bit more to strengthen your understanding.`
                    }
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default CheckpointCard;