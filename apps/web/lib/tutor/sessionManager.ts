import { getAdminDb } from '../firebaseAdmin';
import type { TutorSession, TutorTurn, SessionResult, MasteryStepProgress } from './types';

const db = getAdminDb();

export class SessionManager {
  /**
   * Get existing session or create a new one
   */
  static async getOrCreateSession(
    uid: string, 
    sessionId: string, 
    topicKey: string
  ): Promise<SessionResult<TutorSession>> {
    try {
      const sessionRef = db.collection('tutorSessions').doc(sessionId);
      const sessionSnap = await sessionRef.get();
      
      if (sessionSnap.exists) {
        const sessionData = sessionSnap.data();
        
        if (!sessionData) {
          throw new Error('Session document exists but data is undefined');
        }
        
        // Convert Firestore timestamps back to Date objects
        const session: TutorSession = {
          uid: sessionData.uid,
          sessionId: sessionData.sessionId,
          topicKey: sessionData.topicKey,
          turns: sessionData.turns?.map((turn: any) => ({
            ...turn,
            timestamp: turn.timestamp?.toDate ? turn.timestamp.toDate() : (turn.timestamp || new Date())
          })) || [],
          createdAt: sessionData.createdAt?.toDate ? sessionData.createdAt.toDate() : (sessionData.createdAt || new Date()),
          lastActivity: sessionData.lastActivity?.toDate ? sessionData.lastActivity.toDate() : (sessionData.lastActivity || new Date()),
          masteryScore: sessionData.masteryScore || 0,
          frustratedTurns: sessionData.frustratedTurns || 0,
          currentHintLevel: sessionData.currentHintLevel || 0,
          completed: sessionData.completed || false,
          currentMasteryStep: sessionData.currentMasteryStep || 1,
          masteryStepProgress: sessionData.masteryStepProgress || []
        };
        
        return { success: true, data: session };
      } else {
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
        
        // Save to Firestore
        await sessionRef.set({
          ...newSession,
          createdAt: newSession.createdAt,
          lastActivity: newSession.lastActivity
        });
        
        return { success: true, data: newSession };
      }
    } catch (error) {
      console.error('SessionManager: Failed to get/create session:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown session error']
      };
    }
  }
  
  /**
   * Add a new turn to the session
   */
  static async addTurn(
    sessionId: string,
    turn: Omit<TutorTurn, 'turnNumber' | 'timestamp'>
  ): Promise<SessionResult<TutorSession>> {
    try {
      const sessionRef = db.collection('tutorSessions').doc(sessionId);
      const sessionSnap = await sessionRef.get();
      
      if (!sessionSnap.exists) {
        return {
          success: false,
          errors: ['Session not found']
        };
      }
      
      const sessionData = sessionSnap.data();
      if (!sessionData) {
        return {
          success: false,
          errors: ['Session data is undefined']
        };
      }
      
      const currentTurns = sessionData.turns || [];
      
      // Create new turn with proper numbering
      const newTurn: TutorTurn = {
        ...turn,
        turnNumber: currentTurns.length + 1,
        timestamp: new Date()
      };
      
      // Update turns array
      const updatedTurns = [...currentTurns, newTurn];
      
      // Update session with new turn
      await sessionRef.update({
        turns: updatedTurns,
        lastActivity: new Date(),
        currentHintLevel: turn.hintLevel,
        frustratedTurns: turn.studentFrustrated 
          ? (sessionData.frustratedTurns || 0) + 1 
          : sessionData.frustratedTurns || 0
      });
      
      // Return updated session
      const updatedSessionSnap = await sessionRef.get();
      const updatedSessionData = updatedSessionSnap.data()!;
      
      const session: TutorSession = {
        uid: updatedSessionData.uid,
        sessionId: updatedSessionData.sessionId,
        topicKey: updatedSessionData.topicKey,
        turns: updatedSessionData.turns?.map((t: any) => ({
          ...t,
          timestamp: t.timestamp?.toDate ? t.timestamp.toDate() : (t.timestamp || new Date())
        })) || [],
        createdAt: updatedSessionData.createdAt?.toDate ? updatedSessionData.createdAt.toDate() : (updatedSessionData.createdAt || new Date()),
        lastActivity: updatedSessionData.lastActivity?.toDate ? updatedSessionData.lastActivity.toDate() : (updatedSessionData.lastActivity || new Date()),
        masteryScore: updatedSessionData.masteryScore || 0,
        frustratedTurns: updatedSessionData.frustratedTurns || 0,
        currentHintLevel: updatedSessionData.currentHintLevel || 0,
        completed: updatedSessionData.completed || false,
        currentMasteryStep: updatedSessionData.currentMasteryStep || 1,
        masteryStepProgress: updatedSessionData.masteryStepProgress || []
      };
      
      return { success: true, data: session };
      
    } catch (error) {
      console.error('SessionManager: Failed to add turn:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown turn addition error']
      };
    }
  }
  
  /**
   * Update progress based on student questions asked - simplified approach
   */
  static async updateProgress(
    sessionId: string,
    conceptsLearned: string[],
    masteryProgression?: any[],
    intent?: string,
    isStudentCompletion: boolean = false,
    studentCorrect: boolean = false
  ): Promise<SessionResult<{ progressScore: number; currentStep: number; stepProgress: MasteryStepProgress[] }>> {
    try {
      const sessionRef = db.collection('tutorSessions').doc(sessionId);
      const sessionSnap = await sessionRef.get();
      
      if (!sessionSnap.exists) {
        return {
          success: false,
          errors: ['Session not found']
        };
      }
      
      const sessionData = sessionSnap.data();
      if (!sessionData) {
        return {
          success: false,
          errors: ['Session data is undefined']
        };
      }
      
      let currentStep = sessionData.currentMasteryStep || 1;
      let stepProgress: MasteryStepProgress[] = sessionData.masteryStepProgress || [];
      
      // Initialize step progress if needed
      if (masteryProgression && stepProgress.length === 0) {
        stepProgress = masteryProgression.map((step, index) => ({
          step: step.step,
          concept: step.concept,
          questionsAsked: 0,
          questionsCompleted: 0,
          completed: false
        }));
      }
      
      // Track questions based on whether this is student completion or tutor asking
      const isActualQuestion = intent === 'ask_question';
      
      if (stepProgress.length > 0) {
        conceptsLearned.forEach(concept => {
          const stepIndex = stepProgress.findIndex(sp => sp.concept === concept);
          if (stepIndex >= 0) {
            const step = stepProgress[stepIndex];
            
            if (isStudentCompletion && studentCorrect) {
              // Student completed a question correctly - increment completion counter
              step.questionsCompleted += 1;
              
              // Check if step is completed based on completed questions
              const requiredQuestions = masteryProgression?.[stepIndex]?.question_count || 1;
              step.completed = step.questionsCompleted >= requiredQuestions;
              
              // Advance to next step if completed and not already at last step
              if (step.completed && currentStep <= stepIndex + 1 && currentStep < stepProgress.length) {
                currentStep = Math.min(stepIndex + 2, stepProgress.length);
              }
            } else if (isActualQuestion) {
              // Tutor asked a question - increment asked counter (for flow control)
              step.questionsAsked += 1;
            }
          }
        });
      }
      
      // Calculate overall progress score based on questions completed
      const totalQuestionsCompleted = stepProgress.reduce((sum, step) => sum + step.questionsCompleted, 0);
      const totalQuestionsRequired = masteryProgression ? 
        masteryProgression.reduce((sum, step) => sum + (step.question_count || 1), 0) : 0;
      const progressScore = totalQuestionsRequired > 0 ? totalQuestionsCompleted / totalQuestionsRequired : 0;
      
      await sessionRef.update({
        masteryScore: progressScore,
        currentMasteryStep: currentStep,
        masteryStepProgress: stepProgress,
        lastActivity: new Date()
      });
      
      return { 
        success: true, 
        data: {
          progressScore,
          currentStep,
          stepProgress
        }
      };
      
    } catch (error) {
      console.error('SessionManager: Failed to update progress score:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown progress update error']
      };
    }
  }
  
  /**
   * Determine next hint level based on student performance
   */
  static determineNextHintLevel(session: TutorSession, isCorrect: boolean): number {
    const currentLevel = session.currentHintLevel;
    const recentTurns = session.turns.slice(-2); // Last 2 turns
    
    if (isCorrect) {
      // Student got it right - can reduce hint level
      return Math.max(0, currentLevel - 1);
    } else {
      // Student made mistake - increase hint level
      const recentMistakes = recentTurns.filter(turn => 
        turn.studentFrustrated || turn.hintLevel > 0
      ).length;
      
      if (recentMistakes >= 2) {
        // Two mistakes in a row - significant scaffolding needed
        return Math.min(3, currentLevel + 2);
      } else {
        // Single mistake - slight increase
        return Math.min(3, currentLevel + 1);
      }
    }
  }
  
  /**
   * Check if student is showing signs of frustration
   */
  static detectFrustration(session: TutorSession, studentMessage: string): boolean {
    // Check recent frustrated turns
    if (session.frustratedTurns >= 2) {
      return true;
    }
    
    // Check for frustration keywords
    const frustrationKeywords = [
      'i don\'t know',
      'i\'m confused',
      'this is hard',
      'i\'m stuck',
      'i give up',
      'confused',
      'difficult',
      'don\'t understand'
    ];
    
    const lowerMessage = studentMessage.toLowerCase();
    const containsFrustrationWords = frustrationKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    // Check for very short responses (might indicate disengagement)
    const isVeryShortResponse = studentMessage.trim().length < 5;
    
    // Check recent turn pattern (multiple short responses)
    const recentTurns = session.turns.slice(-3);
    const recentShortResponses = recentTurns.filter(turn => 
      turn.studentMessage.trim().length < 10
    ).length;
    
    return containsFrustrationWords || 
           (isVeryShortResponse && recentShortResponses >= 2);
  }
  
  /**
   * Check if topic is completed based on simplified completion policy
   */
  static checkTopicCompletion(
    session: TutorSession, 
    completionPolicy: { requires_all_steps: boolean; total_questions?: number }
  ): boolean {
    if (!session.masteryStepProgress || session.masteryStepProgress.length === 0) {
      return false;
    }
    
    // Check if all steps are completed
    if (completionPolicy.requires_all_steps) {
      const allStepsCompleted = session.masteryStepProgress.every(step => step.completed);
      return allStepsCompleted;
    }
    
    // Optional: Check minimum total questions if specified
    if (completionPolicy.total_questions) {
      const totalQuestions = session.masteryStepProgress.reduce((sum, step) => sum + step.questionsAsked, 0);
      return totalQuestions >= completionPolicy.total_questions;
    }
    
    return false;
  }
  
  /**
   * Mark session as completed
   */
  static async completeSession(sessionId: string): Promise<SessionResult<boolean>> {
    try {
      const sessionRef = db.collection('tutorSessions').doc(sessionId);
      
      await sessionRef.update({
        completed: true,
        lastActivity: new Date()
      });
      
      return { success: true, data: true };
      
    } catch (error) {
      console.error('SessionManager: Failed to complete session:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown completion error']
      };
    }
  }
  
  /**
   * Get session statistics
   */
  static getSessionStats(session: TutorSession): {
    totalTurns: number;
    averageHintLevel: number;
    masteryScore: number;
    sessionDuration: number; // in minutes
  } {
    const totalTurns = session.turns.length;
    const averageHintLevel = totalTurns > 0 
      ? session.turns.reduce((sum, turn) => sum + turn.hintLevel, 0) / totalTurns
      : 0;
    
    const sessionDuration = Math.round(
      (session.lastActivity.getTime() - session.createdAt.getTime()) / (1000 * 60)
    );
    
    return {
      totalTurns,
      averageHintLevel,
      masteryScore: session.masteryScore,
      sessionDuration
    };
  }
}