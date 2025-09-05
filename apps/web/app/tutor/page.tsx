'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, Settings, Zap, ChevronLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { TopicSelect } from '@/components/TopicSelect';
import { SparkOrb } from '@/components/SparkOrb';
import { ChatWindow, EmptyChat } from '@/components/ChatWindow';
import { Composer } from '@/components/Composer';
import { CheckpointCard } from '@/components/CheckpointCard';
import { SessionSummary } from '@/components/SessionSummary';
import { Toast, ToastContainer, useToast } from '@/components/Toast';
import { 
  TutorAPI, 
  CurriculumAPI, 
  TurnRequest, 
  TurnResponse, 
  Intent, 
  CurriculumPath,
  SimpleCurriculumContent,
  utils
} from '@/lib/api';
import { useAnalytics } from '@/lib/analytics';
import { useConfetti } from '@/lib/confetti';

interface ChatMessage {
  id: string;
  role: 'tutor' | 'student';
  text: string;
  intent?: Intent;
  timestamp: Date;
  isNew?: boolean;
}

interface CheckpointQuestion {
  stem: string;
  choices: string[];
  answer: string;
  rationale?: string;
}

interface CheckpointState {
  items: CheckpointQuestion[];
  selectedChoice?: 'A' | 'B' | 'C' | 'D';
  isCorrect?: boolean;
  showResult?: boolean;
}

type TutorState = 'idle' | 'loading' | 'chatting' | 'checkpoint' | 'complete';
type OrbState = 'idle' | 'thinking' | 'celebrate' | 'nudge' | 'hint';

function TutorPageContent() {
  // URL Parameters and Navigation
  const searchParams = useSearchParams();
  const router = useRouter();
  const grade = searchParams.get('grade') || 'primary-6';
  const subject = searchParams.get('subject') || 'mathematics';
  const topic = searchParams.get('topic');
  const subtopic = searchParams.get('subtopic');
  
  // State Management
  const [curriculumPath, setCurriculumPath] = useState<CurriculumPath | null>(null);
  const [subtopicContent, setSubtopicContent] = useState<SimpleCurriculumContent | null>(null);
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [checkpointState, setCheckpointState] = useState<CheckpointState | null>(null);
  const [sessionData, setSessionData] = useState<{
    totalTurns: number;
    masteryScore: number;
    conceptsLearned: string[];
    timeSpent: number;
  }>({
    totalTurns: 0,
    masteryScore: 0,
    conceptsLearned: [],
    timeSpent: 0
  });

  // Refs and Hooks
  const sessionStartTime = useRef<Date>(new Date());
  const sessionId = useRef<string>('');
  const { success, error, info, toasts, removeToast } = useToast();
  const { canvasRef, celebrate } = useConfetti();

  // Initialize curriculum path from URL params
  useEffect(() => {
    if (grade && subject && topic && subtopic) {
      const path: CurriculumPath = { grade, subject, topic, subtopic };
      setCurriculumPath(path);
      sessionId.current = utils.generateSessionId(path);
      loadSubtopicContent(path);
    }
  }, [grade, subject, topic, subtopic]);

  // Load subtopic content from database
  const loadSubtopicContent = useCallback(async (path: CurriculumPath) => {
    setTutorState('loading');
    try {
      const content = await CurriculumAPI.getSimpleCurriculumContent(path);
      setSubtopicContent(content);
      setTutorState('idle');
    } catch (err) {
      console.error('Failed to load subtopic content:', err);
      error('Content Error', 'Failed to load learning content. Please try again.');
      setTutorState('idle');
    }
  }, [error]);

  const analytics = useAnalytics(sessionId.current, 'user_123'); // Replace with actual user ID

  // Reset session
  const handleResetSession = useCallback(() => {
    setMessages([]);
    setTutorState('idle');
    setOrbState('idle');
    setCheckpointState(null);
    setSessionData({
      totalTurns: 0,
      masteryScore: 0,
      conceptsLearned: [],
      timeSpent: 0
    });
    sessionStartTime.current = new Date();
    if (curriculumPath) {
      sessionId.current = utils.generateSessionId(curriculumPath);
    }
    success('Session reset', 'Ready for a fresh start!');
  }, [success, curriculumPath]);

  // Start session
  const handleStartSession = useCallback(async () => {
    if (!curriculumPath || !subtopicContent || messages.length > 0) return;
    
    setTutorState('chatting');
    setOrbState('thinking');
    setIsTyping(true);
    
    try {
      const response = await TutorAPI.postTurn({
        text: '',
        intent: 'start',
        subtopic_path: curriculumPath,
        session_id: sessionId.current,
        user_id: 'user_123' // Replace with actual user ID
      });

      // Add message immediately after API response
      setIsTyping(false);
      setOrbState('idle');
      
      const newMessage: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'tutor',
        text: response.tutor_message,
        intent: response.intent,
        timestamp: new Date(),
        isNew: true
      };
      
      setMessages([newMessage]);
      
    } catch (err) {
      setIsTyping(false);
      setOrbState('idle');
      error('Connection Error', 'Failed to start session. Please try again.');
    }
  }, [curriculumPath, subtopicContent, messages.length, error]);

  // Send message
  const handleSendMessage = useCallback(async (text: string) => {
    if (!curriculumPath || isTyping) return;

    // Add student message
    const studentMessage: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'student',
      text,
      timestamp: new Date(),
      isNew: true
    };

    setMessages(prev => [...prev, studentMessage]);
    setOrbState('thinking');
    setIsTyping(true);

    try {
      const response = await TutorAPI.postTurn({
        text,
        intent: 'respond',
        subtopic_path: curriculumPath,
        session_id: sessionId.current,
        user_id: 'user_123' // Replace with actual user ID
      });

      console.log('🔍 FRONTEND DEBUG - Full API response:', response);
      console.log('🎊 FRONTEND DEBUG - Topic completion flag:', response.topic_completed);

      // Update session data with simplified progress calculation
      // Use API mastery score as single source of truth
      const progressScore = Math.min(response.mastery_score || 0, 1);

      setSessionData(prev => ({
        ...prev,
        totalTurns: prev.totalTurns + 1,
        masteryScore: progressScore,
        conceptsLearned: [
          ...prev.conceptsLearned,
          ...response.concepts_learned || []
        ],
        timeSpent: Math.floor((new Date().getTime() - sessionStartTime.current.getTime()) / 60000)
      }));

      // Trigger confetti if progress reaches 100%
      if (progressScore >= 1 && response.intent !== 'reflect') {
        setTimeout(() => celebrate(), 800);
      }

      // Handle different response types
      setTimeout(() => {
        setIsTyping(false);

        if (response.intent === 'checkpoint' && response.checkpoint_items) {
          // Show checkpoint
          setCheckpointState({
            items: response.checkpoint_items,
            showResult: false
          });
          setTutorState('checkpoint');
          setOrbState('nudge');
        } else if (response.intent === 'reflect' || response.topic_completed) {
          // Session complete - triggered by either intent or completion flag
          console.log('🎊 FRONTEND DEBUG - Topic completion detected:', { 
            intent: response.intent, 
            topic_completed: response.topic_completed 
          });
          setTutorState('complete');
          setOrbState('celebrate');
          info('Great Job!', 'You\'ve completed this learning session!');
          // Trigger confetti celebration
          setTimeout(() => celebrate(), 500);
        } else {
          // Regular chat
          setOrbState(response.intent === 'hint' ? 'hint' : 'idle');
          
          const tutorMessage: ChatMessage = {
            id: Math.random().toString(36).slice(2),
            role: 'tutor',
            text: response.tutor_message,
            intent: response.intent,
            timestamp: new Date(),
            isNew: true
          };
          
          setMessages(prev => [...prev, tutorMessage]);
        }
      }, 1200 + Math.random() * 800); // Variable typing time

    } catch (err) {
      setIsTyping(false);
      setOrbState('idle');
      error('Message Failed', 'Unable to send message. Please try again.');
    }
  }, [curriculumPath, isTyping, error, info]);

  // Handle checkpoint answer
  const handleCheckpointAnswer = useCallback(async (choice: 'A' | 'B' | 'C' | 'D') => {
    if (!checkpointState || !curriculumPath) return;

    const isCorrect = choice === checkpointState.items[0].answer;

    // Update checkpoint state to show result
    setCheckpointState(prev => ({
      ...prev!,
      selectedChoice: choice,
      isCorrect,
      showResult: true
    }));

    // Continue session after delay
    setTimeout(async () => {
      try {
        const response = await TutorAPI.postTurn({
          text: `checkpoint_answer:${choice}`,
          intent: 'checkpoint_response',
          subtopic_path: curriculumPath,
          session_id: sessionId.current,
          user_id: 'user_123'
        });

        setCheckpointState(null);
        setTutorState('chatting');
        setOrbState('idle');

        const tutorMessage: ChatMessage = {
          id: Math.random().toString(36).slice(2),
          role: 'tutor',
          text: response.tutor_message,
          intent: response.intent,
          timestamp: new Date(),
          isNew: true
        };

        setMessages(prev => [...prev, tutorMessage]);

      } catch (err) {
        error('Checkpoint Error', 'Failed to process answer. Continuing session...');
        setCheckpointState(null);
        setTutorState('chatting');
        setOrbState('idle');
      }
    }, 3000);
  }, [checkpointState, curriculumPath, error]);

  // Continue learning after session complete - navigate back to chapter
  const handleContinueLearning = useCallback(() => {
    if (topic) {
      // Navigate back to the chapter page (e.g., /chapters/algebra)
      router.push(`/chapters/${topic}`);
    } else {
      // Fallback to topic selection if no topic available
      setTutorState('idle');
      setOrbState('idle');
      setCurriculumPath(null);
      setSubtopicContent(null);
      success('Ready to Continue', 'Choose another topic to keep learning!');
    }
  }, [router, topic, success]);
  
  // Restart current session
  const handleRestartSession = useCallback(() => {
    setTutorState('idle');
    setOrbState('idle');
    setCurriculumPath(null);
    setSubtopicContent(null);
    success('Ready to Continue', 'Choose another topic to keep learning!');
  }, [success]);

  // Auto-start session when content is loaded - using useRef to prevent multiple starts
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (curriculumPath && subtopicContent && messages.length === 0 && tutorState === 'idle' && !hasStartedRef.current) {
      hasStartedRef.current = true;
      handleStartSession();
    }
  }, [curriculumPath, subtopicContent, messages.length, tutorState, handleStartSession]);

  // If no curriculum path is set, show topic selection
  if (!curriculumPath || !subtopicContent) {
    return (
      <AppShell>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Learning Path
            </h1>
            <p className="text-lg text-muted mb-8">
              Select a topic and subtopic to begin your personalized learning journey
            </p>
          </div>
          
          {tutorState === 'loading' ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span className="ml-3 text-muted">Loading curriculum content...</span>
            </div>
          ) : (
            <TopicSelect />
          )}
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </AppShell>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden relative">
      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Header with breadcrumbs */}
      <div className="flex-shrink-0 bg-surface/30 backdrop-blur-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="text-muted hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              
              <div className="flex items-center space-x-2 text-sm text-muted">
                <span className="text-foreground font-medium">{subtopicContent.metadata.name}</span>
                <span className="hidden sm:inline text-xs bg-surface px-2 py-1 rounded-md">{subtopicContent.metadata.estimatedTime} min</span>
              </div>
            </div>

            {/* Floating Progress Indicator - Always visible to prevent layout shift */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-border"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeLinecap="round"
                    className="text-accent transition-all duration-500 ease-out"
                    strokeDasharray={`${sessionData.masteryScore * 251.2} 251.2`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold transition-all duration-500">
                    {Math.round(sessionData.masteryScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - uses remaining viewport height */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Chat messages area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-muted">Starting your learning session...</p>
              </div>
            </div>
          ) : (
            <ChatWindow messages={messages} isTyping={isTyping} />
          )}
        </div>

        {/* Checkpoint overlay */}
        <AnimatePresence>
          {checkpointState && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-6 z-40"
            >
              <CheckpointCard
                items={checkpointState.items}
                selectedChoice={checkpointState.selectedChoice}
                showResult={checkpointState.showResult}
                isCorrect={checkpointState.isCorrect}
                onSelect={handleCheckpointAnswer}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session complete overlay */}
        <AnimatePresence>
          {tutorState === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-6 z-40"
            >
              <SessionSummary
                masteryScore={sessionData.masteryScore}
                totalTurns={sessionData.totalTurns}
                timeSpent={sessionData.timeSpent}
                conceptsLearned={sessionData.conceptsLearned}
                topicName={subtopicContent.metadata.name}
                onRestart={handleRestartSession}
                onContinue={handleContinueLearning}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer - Always visible when session is active */}
        {(tutorState === 'chatting' || messages.length > 0) && (
          <div className="flex-shrink-0 bg-surface/30 px-4 sm:px-6 py-3 border-t border-border/20">
            <Composer
              onSend={handleSendMessage}
              disabled={isTyping}
              placeholder="Type your answer or question..."
            />
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TutorPageContent />
    </Suspense>
  );
}