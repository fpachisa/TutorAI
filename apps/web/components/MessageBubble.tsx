'use client';

import { motion } from 'framer-motion';
import { Bot, User, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';
import { Intent, utils } from '@/lib/api';

interface MessageBubbleProps {
  role: 'tutor' | 'student';
  intent?: Intent;
  children: ReactNode;
  timestamp?: Date;
  className?: string;
  isNew?: boolean;
}

/**
 * 💬 MessageBubble - Beautiful chat messages with intent indicators
 */
export function MessageBubble({ 
  role, 
  intent, 
  children, 
  timestamp, 
  className = '',
  isNew = false 
}: MessageBubbleProps) {
  const isTutor = role === 'tutor';
  const intentStyle = intent ? utils.getIntentStyle(intent) : null;
  
  return (
    <motion.div
      className={`flex ${isTutor ? 'justify-start' : 'justify-end'} mb-4 ${className}`}
      initial={isNew ? { opacity: 0, y: 20, scale: 0.95 } : undefined}
      animate={isNew ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      role="article"
      aria-live={isTutor ? "polite" : undefined}
    >
      <div className={`flex gap-3 max-w-[85%] ${isTutor ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <motion.div
          className={`
            flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
            ${isTutor 
              ? 'bg-gradient-primary text-white shadow-soft' 
              : 'bg-student/20 text-student border border-student/30'
            }
          `}
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {isTutor ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </motion.div>
        
        {/* Message Container */}
        <div className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'}`}>
          
          {/* Message Bubble */}
          <motion.div
            className={`
              relative px-4 py-3 rounded-2xl font-medium text-sm leading-relaxed
              ${isTutor 
                ? 'bg-surface border border-surfaceAlt text-tutor rounded-tl-md shadow-surface' 
                : 'bg-student/20 border border-student/40 text-tutor rounded-tr-md shadow-surface'
              }
            `}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* Message Content */}
            <div className="relative z-10">
              {children}
            </div>
            
            {/* Background Glow for Tutor */}
            {isTutor && (
              <motion.div
                className="absolute inset-0 bg-gradient-primary rounded-2xl opacity-0"
                whileHover={{ opacity: 0.05 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.div>
          
          {/* Timestamp */}
          {timestamp && (
            <motion.div
              className={`text-xs text-muted mt-1 px-1 ${isTutor ? 'text-left' : 'text-right'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {formatTimestamp(timestamp)}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 🕐 Format timestamp for display
 */
function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  
  return timestamp.toLocaleDateString();
}

/**
 * 🎨 Specialized message variants
 */

interface TypingBubbleProps {
  className?: string;
}

export function TypingBubble({ className = '' }: TypingBubbleProps) {
  return (
    <motion.div
      className={`flex justify-start mb-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-3 max-w-[85%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-primary text-white shadow-soft flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
        
        {/* Typing Indicator */}
        <div className="bg-surface border border-surfaceAlt px-4 py-3 rounded-2xl rounded-tl-md shadow-surface">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-muted rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2 
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface WelcomeBubbleProps {
  topicName: string;
  className?: string;
}

export function WelcomeBubble({ topicName, className = '' }: WelcomeBubbleProps) {
  return (
    <MessageBubble role="tutor" intent="ask_probe" className={className} isNew>
      <div>
        <div className="mb-2">
          <span className="text-lg">👋</span> Hi there! I'm your friendly math tutor.
        </div>
        <div className="mb-3">
          Ready to explore <strong>{topicName}</strong> together? I'll guide you through 
          step-by-step using questions to help you discover the answers yourself!
        </div>
        <div className="text-accent font-medium">
          What would you like to start with?
        </div>
      </div>
    </MessageBubble>
  );
}

export default MessageBubble;