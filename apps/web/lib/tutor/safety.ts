import type { SafetyCheckResult } from './types';

export class SafetySystem {
  /**
   * Sanitize student input for safety and appropriateness
   */
  static sanitizeStudentInput(input: string): string {
    // Remove excessive whitespace and normalize
    let sanitized = input.trim().replace(/\s+/g, ' ');
    
    // Remove potentially harmful characters (keep mathematical symbols)
    sanitized = sanitized.replace(/[<>{}]/g, '');
    
    // Limit length to prevent spam
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + '...';
    }
    
    return sanitized;
  }
  
  /**
   * Detect if student is showing signs of frustration
   */
  static detectFrustration(message: string): boolean {
    const frustrationIndicators = [
      // Direct expressions of frustration
      'i don\'t know',
      'i don\'t get it',
      'i\'m confused',
      'this is confusing',
      'this is hard',
      'this is difficult',
      'i\'m stuck',
      'i give up',
      'i quit',
      'help me',
      'i need help',
      
      // Emotional indicators
      'frustrated',
      'annoying',
      'stupid',
      'dumb',
      'hate this',
      'boring',
      
      // Uncertainty markers
      'maybe',
      'i think',
      'i guess',
      'not sure',
      'probably',
      
      // Short responses indicating disengagement
      'idk',
      'dunno',
      'whatever',
      'ok',
      'fine'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    // Check for direct frustration keywords
    const hasFrustrationKeywords = frustrationIndicators.some(indicator => 
      lowerMessage.includes(indicator)
    );
    
    // Check for very short responses (potential disengagement)
    const isVeryShort = message.trim().length <= 3;
    
    // Check for excessive question marks (confusion)
    const hasExcessiveQuestions = (message.match(/\?/g) || []).length >= 2;
    
    return hasFrustrationKeywords || isVeryShort || hasExcessiveQuestions;
  }
  
  /**
   * Perform comprehensive safety check on tutor responses
   */
  static performComprehensiveCheck(tutorMessage: string, intent: string): SafetyCheckResult {
    const violations: string[] = [];
    let filteredText: string | undefined;
    
    // Check for direct answers (violates Socratic method)
    if (this.containsDirectAnswer(tutorMessage)) {
      violations.push('Contains direct answer or solution');
      filteredText = this.convertToSocraticQuestion(tutorMessage);
    }
    
    // Check for inappropriate complexity
    if (this.isTooComplex(tutorMessage)) {
      violations.push('Response too complex for Primary 6 level');
    }
    
    // Check for off-topic content
    if (this.isOffTopic(tutorMessage)) {
      violations.push('Content not related to Primary 6 mathematics');
    }
    
    // Check for judgmental language
    if (this.containsJudgmentalLanguage(tutorMessage)) {
      violations.push('Contains judgmental or discouraging language');
    }
    
    // Check for multiple questions (should be one per turn)
    if (this.hasMultipleQuestions(tutorMessage)) {
      violations.push('Contains multiple questions - should be one per turn');
    }
    
    // Check response length
    if (this.isTooLong(tutorMessage)) {
      violations.push('Response too long - should be under 6 lines');
    }
    
    return {
      passed: violations.length === 0,
      violations,
      filteredText
    };
  }
  
  /**
   * Check if response contains direct answers
   */
  private static containsDirectAnswer(message: string): boolean {
    const directAnswerPatterns = [
      // Mathematical answers
      /the answer is/i,
      /the solution is/i,
      /equals? \d+/i,
      /= \d+/,
      /is \d+/,
      
      // Direct instruction patterns
      /just (multiply|divide|add|subtract)/i,
      /simply (multiply|divide|add|subtract)/i,
      /you need to (multiply|divide|add|subtract)/i,
      
      // Formula reveals
      /the formula is/i,
      /use this formula/i,
      
      // Step-by-step solutions (too detailed)
      /first.*then.*finally/i,
      /step 1.*step 2.*step 3/i
    ];
    
    return directAnswerPatterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Convert direct answer to Socratic question
   */
  private static convertToSocraticQuestion(message: string): string {
    // Simple conversion - in practice this would be more sophisticated
    if (message.toLowerCase().includes('the answer is')) {
      return "What do you think the answer might be? Can you walk me through your thinking?";
    }
    
    if (message.toLowerCase().includes('just multiply')) {
      return "What operation do you think we should use here? Why?";
    }
    
    if (message.toLowerCase().includes('the formula is')) {
      return "Can you think of what formula might help us here?";
    }
    
    // Generic fallback
    return "What's your thinking on this problem? What would you try first?";
  }
  
  /**
   * Check if language is too complex for Primary 6
   */
  private static isTooComplex(message: string): boolean {
    const complexTerms = [
      'algorithm', 'coefficient', 'polynomial', 'derivative', 'integral',
      'logarithm', 'exponential', 'quadratic', 'simultaneous equations',
      'trigonometry', 'calculus', 'differentiation', 'integration'
    ];
    
    const lowerMessage = message.toLowerCase();
    return complexTerms.some(term => lowerMessage.includes(term));
  }
  
  /**
   * Check if content is off-topic for Primary 6 math
   */
  private static isOffTopic(message: string): boolean {
    const offTopicIndicators = [
      'physics', 'chemistry', 'biology', 'history', 'geography',
      'literature', 'english', 'art', 'music', 'sports'
    ];
    
    const lowerMessage = message.toLowerCase();
    return offTopicIndicators.some(topic => lowerMessage.includes(topic));
  }
  
  /**
   * Check for judgmental or discouraging language
   */
  private static containsJudgmentalLanguage(message: string): boolean {
    const judgmentalPatterns = [
      /that's wrong/i,
      /incorrect/i,
      /you should know/i,
      /obviously/i,
      /clearly/i,
      /simple/i,
      /easy/i,
      /just/i, // as in "just do this"
      /stupid/i,
      /silly/i,
      /bad/i
    ];
    
    return judgmentalPatterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Check for multiple questions (violates "one question per turn")
   */
  private static hasMultipleQuestions(message: string): boolean {
    const questionCount = (message.match(/\?/g) || []).length;
    return questionCount > 1;
  }
  
  /**
   * Check if response is too long (should be under 6 lines)
   */
  private static isTooLong(message: string): boolean {
    const lines = message.split('\n').length;
    const wordCount = message.split(/\s+/).length;
    
    return lines > 6 || wordCount > 50;
  }
  
  /**
   * Generate safe fallback response
   */
  static generateSafeFallback(context: { topic: string; studentMessage: string }): string {
    const fallbacks = [
      `I notice you're working on ${context.topic}. What part of this problem would you like to tackle first?`,
      `Let's break this down step by step. What do you think the question is asking you to find?`,
      `That's a good question about ${context.topic}. What have you tried so far?`,
      `I can help you think through this. What information do we have in the problem?`,
      `Let's approach this together. What's the first thing you notice about this problem?`
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
  
  /**
   * Check if content is appropriate for educational context
   */
  static isEducationallyAppropriate(content: string): boolean {
    // Check for non-educational content
    const inappropriatePatterns = [
      /personal information/i,
      /contact details/i,
      /social media/i,
      /games?/i,
      /entertainment/i,
      /jokes?/i,
      /stories/i
    ];
    
    return !inappropriatePatterns.some(pattern => pattern.test(content));
  }
}