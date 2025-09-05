// 🚀 TutorAI Curriculum API - Production Ready

// Core curriculum hierarchy
export interface CurriculumPath {
  grade: string;      // "primary-6"
  subject: string;    // "mathematics"  
  topic: string;      // "fractions"
  subtopic: string;   // "dividing-proper-fraction-by-whole"
}

// Intent types for tutoring conversations - simplified for better tracking
export type Intent = 'ask_question' | 'give_hint' | 'concept_closing'
export type ExpectedAction = 'short_answer' | 'multiple_choice' | 'show_work' | 'estimate'
export type Difficulty = 'E' | 'M' | 'C' // Easy, Medium, Challenge

// Simplified curriculum interfaces matching JSON structure
export interface StepProbe {
  probe: string;
  concept_tag: string;
}

export interface Sample {
  stem: string;
  difficulty: Difficulty;
  strategy?: string;
}

export interface QuickCheck {
  prompt: string;
  answer: string;
  difficulty: Difficulty;
}

export interface MasteryStep {
  step: number;
  concept: string;
  sample_question: string;
  question_count: number;
  mastery_criteria: string;
}

export interface CompletionPolicy {
  requires_all_steps: boolean;
  total_questions: number;
}

export interface CurriculumMetadata {
  name: string;
  description: string;
  difficulty: Difficulty;
  estimatedTime: number;
  order: number;
  icon: string;
  conceptTags: string[];
  moeSyllabusRef: string;
}

// Simple subtopic content structure
export interface SimpleCurriculumContent {
  id: string;
  path: CurriculumPath;
  metadata: CurriculumMetadata;
  learning_objective: string;
  intro_context: string;
  mastery_progression: MasteryStep[];
  completion_policy: CompletionPolicy;
}

export interface TopicSummary {
  id: string;
  name: string;
  description: string;
  subtopics: SubtopicSummary[];
  totalEstimatedTime: number;
  icon: string;
}

export interface SubtopicSummary {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  estimatedTime: number;
  path: CurriculumPath;
}

// API request/response interfaces
export interface TurnRequest {
  text: string;
  intent: Intent;
  subtopic_path: CurriculumPath;
  session_id: string;
  user_id: string;
}

export interface TurnResponse {
  text: string;
  tutor_message: string;
  intent: Intent;
  mastery_score?: number;
  concepts_learned?: string[];
  topic_completed?: boolean; // NEW: Signals topic completion for celebration
}

export interface ApiError {
  error: string;
  details?: any[];
  requestId?: string;
  message?: string;
}

/**
 * 🏗️ Main Curriculum API for content management
 */
export class CurriculumAPI {
  private static getBaseUrl(): string {
    // On server (API routes), use internal base URL
    if (typeof window === 'undefined') {
      return process.env.INTERNAL_API_BASE_URL || 'http://localhost:3000';
    }
    // In browser, use same-origin
    return '';
  }

  /**
   * Get simple curriculum content directly from JSON files
   */
  static async getSimpleCurriculumContent(path: CurriculumPath): Promise<SimpleCurriculumContent> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/curriculum/simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch curriculum: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[CurriculumAPI] Failed to get curriculum content:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

}

/**
 * 🔥 Main API client for tutor interactions
 */
export class TutorAPI {
  // Use relative URL to avoid port/origin mismatches in dev
  private static baseUrl = '';
  
  /**
   * Send a student message and get tutor response
   */
  static async postTurn(payload: TurnRequest): Promise<TurnResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/tutor/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const processingTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: 'Network error',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new Error(errorData.message || errorData.error || 'Request failed');
      }

      const data: TurnResponse = await response.json();
      return data;
      
    } catch (error) {
      console.error('[TutorAPI] Turn request failed:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  /**
   * Get system health status
   */
  static async getHealthStatus(): Promise<{ status: string; metrics?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/monitoring/health`);
      return await response.json();
    } catch (error) {
      console.error('[TutorAPI] Health check failed:', error);
      return { status: 'error' };
    }
  }
}

/**
 * 🎨 Intent styling helpers - keep for UI consistency
 */
export const INTENT_STYLES = {
  ask_probe: {
    label: 'Probe',
    color: 'accent',
    bgColor: 'accent/10',
    borderColor: 'accent/20'
  },
  give_hint: {
    label: 'Hint',
    color: 'warn',
    bgColor: 'warn/10',
    borderColor: 'warn/20'
  },
  hint: {
    label: 'Hint',
    color: 'warn',
    bgColor: 'warn/10',
    borderColor: 'warn/20'
  },
  checkpoint: {
    label: 'Checkpoint',
    color: 'accentAlt',
    bgColor: 'accentAlt/10',
    borderColor: 'accentAlt/20'
  },
  reflect: {
    label: 'Reflect',
    color: 'success',
    bgColor: 'success/10',
    borderColor: 'success/20'
  },
  summarize: {
    label: 'Summary',
    color: 'muted',
    bgColor: 'surfaceAlt',
    borderColor: 'border'
  },
  start: {
    label: 'Start',
    color: 'accent',
    bgColor: 'accent/10',
    borderColor: 'accent/20'
  },
  respond: {
    label: 'Response',
    color: 'accent',
    bgColor: 'accent/10',
    borderColor: 'accent/20'
  },
  checkpoint_response: {
    label: 'Checkpoint Response',
    color: 'accentAlt',
    bgColor: 'accentAlt/10',
    borderColor: 'accentAlt/20'
  },
  error: {
    label: 'Error',
    color: 'danger',
    bgColor: 'danger/10',
    borderColor: 'danger/20'
  }
} as const;

/**
 * 📊 Analytics event types - updated for curriculum paths
 */
export type AnalyticsEvent = 
  | { name: 'turn_created'; props: { role: 'student' | 'tutor'; subtopic: CurriculumPath } }
  | { name: 'checkpoint_answered'; props: { correct: boolean; subtopic: CurriculumPath; choice: string } }
  | { name: 'session_completed'; props: { subtopic: CurriculumPath; turns: number; masteryScore: number } }
  | { name: 'frustration_detected'; props: { subtopic: CurriculumPath; hintLevel: number } }
  | { name: 'hint_requested'; props: { subtopic: CurriculumPath; level: number } };

/**
 * 🔧 Utility functions - updated for new structure
 */
export const utils = {
  /**
   * Generate a session ID for localStorage
   */
  generateSessionId: (path?: CurriculumPath): string => {
    // Always generate a fresh session ID to ensure clean test attempts
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return sessionId;
  },

  /**
   * Format processing time for display
   */
  formatProcessingTime: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  },

  /**
   * Get intent styling
   */
  getIntentStyle: (intent: Intent) => INTENT_STYLES[intent],

  /**
   * Create curriculum path from string components
   */
  createCurriculumPath: (grade: string, subject: string, topic: string, subtopic: string): CurriculumPath => ({
    grade,
    subject,
    topic,
    subtopic
  }),

  /**
   * Convert curriculum path to URL-friendly string
   */
  pathToUrlParams: (path: CurriculumPath): URLSearchParams => {
    const params = new URLSearchParams();
    params.set('grade', path.grade);
    params.set('subject', path.subject);  
    params.set('topic', path.topic);
    params.set('subtopic', path.subtopic);
    return params;
  },

  /**
   * Parse URL params to curriculum path
   */
  urlParamsToPath: (searchParams: URLSearchParams): CurriculumPath | null => {
    const grade = searchParams.get('grade');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const subtopic = searchParams.get('subtopic');

    if (!grade || !subject || !topic || !subtopic) return null;

    return { grade, subject, topic, subtopic };
  }
};

export default TutorAPI;
