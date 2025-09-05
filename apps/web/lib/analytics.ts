// 📊 TutorAI Analytics - Smart Event Tracking

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp?: number;
  sessionId?: string;
  userId?: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  batchSize: number;
  flushInterval: number;
}

/**
 * 🔥 Analytics Engine - Track user interactions and learning patterns
 */
class AnalyticsEngine {
  private config: AnalyticsConfig = {
    enabled: process.env.NODE_ENV === 'production',
    debug: process.env.NODE_ENV === 'development',
    batchSize: 10,
    flushInterval: 5000 // 5 seconds
  };

  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    if (typeof window !== 'undefined') {
      // Flush events before page unload
      window.addEventListener('beforeunload', () => this.flush());
      
      // Start periodic flush
      this.startPeriodicFlush();
    }
  }

  /**
   * 📝 Log an analytics event
   */
  logEvent(name: string, properties: Record<string, any> = {}, context?: { sessionId?: string; userId?: string }) {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      sessionId: context?.sessionId,
      userId: context?.userId
    };

    // Debug logging
    if (this.config.debug) {
      console.log('📊 [Analytics]', name, properties);
    }

    // Add to queue
    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * 🚀 Flush events to backend/console
   */
  private flush() {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    if (this.config.enabled) {
      // In production, send to analytics service
      this.sendToAnalyticsService(eventsToSend);
    } else {
      // In development, just log to console
      eventsToSend.forEach(event => {
        console.log(`[Analytics] ${event.name}:`, event.properties);
      });
    }
  }

  /**
   * 📡 Send events to analytics service (implement based on your provider)
   */
  private async sendToAnalyticsService(events: AnalyticsEvent[]) {
    try {
      // Example implementation - replace with your analytics provider
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('[Analytics] Failed to send events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * ⏰ Start periodic flush timer
   */
  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * 🧹 Cleanup
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Global analytics instance
const analytics = new AnalyticsEngine();

/**
 * 🎯 Convenient event logging functions
 */

// Learning Events
export const trackTurnCreated = (role: 'student' | 'tutor', intent: string, topicKey: string, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('turn_created', {
    role,
    intent,
    topic: topicKey,
    category: 'learning'
  }, context);
};

export const trackCheckpointAnswered = (correct: boolean, choice: string, topicKey: string, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('checkpoint_answered', {
    correct,
    choice,
    topic: topicKey,
    category: 'assessment'
  }, context);
};

export const trackSessionCompleted = (topicKey: string, turns: number, masteryScore: number, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('session_completed', {
    topic: topicKey,
    turns,
    masteryScore,
    category: 'completion'
  }, context);
};

export const trackFrustrationDetected = (topicKey: string, hintLevel: number, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('frustration_detected', {
    topic: topicKey,
    hintLevel,
    category: 'engagement'
  }, context);
};

export const trackHintRequested = (topicKey: string, level: number, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('hint_requested', {
    topic: topicKey,
    level,
    category: 'support'
  }, context);
};

// UI Interaction Events
export const trackTopicSelected = (topicKey: string, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('topic_selected', {
    topic: topicKey,
    category: 'navigation'
  }, context);
};

export const trackMessageSent = (messageLength: number, hasQuickAction: boolean, topicKey: string, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('message_sent', {
    messageLength,
    hasQuickAction,
    topic: topicKey,
    category: 'interaction'
  }, context);
};

export const trackQuickActionUsed = (actionType: string, topicKey: string, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('quick_action_used', {
    actionType,
    topic: topicKey,
    category: 'interaction'
  }, context);
};

// Performance Events
export const trackPerformanceMetric = (metric: string, value: number, context?: Record<string, any>) => {
  analytics.logEvent('performance_metric', {
    metric,
    value,
    category: 'performance',
    ...context
  });
};

export const trackError = (error: string, component: string, context?: Record<string, any>) => {
  analytics.logEvent('error_occurred', {
    error,
    component,
    category: 'error',
    ...context
  });
};

// Engagement Events
export const trackSparkOrbInteraction = (state: string, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('spark_orb_interaction', {
    state,
    category: 'engagement'
  }, context);
};

export const trackConfettiTriggered = (trigger: string, context?: { sessionId?: string; userId?: string }) => {
  analytics.logEvent('confetti_triggered', {
    trigger,
    category: 'celebration'
  }, context);
};

/**
 * 🔧 Utility functions
 */
export const getSessionContext = (sessionId: string, userId: string = 'anonymous') => ({
  sessionId,
  userId
});

export const withTracking = <T extends (...args: any[]) => any>(
  eventName: string,
  fn: T,
  getProperties?: (...args: Parameters<T>) => Record<string, any>
): T => {
  return ((...args: Parameters<T>) => {
    const properties = getProperties ? getProperties(...args) : {};
    analytics.logEvent(eventName, properties);
    return fn(...args);
  }) as T;
};

/**
 * 📊 Analytics hook for React components
 */
export const useAnalytics = (sessionId?: string, userId?: string) => {
  const context = { sessionId, userId };

  return {
    trackTurnCreated: (role: 'student' | 'tutor', intent: string, topicKey: string) => 
      trackTurnCreated(role, intent, topicKey, context),
    
    trackCheckpointAnswered: (correct: boolean, choice: string, topicKey: string) =>
      trackCheckpointAnswered(correct, choice, topicKey, context),
    
    trackSessionCompleted: (topicKey: string, turns: number, masteryScore: number) =>
      trackSessionCompleted(topicKey, turns, masteryScore, context),
    
    trackFrustrationDetected: (topicKey: string, hintLevel: number) =>
      trackFrustrationDetected(topicKey, hintLevel, context),
    
    trackHintRequested: (topicKey: string, level: number) =>
      trackHintRequested(topicKey, level, context),
    
    trackTopicSelected: (topicKey: string) =>
      trackTopicSelected(topicKey, context),
    
    trackMessageSent: (messageLength: number, hasQuickAction: boolean, topicKey: string) =>
      trackMessageSent(messageLength, hasQuickAction, topicKey, context),
    
    trackQuickActionUsed: (actionType: string, topicKey: string) =>
      trackQuickActionUsed(actionType, topicKey, context),
    
    trackSparkOrbInteraction: (state: string) =>
      trackSparkOrbInteraction(state, context),
    
    trackConfettiTriggered: (trigger: string) =>
      trackConfettiTriggered(trigger, context),
  };
};

export default analytics;