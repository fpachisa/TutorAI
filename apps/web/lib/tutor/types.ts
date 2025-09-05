import type { CurriculumPath, Intent, SimpleCurriculumContent } from '../api';

// TypeScript interfaces for TutorAI system - Unified architecture

export interface TutorTurnRequest {
  // Core identifiers
  uid: string;
  sessionId: string;
  
  // Curriculum context - support both formats for flexibility
  curriculumPath?: CurriculumPath;  // Structured curriculum path
  topicKey?: string;                // Flattened topic key (generated from curriculumPath)
  
  // Student input
  studentMessage: string;
  intent?: Intent;                  // Optional intent from frontend
  
  // Metadata
  metadata?: {
    clientTs?: number;
    userAgent?: string;
  };
}

export interface TutorTurnResponse {
  success: boolean;
  tutor_message: string;
  intent: Intent;
  concept_tags: string[];
  hint_level: number;
  session_id: string;
  mastery_score: number;
  current_mastery_step?: number;
  mastery_step_progress?: MasteryStepProgress[];
  student_frustrated?: boolean;
  topic_completed?: boolean; // NEW: Signals topic completion for celebration
  safety_violations?: string[];
  error?: string;
}

export interface MasteryStepProgress {
  step: number;
  concept: string;
  questionsAsked: number;
  questionsCompleted: number;
  completed: boolean;
}

export interface TutorSession {
  uid: string;
  sessionId: string;
  topicKey: string;
  turns: TutorTurn[];
  createdAt: Date;
  lastActivity: Date;
  masteryScore: number;
  frustratedTurns: number;
  currentHintLevel: number;
  completed: boolean;
  currentMasteryStep?: number;
  masteryStepProgress?: MasteryStepProgress[];
}

export interface TutorTurn {
  turnNumber: number;
  studentMessage: string;
  tutorMessage: string;
  intent: string;
  conceptTags: string[];
  hintLevel: number;
  timestamp: Date;
  masteryGained: string[];
  studentFrustrated?: boolean;
}

export interface TopicConfig {
  name: string;
  description: string;
  syllabusCodes: string[];
  objectives: string[];
  commonMisconceptions: string[];
  socraticPrompts: string[];
  difficultyProgression: string[];
  realWorldContexts: string[];
  keywords: string[];
}

export interface PromptContext {
  topicConfig: TopicConfig;
  sessionContext: TutorSession;
  studentMessage: string;
  turnCount: number;
  hintLevel: number;
  detectedFrustration: boolean;
  curriculumData?: SimpleCurriculumContent;
}

export interface AIResponse {
  success: boolean;
  data?: {
    tutor_message: string;
    intent: string;
    concept_tags: string[];
    hint_level: number;
    student_correct: boolean;
  };
  errors?: string[];
}

export interface SafetyCheckResult {
  passed: boolean;
  violations: string[];
  filteredText?: string;
}

// Session management result types
export interface SessionResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// Utility functions for curriculum path conversion
export function curriculumPathToTopicKey(path: CurriculumPath): string {
  return `${path.grade}_${path.subject}_${path.topic}_${path.subtopic}`.replace(/-/g, '_');
}

export function topicKeyToCurriculumPath(topicKey: string): CurriculumPath {
  // Handle different formats
  if (topicKey.includes('_')) {
    const parts = topicKey.split('_');
    
    if (parts.length >= 4) {
      return {
        grade: parts[0].replace('_', '-'),
        subject: parts[1],
        topic: parts[2].replace('_', '-'),
        subtopic: parts.slice(3).join('-').replace(/_/g, '-')
      };
    } else if (parts.length === 2) {
      // Format: "topic_subtopic"
      return {
        grade: 'primary-6',
        subject: 'mathematics', 
        topic: parts[0].replace('_', '-'),
        subtopic: parts[1].replace('_', '-')
      };
    }
  }
  
  // Default fallback - assume it's a subtopic of algebra
  return {
    grade: 'primary-6',
    subject: 'mathematics',
    topic: 'algebra',
    subtopic: topicKey.replace(/_/g, '-')
  };
}