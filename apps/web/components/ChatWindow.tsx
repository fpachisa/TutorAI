'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { MessageBubble, TypingBubble, WelcomeBubble } from './MessageBubble';
import { useConfetti } from '@/lib/confetti';
import { Intent } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'tutor' | 'student';
  text: string;
  intent?: Intent;
  timestamp: Date;
  isNew?: boolean;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  isTyping?: boolean;
  showWelcome?: boolean;
  topicName?: string;
  className?: string;
  onMessageVisible?: (messageId: string) => void;
}

/**
 * 💬 ChatWindow - Smooth scrolling chat interface with beautiful animations
 */
export function ChatWindow({ 
  messages, 
  isTyping = false,
  showWelcome = false,
  topicName = '',
  className = '',
  onMessageVisible
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());
  const { canvasRef, celebrate } = useConfetti();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const scrollToBottom = () => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      };
      
      // Small delay to allow for DOM updates
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isTyping, autoScroll]);

  // Handle scroll events to determine auto-scroll behavior
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for message visibility
  useEffect(() => {
    if (!onMessageVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = entry.target.getAttribute('data-message-id');
          if (messageId && entry.isIntersecting) {
            if (!visibleMessages.has(messageId)) {
              setVisibleMessages(prev => new Set(Array.from(prev).concat(messageId)));
              onMessageVisible(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const messageElements = scrollRef.current?.querySelectorAll('[data-message-id]');
    messageElements?.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, onMessageVisible, visibleMessages]);

  // Note: Confetti celebration is now handled in the tutor page

  return (
    <div className={`relative flex flex-col h-full ${className}`}>
      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Chat Messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-1 py-4 space-y-1 scroll-smooth"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent',
        }}
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
      >
        {/* Welcome Message */}
        <AnimatePresence>
          {showWelcome && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <WelcomeBubble topicName={topicName} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              data-message-id={message.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 25,
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 }
              }}
            >
              <MessageBubble
                role={message.role}
                intent={message.intent}
                timestamp={message.timestamp}
                isNew={message.isNew}
              >
                <MessageContent text={message.text} />
              </MessageBubble>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <TypingBubble />
          )}
        </AnimatePresence>

        {/* Spacer for better UX */}
        <div className="h-4" />
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {!autoScroll && messages.length > 3 && (
          <motion.button
            className="absolute bottom-4 right-4 p-3 bg-accent text-white rounded-full shadow-float hover:shadow-glow transition-all"
            onClick={() => {
              setAutoScroll(true);
              scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll to bottom"
          >
            <motion.div
              animate={{ y: [0, 3, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ↓
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Gradient Overlays for Scroll Hints */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-bg to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-bg to-transparent pointer-events-none z-10" />
    </div>
  );
}


/**
 * 📝 Message content with professional markdown + math rendering
 */
function MessageContent({ text }: { text: string }) {
  // Handle undefined or null text
  if (!text) {
    return <div className="prose-sm max-w-none text-textMuted">No message content</div>;
  }

  // Convert escaped newlines to actual newlines for proper markdown parsing
  const markdownText = text.replace(/\\n/g, '\n');

  return (
    <div className="prose-sm max-w-none">
      <ReactMarkdown 
        remarkPlugins={[[remarkMath, { singleDollarTextMath: false }]]} 
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom styling for inline code
          code: ({ children, className, ...props }) => {
            return (
              <code 
                className={`px-1 py-0.5 bg-gray-100 rounded text-blue-600 font-mono text-sm ${className || ''}`} 
                {...props}
              >
                {children}
              </code>
            );
          },
          // Custom styling for paragraphs
          p: ({ children, ...props }) => {
            return <p className="mb-2 last:mb-0" {...props}>{children}</p>;
          }
        }}
      >
        {markdownText}
      </ReactMarkdown>
    </div>
  );
}

/**
 * 🎨 Chat window variants for different states
 */

interface EmptyChatProps {
  title?: string;
  topicName?: string;
  description?: string;
  icon?: string;
  onStart?: () => void;
  onStartClick?: () => void;
  isLoading?: boolean;
}

export function EmptyChat({ title, topicName, description, icon, onStart, onStartClick, isLoading }: EmptyChatProps) {
  const displayTitle = title || `Ready to learn ${topicName}?`;
  const displayDescription = description || "I'll guide you through step-by-step using questions to help you discover the answers yourself. No direct answers - just smart guidance!";
  const displayIcon = icon || '🧠';

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="w-20 h-20 mx-auto mb-6 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-3xl">{displayIcon}</span>
        </motion.div>
        
        <h3 className="text-xl font-heading font-semibold mb-3 gradient-text">
          {displayTitle}
        </h3>
        
        <p className="text-muted mb-6 leading-relaxed">
          {displayDescription}
        </p>
        
        {isLoading ? (
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
            <span className="text-muted">Starting your learning session...</span>
          </div>
        ) : onStartClick ? (
          <motion.button
            onClick={onStartClick}
            className="btn btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Let's get started! 🚀
          </motion.button>
        ) : (
          <div className="text-muted">Preparing your personalized lesson...</div>
        )}
      </motion.div>
    </div>
  );
}

export default ChatWindow;