import type { TutorSession, TutorTurn, SessionResult, MasteryStepProgress } from './types';

// Simple in-memory session store for testing
const sessions: Record<string, TutorSession> = {};

export class MockSessionManager {
  static async getOrCreateSession(
    uid: string,
    sessionId: string,
    topicKey: string
  ): Promise<SessionResult<TutorSession>> {
    
    // Check if session exists
    if (sessions[sessionId]) {
      return {
        success: true,
        data: sessions[sessionId]
      };
    }
    
    // Create new session
    const newSession: TutorSession = {
      uid,
      sessionId,
      topicKey,
      turns: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      masteryScore: 0,
      frustratedTurns: 0,
      currentHintLevel: 0,
      completed: false,
      currentMasteryStep: 1,
      masteryStepProgress: []
    };
    
    sessions[sessionId] = newSession;
    
    return {
      success: true,
      data: newSession
    };
  }
  
  static async addTurn(
    sessionId: string, 
    turn: Omit<TutorTurn, 'turnNumber' | 'timestamp'>
  ): Promise<SessionResult<TutorSession>> {
    if (!sessions[sessionId]) {
      return {
        success: false,
        errors: ['Session not found']
      };
    }
    
    const session = sessions[sessionId];
    const turnWithNumber: TutorTurn = {
      ...turn,
      turnNumber: session.turns.length + 1,
      timestamp: new Date()
    };
    
    session.turns.push(turnWithNumber);
    session.lastActivity = new Date();
    
    return { success: true, data: session };
  }
  
  static async updateProgress(
    sessionId: string,
    conceptsLearned: string[],
    masteryProgression?: any[],
    intent?: string,
    isStudentCompletion: boolean = false
  ): Promise<SessionResult<{ progressScore: number; currentStep: number; stepProgress: MasteryStepProgress[] }>> {
    if (!sessions[sessionId]) {
      return {
        success: false,
        errors: ['Session not found']
      };
    }
    
    const session = sessions[sessionId];
    
    // Handle step advancement from previous turn
    if (session.masteryStepProgress && session.masteryStepProgress.length > 0 && session.currentMasteryStep) {
      const currentStepIndex = session.currentMasteryStep - 1;
      if (currentStepIndex >= 0 && currentStepIndex < session.masteryStepProgress.length) {
        const currentStepProgress = session.masteryStepProgress[currentStepIndex];
        if (currentStepProgress.completed && session.currentMasteryStep < session.masteryStepProgress.length) {
          console.log(`🔄 STEP ADVANCEMENT - Moving from step ${session.currentMasteryStep} to ${session.currentMasteryStep + 1}`);
          session.currentMasteryStep = session.currentMasteryStep + 1;
        }
      }
    }
    
    // Initialize step progress if not exists
    console.log('🔍 MASTERY INIT - masteryProgression:', masteryProgression);
    console.log('🔍 MASTERY INIT - session.masteryStepProgress exists:', !!session.masteryStepProgress);
    
    if ((!session.masteryStepProgress || session.masteryStepProgress.length === 0) && masteryProgression && masteryProgression.length > 0) {
      console.log('🔍 PROGRESS INIT - Initializing step progress with', masteryProgression.length, 'steps');
      session.masteryStepProgress = masteryProgression.map((step) => ({
        step: step.step,
        concept: step.concept,
        questionsAsked: 0,
        questionsCompleted: 0,
        completed: false
      }));
      console.log('🔍 MASTERY INIT - Initialized step progress:', session.masteryStepProgress);
    } else {
      console.log('🔍 MASTERY INIT - Skipped initialization. Reasons:');
      console.log('  - masteryStepProgress exists:', !!session.masteryStepProgress);
      console.log('  - masteryProgression provided:', !!masteryProgression);
      console.log('  - masteryProgression length:', masteryProgression?.length || 0);
    }
    
    // Track questions based on whether this is student completion or tutor asking
    const isActualQuestion = intent === 'ask_question';
    console.log('🔍 INTENT CHECK - Intent:', intent, 'Is actual question:', isActualQuestion, 'Is student completion:', isStudentCompletion);
    
    if (session.masteryStepProgress && conceptsLearned.length > 0) {
      conceptsLearned.forEach(concept => {
        const stepIndex = session.masteryStepProgress!.findIndex(step => step.concept === concept);
        if (stepIndex !== -1) {
          const step = session.masteryStepProgress![stepIndex];
          
          if (isStudentCompletion) {
            // Student completed a question - increment completion counter
            step.questionsCompleted += 1;
            console.log(`🎓 STUDENT COMPLETED - ${concept}: ${step.questionsCompleted} questions completed`);
            
            // Check if step is completed based on completed questions
            const requiredQuestions = masteryProgression?.[stepIndex]?.question_count || 1;
            const wasCompleted = step.completed;
            step.completed = step.questionsCompleted >= requiredQuestions;
            
            if (!wasCompleted && step.completed && masteryProgression) {
              console.log(`🎉 STEP COMPLETED - Step ${step.step} completed with ${step.questionsCompleted} questions`);
            }
          } else if (isActualQuestion) {
            // Tutor asked a question - increment asked counter (for flow control)
            step.questionsAsked += 1;
            console.log(`❓ TUTOR ASKED - ${concept}: ${step.questionsAsked} questions asked`);
          } else {
            console.log(`🔍 INTENT IGNORED - ${concept}: ${intent} doesn't count as question`);
          }
        }
      });
    }
    
    // Calculate overall progress based on questions completed (Socratic learning)
    if (session.masteryStepProgress && session.masteryStepProgress.length > 0 && masteryProgression) {
      // Calculate progress based on questions completed vs total required
      let totalQuestionsCompleted = 0;
      let totalQuestionsRequired = 0;
      
      session.masteryStepProgress.forEach((step, index) => {
        const stepConfig = masteryProgression[index];
        const questionCount = stepConfig?.question_count || 1;
        
        totalQuestionsCompleted += Math.min(step.questionsCompleted, questionCount); // Cap at required
        totalQuestionsRequired += questionCount;
      });
      
      console.log('🔍 PROGRESS CALC - Questions completed:', totalQuestionsCompleted);
      console.log('🔍 PROGRESS CALC - Questions required:', totalQuestionsRequired);
      console.log('🔍 PROGRESS CALC - Step details:', session.masteryStepProgress.map(s => `${s.concept}: ${s.questionsCompleted} completed`));
      
      // Progress based on completion, not correctness (Socratic learning)
      session.masteryScore = totalQuestionsRequired > 0 ? (totalQuestionsCompleted / totalQuestionsRequired) : 0;
    } else {
      // Fallback to simple increment
      session.masteryScore = Math.min(1.0, session.masteryScore + (conceptsLearned.length * 0.1));
    }
    
    console.log('🔍 MASTERY UPDATE - Step progress:', session.masteryStepProgress);
    console.log('🔍 MASTERY UPDATE - Overall score:', session.masteryScore);
    
    return { 
      success: true, 
      data: {
        progressScore: session.masteryScore,
        currentStep: session.currentMasteryStep || 1,
        stepProgress: session.masteryStepProgress || []
      }
    };
  }
  
  static determineNextHintLevel(session: TutorSession): number {
    // Since we're not tracking correctness, hint level can gradually decrease
    // to encourage independence, or stay same for consistency
    return Math.max(0, session.currentHintLevel);
  }
  
  static detectFrustration(session: TutorSession, message: string): boolean {
    // Simple frustration detection
    const frustrationWords = ['stuck', 'confused', 'help', "don't understand", 'frustrated'];
    const messageText = message.toLowerCase();
    
    return frustrationWords.some(word => messageText.includes(word)) || 
           session.frustratedTurns > 2;
  }
  
  /**
   * Check if topic is mastered based on completion policy
   */
  static checkTopicCompletion(
    session: TutorSession, 
    completionPolicy: { requires_all_steps: boolean; total_questions?: number }
  ): boolean {
    console.log('🔍 COMPLETION CHECK - Starting check');
    console.log('  - Total turns:', session.turns.length);
    console.log('  - Total questions required:', completionPolicy.total_questions || 'not specified');
    console.log('  - Requires all steps:', completionPolicy.requires_all_steps);
    
    // Check minimum total questions requirement if specified
    if (completionPolicy.total_questions && session.turns.length < completionPolicy.total_questions) {
      console.log('🔍 COMPLETION CHECK - FAILED: Not enough total turns');
      return false;
    }

    // If no step progress data, fall back to simple score check
    if (!session.masteryStepProgress || session.masteryStepProgress.length === 0) {
      console.log('🔍 COMPLETION CHECK - Using simple score fallback:', session.masteryScore);
      return session.masteryScore >= 0.8;
    }

    console.log('🔍 COMPLETION CHECK - Step completion status:');
    session.masteryStepProgress.forEach((step) => {
      console.log(`  Step ${step.step}: ${step.completed ? 'COMPLETED' : 'PENDING'} (${step.questionsAsked} questions)`);
    });

    // Step-based completion logic (question count only)
    if (completionPolicy.requires_all_steps) {
      // All steps must be completed (no mastery requirement)
      const allCompleted = session.masteryStepProgress.every(step => step.completed);
      console.log('🔍 COMPLETION CHECK - All steps completed:', allCompleted);
      return allCompleted;
    } else {
      // At least 80% of steps completed
      const completedSteps = session.masteryStepProgress.filter(step => step.completed).length;
      const totalSteps = session.masteryStepProgress.length;
      const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) : 0;
      console.log('🔍 COMPLETION CHECK - Progress:', completedSteps, '/', totalSteps, '=', overallProgress);
      return overallProgress >= 0.8;
    }
  }
  
  /**
   * Check if we should continue asking questions for a specific concept
   */
  static shouldContinueAskingQuestions(
    session: TutorSession,
    concept: string,
    masteryProgression?: any[]
  ): boolean {
    if (!session.masteryStepProgress || !masteryProgression) {
      return true; // Continue if no step data available
    }

    const stepProgress = session.masteryStepProgress.find(step => step.concept === concept);
    if (!stepProgress) {
      return true; // Continue if step not found
    }

    const stepConfig = masteryProgression.find(step => step.concept === concept);
    if (!stepConfig) {
      return true; // Continue if config not found
    }

    const maxQuestions = stepConfig.max_questions || stepConfig.min_questions;
    const hasReachedMax = stepProgress.questionsAsked >= maxQuestions;
    
    console.log(`🔍 QUESTION LIMIT CHECK - ${concept}:`);
    console.log(`  Asked: ${stepProgress.questionsAsked}, Max: ${maxQuestions}`);
    console.log(`  Should continue: ${!hasReachedMax}`);
    
    return !hasReachedMax;
  }

  /**
   * Mark session as completed
   */
  static async completeSession(sessionId: string): Promise<SessionResult<boolean>> {
    if (!sessions[sessionId]) {
      return {
        success: false,
        errors: ['Session not found']
      };
    }
    
    sessions[sessionId].completed = true;
    sessions[sessionId].lastActivity = new Date();
    
    return { success: true, data: true };
  }
}