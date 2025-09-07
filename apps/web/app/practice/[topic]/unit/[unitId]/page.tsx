'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Target, Trophy, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useConfetti } from '@/lib/confetti';

interface Question {
  id: number;
  subtopic: string;
  difficulty: string;
  story_context: string;
  question: string;
  type: 'multiple_choice' | 'short_answer';
  choices?: string[];
  correct_answer: string;
  alternative_answers?: string[];
  explanation: string;
  points: number;
}

interface UnitData {
  unit_id: number;
  story_theme: {
    title: string;
    emoji: string;
    intro: string;
    context: string;
  };
  questions: Question[];
  completion_criteria: {
    minimum_score: number;
    questions_required: number;
  };
  rewards: {
    completion_xp: number;
    perfect_score_bonus: number;
    achievement_unlocked: string;
  };
}

interface PracticeData {
  topic: string;
  units: UnitData[];
}

type SessionState = 'intro' | 'practicing' | 'complete';

function PracticeUnitContent() {
  const params = useParams();
  const router = useRouter();
  const topic = params.topic as string;
  const unitId = params.unitId as string;
  
  const [unitData, setUnitData] = useState<UnitData | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { canvasRef, celebrate } = useConfetti();

  useEffect(() => {
    loadUnitData();
  }, [topic, unitId]);

  const loadUnitData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/curriculum/primary-6/mathematics/${topic}-practice.json`);
      if (!response.ok) {
        throw new Error(`Practice data for ${topic} not found`);
      }
      const practiceData: PracticeData = await response.json();
      
      const unit = practiceData.units.find(u => u.unit_id === parseInt(unitId));
      if (!unit) {
        throw new Error(`Unit ${unitId} not found`);
      }
      
      setUnitData(unit);
    } catch (err) {
      console.error('Failed to load unit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load practice unit');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    setSessionState('practicing');
  };

  const checkAnswer = useCallback(() => {
    if (!unitData) return;
    
    const currentQuestion = unitData.questions[currentQuestionIndex];
    const answer = currentQuestion.type === 'multiple_choice' ? selectedChoice : userAnswer;
    
    if (!answer) return;

    // Check if answer is correct
    const isAnswerCorrect = 
      answer === currentQuestion.correct_answer ||
      (currentQuestion.alternative_answers?.includes(answer) || false);

    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    if (isAnswerCorrect) {
      setScore(prev => prev + currentQuestion.points);
      setCorrectAnswers(prev => prev + 1);
    }
  }, [unitData, currentQuestionIndex, selectedChoice, userAnswer]);

  const nextQuestion = useCallback(() => {
    if (!unitData) return;

    if (currentQuestionIndex < unitData.questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setSelectedChoice(null);
      setShowFeedback(false);
    } else {
      // Complete the session
      setSessionState('complete');
      
      // Trigger celebration if score is good
      const finalScore = (correctAnswers / unitData.questions.length) * 100;
      if (finalScore >= unitData.completion_criteria.minimum_score) {
        setTimeout(() => celebrate(), 500);
      }
    }
  }, [unitData, currentQuestionIndex, correctAnswers, celebrate]);

  const restartUnit = () => {
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setSelectedChoice(null);
    setShowFeedback(false);
    setScore(0);
    setCorrectAnswers(0);
    setSessionState('intro');
  };

  const backToPath = () => {
    router.push(`/practice/${topic}`);
  };

  if (loading) {
    return (
      <AppShell showParticles={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted">Loading practice unit...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !unitData) {
    return (
      <AppShell showParticles={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="text-danger mb-4">⚠️</div>
          <h1 className="text-2xl font-heading font-bold text-tutor mb-4">Unit Not Found</h1>
          <p className="text-muted mb-6">{error}</p>
          <button onClick={backToPath} className="btn btn-primary">
            Back to Practice Path
          </button>
        </div>
      </AppShell>
    );
  }

  const currentQuestion = unitData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / unitData.questions.length) * 100;
  const finalScore = Math.round((correctAnswers / unitData.questions.length) * 100);

  return (
    <div className="min-h-screen bg-bg relative">
      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Header */}
      <div className="bg-surface/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={backToPath}
              className="flex items-center gap-2 text-muted hover:text-accent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Path</span>
            </button>

            {sessionState === 'practicing' && (
              <div className="flex items-center gap-4">
                {/* Progress Bar */}
                <div className="w-32 h-2 bg-surfaceAlt rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-sm text-muted">
                  {currentQuestionIndex + 1}/{unitData.questions.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Intro State */}
        {sessionState === 'intro' && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">{unitData.story_theme.emoji}</div>
            <h1 className="text-3xl font-heading font-bold gradient-text mb-4">
              {unitData.story_theme.title}
            </h1>
            <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
              {unitData.story_theme.context}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-surface border border-border rounded-xl">
                <Target className="w-6 h-6 text-accent mx-auto mb-2" />
                <div className="font-semibold text-tutor">{unitData.questions.length}</div>
                <div className="text-sm text-muted">Questions</div>
              </div>
              
              <div className="p-4 bg-surface border border-border rounded-xl">
                <Trophy className="w-6 h-6 text-warn mx-auto mb-2" />
                <div className="font-semibold text-tutor">{unitData.completion_criteria.minimum_score}%</div>
                <div className="text-sm text-muted">To Pass</div>
              </div>
              
              <div className="p-4 bg-surface border border-border rounded-xl">
                <Clock className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="font-semibold text-tutor">~15</div>
                <div className="text-sm text-muted">Minutes</div>
              </div>
            </div>

            <motion.button
              onClick={handleStartPractice}
              className="btn btn-primary btn-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Adventure
            </motion.button>
          </motion.div>
        )}

        {/* Practice State */}
        {sessionState === 'practicing' && currentQuestion && (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl mx-auto"
          >
            {/* Story Context */}
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-2">
                {currentQuestion.story_context}
              </span>
            </div>

            {/* Question */}
            <div className="bg-surface border border-border rounded-xl p-6 mb-6">
              <p className="text-lg text-tutor leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Input */}
            <div className="mb-6">
              {currentQuestion.type === 'multiple_choice' ? (
                <div className="space-y-3">
                  {currentQuestion.choices?.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => !showFeedback && setSelectedChoice(choice)}
                      disabled={showFeedback}
                      className={`
                        w-full p-4 text-left border rounded-xl transition-all
                        ${selectedChoice === choice
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-surface hover:border-accent/40'
                        }
                        ${showFeedback && choice === currentQuestion.correct_answer
                          ? 'border-success bg-success/10 text-success'
                          : ''
                        }
                        ${showFeedback && selectedChoice === choice && !isCorrect
                          ? 'border-danger bg-danger/10 text-danger'
                          : ''
                        }
                      `}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => !showFeedback && setUserAnswer(e.target.value)}
                  disabled={showFeedback}
                  placeholder="Type your answer..."
                  className="w-full p-4 border border-border rounded-xl bg-surface text-tutor"
                  onKeyPress={(e) => e.key === 'Enter' && !showFeedback && checkAnswer()}
                />
              )}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl mb-6 ${
                    isCorrect ? 'bg-success/10 border border-success/20' : 'bg-danger/10 border border-danger/20'
                  }`}
                >
                  <div className={`font-semibold mb-2 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                    {isCorrect ? '🎉 Correct!' : '❌ Not quite right'}
                  </div>
                  <p className="text-sm text-muted">
                    {currentQuestion.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex justify-center">
              {!showFeedback ? (
                <button
                  onClick={checkAnswer}
                  disabled={currentQuestion.type === 'multiple_choice' ? !selectedChoice : !userAnswer}
                  className="btn btn-primary"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="btn btn-primary"
                >
                  {currentQuestionIndex < unitData.questions.length - 1 ? 'Next Question' : 'Complete Unit'}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Complete State */}
        {sessionState === 'complete' && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-6xl mb-4">
              {finalScore >= unitData.completion_criteria.minimum_score ? '🎉' : '💪'}
            </div>
            
            <h1 className="text-3xl font-heading font-bold gradient-text mb-4">
              {finalScore >= unitData.completion_criteria.minimum_score 
                ? `${unitData.story_theme.title} Complete!`
                : 'Good Try!'
              }
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-2xl font-bold text-accent">{finalScore}%</div>
                <div className="text-sm text-muted">Final Score</div>
              </div>
              
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-2xl font-bold text-success">{correctAnswers}</div>
                <div className="text-sm text-muted">Correct Answers</div>
              </div>
              
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-2xl font-bold text-warn">{score}</div>
                <div className="text-sm text-muted">Points Earned</div>
              </div>
            </div>

            {finalScore >= unitData.completion_criteria.minimum_score && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl mb-8">
                <div className="text-success font-semibold mb-2">🏆 Achievement Unlocked!</div>
                <div className="text-sm text-muted">{unitData.rewards.achievement_unlocked}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={restartUnit}
                className="btn btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={backToPath}
                className="btn btn-primary"
              >
                Continue Path
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function PracticeUnitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PracticeUnitContent />
    </Suspense>
  );
}