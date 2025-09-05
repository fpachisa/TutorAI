'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface HintMeterProps {
  level: 0 | 1 | 2;
  frustrated?: boolean;
  className?: string;
  onHintRequest?: () => void;
}

/**
 * 💡 HintMeter - Visual indicator of hint progression with interactive tooltip
 */
export function HintMeter({ level, frustrated = false, className = '', onHintRequest }: HintMeterProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const dots = [0, 1, 2];
  
  return (
    <div className={`relative ${className}`}>
      {/* Main Meter */}
      <div className="flex items-center gap-2">
        {/* Label */}
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <Lightbulb className="w-4 h-4" />
          <span className="font-medium">Hints</span>
        </div>
        
        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {dots.map((dotIndex) => {
            const isActive = dotIndex < level;
            const isCurrent = dotIndex === level;
            
            return (
              <motion.div
                key={dotIndex}
                className={`
                  w-3 h-3 rounded-full border-2 transition-all duration-base
                  ${isActive 
                    ? 'bg-warn border-warn shadow-sm' 
                    : isCurrent && frustrated
                      ? 'border-warn bg-warn/20 shadow-glow animate-pulse-glow'
                      : 'border-border bg-transparent'
                  }
                `}
                animate={isCurrent && frustrated ? {
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 0 rgba(245,158,11,0)',
                    '0 0 8px rgba(245,158,11,0.5)',
                    '0 0 0 rgba(245,158,11,0)'
                  ]
                } : {}}
                transition={isCurrent && frustrated ? { 
                  duration: 1.5, 
                  repeat: Infinity 
                } : {}}
              />
            );
          })}
        </div>
        
        {/* Help Button */}
        {frustrated && (
          <motion.button
            className="ml-2 p-1.5 rounded-lg bg-warn/10 border border-warn/20 text-warn hover:bg-warn/20 transition-colors"
            onClick={onHintRequest}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            aria-label="Request a hint"
          >
            <HelpCircle className="w-4 h-4" />
          </motion.button>
        )}
      </div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && frustrated && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-tooltip"
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-float">
              <div className="text-sm font-medium text-tutor mb-1">
                Need a small hint?
              </div>
              <div className="text-xs text-muted">
                Click to get guidance without the full answer
              </div>
              
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-2 bg-surface border-r border-b border-border rotate-45 transform -translate-y-1" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Progress Description */}
      <motion.div 
        className="mt-2 text-xs text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {getProgressDescription(level, frustrated)}
      </motion.div>
    </div>
  );
}

/**
 * 📝 Get description based on current hint level
 */
function getProgressDescription(level: 0 | 1 | 2, frustrated: boolean): string {
  if (frustrated) {
    return "Struggling? Let's try a different approach together.";
  }
  
  switch (level) {
    case 0:
      return "Working through discovery questions";
    case 1:
      return "Getting some guided hints";
    case 2:
      return "Receiving structured support";
    default:
      return "Learning through exploration";
  }
}

export default HintMeter;