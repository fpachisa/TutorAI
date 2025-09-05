'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAnalytics } from '@/lib/analytics';

interface ComposerProps {
  disabled?: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
  className?: string;
  sessionId?: string;
  userId?: string;
  topicKey?: string;
}

const QUICK_ACTIONS = [
  { 
    id: 'stuck', 
    text: "I'm stuck", 
    icon: HelpCircle, 
    description: 'Let the tutor know you need help',
    color: 'warn'
  },
  { 
    id: 'explain', 
    text: "Explain differently", 
    icon: Zap, 
    description: 'Ask for a different explanation approach',
    color: 'accent'
  },
] as const;

/**
 * ✍️ Composer - Beautiful input area with quick actions and smart features
 */
export function Composer({ 
  disabled = false,
  onSend,
  placeholder = "Type your response or question...",
  className = '',
  sessionId,
  userId,
  topicKey = 'fractions_divide_by_whole'
}: ComposerProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analytics = useAnalytics(sessionId, userId);
  
  const isMessageValid = message.trim().length > 0 && message.trim().length <= 240;
  const remainingChars = 240 - message.length;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!isMessageValid || disabled) return;
    
    const trimmedMessage = message.trim();
    analytics.trackMessageSent(trimmedMessage.length, false, topicKey);
    onSend(trimmedMessage);
    setMessage('');
    setShowQuickActions(false);
    
    // Refocus after send
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[number]) => {
    analytics.trackQuickActionUsed(action.id, topicKey);
    onSend(action.text);
    setMessage('');
    setShowQuickActions(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Quick Actions */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            className="absolute bottom-full left-0 right-0 mb-3 z-popover"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-surface border border-border rounded-xl shadow-float overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-tutor">Quick Actions</h3>
                <p className="text-xs text-muted mt-1">Or type your own message below</p>
              </div>
              
              <div className="p-2">
                {QUICK_ACTIONS.map((action, index) => (
                  <motion.button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surfaceHover transition-colors text-left"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`p-1.5 rounded-lg bg-${action.color}/10 text-${action.color}`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-tutor">
                        "{action.text}"
                      </div>
                      <div className="text-xs text-muted">
                        {action.description}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input */}
      <motion.div
        className={`
          relative bg-surface border rounded-2xl transition-all duration-base
          ${isFocused 
            ? 'border-accent shadow-glow bg-surfaceHover' 
            : 'border-border shadow-surface'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="
            w-full px-3 sm:px-4 py-2 sm:py-3 bg-transparent text-tutor placeholder-muted resize-none
            focus:outline-none text-sm leading-relaxed
            max-h-[120px] min-h-[44px] sm:min-h-[48px]
          "
          aria-label="Message input"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
          }}
        />

        {/* Bottom Row */}
        <div className="flex items-center justify-between px-3 sm:px-4 pb-2 sm:pb-3">
          {/* Character Count & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Character Counter */}
            <motion.div 
              className={`text-xs transition-colors ${
                remainingChars < 20 
                  ? remainingChars < 0 ? 'text-danger' : 'text-warn'
                  : 'text-muted'
              }`}
              animate={{ 
                scale: remainingChars < 20 ? [1, 1.1, 1] : 1,
              }}
              transition={{ 
                duration: 0.3,
                repeat: remainingChars < 0 ? Infinity : 0
              }}
            >
              {remainingChars}
            </motion.div>

            {/* Quick Actions Toggle */}
            <motion.button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="text-xs text-muted hover:text-accent transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={disabled}
            >
              Quick actions
            </motion.button>
          </div>

          {/* Send Button */}
          <motion.button
            onClick={handleSend}
            disabled={!isMessageValid || disabled}
            className={`
              p-2.5 rounded-xl transition-all duration-base
              ${isMessageValid && !disabled
                ? 'bg-gradient-primary text-white shadow-soft hover:shadow-float' 
                : 'bg-surfaceAlt text-muted cursor-not-allowed'
              }
            `}
            whileHover={isMessageValid && !disabled ? { scale: 1.05 } : undefined}
            whileTap={isMessageValid && !disabled ? { scale: 0.95 } : undefined}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Glow Effect */}
        {isFocused && (
          <motion.div
            className="absolute inset-0 bg-gradient-primary rounded-2xl opacity-5 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>

      {/* Keyboard Hint */}
      {isFocused && (
        <motion.div
          className="absolute top-full left-4 mt-2 text-xs text-muted"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
        >
          Press Enter to send • Shift + Enter for new line
        </motion.div>
      )}
    </div>
  );
}

export default Composer;