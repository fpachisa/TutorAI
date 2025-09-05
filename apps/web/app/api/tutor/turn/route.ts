import { NextRequest, NextResponse } from 'next/server';
import { VertexAIClient } from '@/lib/tutor/vertexClient';
import { MockSessionManager as SessionManager } from '@/lib/tutor/mockSessionManager';
import { SafetySystem } from '@/lib/tutor/safety';
import { PromptBuilder } from '@/lib/tutor/promptBuilder';
import { getTopicConfig } from '@/lib/tutor/topicConfigs';
import { CurriculumAPI, type CurriculumPath, type Intent } from '@/lib/api';
import type { 
  TutorTurnRequest, 
  TutorTurnResponse,
  TutorSession,
  PromptContext 
} from '@/lib/tutor/types';
import { 
  curriculumPathToTopicKey,
  topicKeyToCurriculumPath
} from '@/lib/tutor/types';
import { withCors, preflight } from '../../_lib/cors';

export async function OPTIONS() { return preflight(); }

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request
    const body = await request.json();
    
    // Support both old TurnRequest and new TutorTurnRequest formats
    let turnRequest: TutorTurnRequest;
    
    // Check if this is the old format (text, user_id, session_id, subtopic_path)
    if ('text' in body && 'user_id' in body && 'session_id' in body) {
      // Convert old format to new format
      turnRequest = {
        uid: body.user_id,
        sessionId: body.session_id,
        studentMessage: body.text,
        intent: body.intent,
        curriculumPath: body.subtopic_path,
        topicKey: body.subtopic_path ? curriculumPathToTopicKey(body.subtopic_path) : undefined
      };
    } else {
      // Use new format directly
      turnRequest = body as TutorTurnRequest;
    }
    
    // Ensure we have either curriculumPath or topicKey
    if (!turnRequest.topicKey && turnRequest.curriculumPath) {
      turnRequest.topicKey = curriculumPathToTopicKey(turnRequest.curriculumPath);
    }
    
    // Validate required fields (allow empty studentMessage for 'start' intent)
    if (!turnRequest.uid || !turnRequest.sessionId || !turnRequest.topicKey) {
      return withCors(NextResponse.json({
        success: false,
        error: 'Invalid request format. Missing required fields: uid, sessionId, or topicKey'
      }, { status: 400 }));
    }
    
    // For start intent, we can have empty studentMessage
    if (!turnRequest.studentMessage && turnRequest.intent && turnRequest.intent !== 'start' as any) {
      return withCors(NextResponse.json({
        success: false,
        error: 'Invalid request format. Missing studentMessage'
      }, { status: 400 }));
    }
    
    // Sanitize student input (handle empty message for start intent)
    const sanitizedMessage = SafetySystem.sanitizeStudentInput(turnRequest.studentMessage || '');
    
    // Get or create session
    const sessionResult = await SessionManager.getOrCreateSession(
      turnRequest.uid,
      turnRequest.sessionId,
      turnRequest.topicKey
    );
    
    if (!sessionResult.success || !sessionResult.data) {
      return withCors(NextResponse.json({
        success: false,
        error: `Failed to get session: ${sessionResult.errors?.join(', ') || 'Unknown error'}`
      }, { status: 500 }));
    }
    
    const session: TutorSession = sessionResult.data;
    
    // Detect frustration
    const detectedFrustration = SafetySystem.detectFrustration(sanitizedMessage) || 
                                SessionManager.detectFrustration(session, sanitizedMessage);
    
    // Determine hint level
    const hintLevel = SessionManager.determineNextHintLevel(session); // Will be updated based on response
    
    // Parse topic key to get curriculum path
    const curriculumPath = turnRequest.curriculumPath || topicKeyToCurriculumPath(turnRequest.topicKey);
    
    // Get topic configuration
    const topicConfig = getTopicConfig(curriculumPath);
    
    // Load simplified curriculum data - fail if not available
    const curriculumData = await CurriculumAPI.getSimpleCurriculumContent(curriculumPath);
    
    // Store current step info for later student completion processing
    let currentStepInfo;
    if (session.turns.length > 0 && session.masteryStepProgress && session.masteryStepProgress.length > 0) {
      const currentStepIndex = (session.currentMasteryStep || 1) - 1;
      if (currentStepIndex >= 0 && currentStepIndex < session.masteryStepProgress.length) {
        currentStepInfo = {
          concept: session.masteryStepProgress[currentStepIndex].concept,
          stepIndex: currentStepIndex
        };
      }
    }
    
    // Build prompt context
    const promptContext: PromptContext = {
      topicConfig,
      sessionContext: session,
      studentMessage: sanitizedMessage,
      turnCount: session.turns.length + 1,
      hintLevel,
      detectedFrustration,
      curriculumData
    };
    
    // Generate AI response
    const vertexClient = new VertexAIClient();
    const systemPrompt = PromptBuilder.buildPrompt(promptContext, sanitizedMessage);
    
    const aiResponse = await vertexClient.generateResponse(systemPrompt);
    
    // Pure AI-driven: if AI fails, everything fails
    if (!aiResponse.success || !aiResponse.data) {
      throw new Error(`AI generation failed: ${aiResponse.errors?.join(', ') || 'Unknown error'}`);
    }
    
    const finalTutorMessage = aiResponse.data.tutor_message;
    
    // No longer tracking correctness in simplified system
    const finalHintLevel = SessionManager.determineNextHintLevel(session);
    
    // Create turn record
    const turnRecord = {
      studentMessage: sanitizedMessage,
      tutorMessage: finalTutorMessage,
      intent: aiResponse.data.intent,
      conceptTags: aiResponse.data.concept_tags,
      hintLevel: finalHintLevel,
      masteryGained: [], // Would be populated based on learning assessment
      studentFrustrated: detectedFrustration,
      studentCorrect: aiResponse.data.student_correct
    };
    
    // Add turn to session
    const addTurnResult = await SessionManager.addTurn(turnRequest.sessionId, turnRecord);
    
    if (!addTurnResult.success) {
      console.error('Failed to add turn to session:', addTurnResult.errors);
      // Continue with response even if session update failed
    }
    
    // Handle student completion AFTER AI response (to use correctness)
    let studentCompletionResult;
    if (currentStepInfo) {
      console.log('🎓 API DEBUG - Student completed question for concept:', currentStepInfo.concept, 'with correctness:', aiResponse.data.student_correct);
      studentCompletionResult = await SessionManager.updateProgress(
        turnRequest.sessionId,
        [currentStepInfo.concept],
        curriculumData.mastery_progression,
        'student_response',
        true, // isStudentCompletion = true
        aiResponse.data.student_correct // studentCorrect from AI
      );
      console.log('🎓 API DEBUG - Student completion result:', studentCompletionResult);
    }

    // Update progress for tutor asking questions
    let tutorQuestionResult;
    if (aiResponse.data.concept_tags && aiResponse.data.concept_tags.length > 0) {
      console.log('❓ API DEBUG - Processing tutor question concept tags:', aiResponse.data.concept_tags, 'intent:', aiResponse.data.intent);
      tutorQuestionResult = await SessionManager.updateProgress(
        turnRequest.sessionId, 
        aiResponse.data.concept_tags,
        curriculumData.mastery_progression,
        aiResponse.data.intent,
        false, // isStudentCompletion = false (tutor asking)
        false // studentCorrect = false (not applicable for tutor questions)
      );
      console.log('❓ API DEBUG - Tutor question result:', tutorQuestionResult);
    } else {
      console.log('🔍 API DEBUG - No concept tags found, skipping tutor question tracking');
    }
    
    // Use student completion result for progress display (if available), otherwise tutor result
    const progressResult = studentCompletionResult || tutorQuestionResult;
    
    // Check if topic is completed
    const updatedSession = addTurnResult.data || session;
    const isTopicCompleted = SessionManager.checkTopicCompletion(updatedSession, curriculumData.completion_policy);
    
    if (isTopicCompleted && !updatedSession.completed) {
      await SessionManager.completeSession(turnRequest.sessionId);
      console.log('🎊 COMPLETION DEBUG - Topic completed! Setting completion flag for frontend celebration');
    }
    
    // Build response
    const response: TutorTurnResponse = {
      success: true,
      tutor_message: finalTutorMessage,
      intent: aiResponse.data.intent as Intent,
      concept_tags: aiResponse.data.concept_tags,
      hint_level: finalHintLevel,
      session_id: turnRequest.sessionId,
      mastery_score: progressResult?.data?.progressScore || session.masteryScore,
      current_mastery_step: progressResult?.data?.currentStep || session.currentMasteryStep,
      mastery_step_progress: progressResult?.data?.stepProgress || session.masteryStepProgress,
      student_frustrated: detectedFrustration,
      topic_completed: isTopicCompleted // NEW: Signal completion to frontend
    };
    
    const processingTime = Date.now() - startTime;
    console.log(`[TutorAPI] Turn processed in ${processingTime}ms`);
    
    return withCors(NextResponse.json(response));
    
  } catch (error) {
    console.error('❌ [TutorAPI] Turn processing failed:', error);
    
    // Pure AI-driven: no fallbacks, just fail
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return withCors(NextResponse.json({
      success: false,
      error: `AI-driven tutoring failed: ${errorMessage}`
    }, { status: 500 }));
  }
}


/**
 * Handle GET requests (for health checks)
 */
export async function GET() {
  return withCors(NextResponse.json({
    status: 'healthy',
    service: 'tutor-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }));
}
