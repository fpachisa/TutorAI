import { describe, test, expect } from '@jest/globals';
import { PromptBuilder } from '@/lib/tutor/promptBuilder';
import { TOPIC_CONFIGS } from '@/lib/tutor/topicConfigs';
import type { TutorSession, TutorTurn } from '@/lib/tutor/types';

describe('PromptBuilder', () => {
  const mockSession: TutorSession = {
    uid: 'user123',
    sessionId: 'session123',
    topicKey: 'fractions_divide_by_whole',
    turns: [],
    createdAt: new Date(),
    lastActivity: new Date(),
    masteryScore: 0,
    frustratedTurns: 0,
    currentHintLevel: 0,
    completed: false
  };

  describe('buildPrompt', () => {
    test('should build basic prompt with no session history', () => {
      const prompt = PromptBuilder.buildPrompt({
        topicConfig: TOPIC_CONFIGS.fractions_divide_by_whole,
        sessionContext: mockSession,
        studentMessage: "How do I solve 3/4 ÷ 2?",
        turnCount: 1,
        hintLevel: 0,
        detectedFrustration: false
      });

      expect(prompt).toContain('Primary 6 Mathematics Tutor');
      expect(prompt).toContain('Dividing Fractions by Whole Numbers');
      expect(prompt).toContain('Socratic questioning');
      expect(prompt).toContain('How do I solve 3/4 ÷ 2?');
      expect(prompt).not.toContain('PREVIOUS CONVERSATION');
    });

    test('should include session history when available', () => {
      const sessionWithHistory: TutorSession = {
        ...mockSession,
        turns: [
          {
            turnNumber: 1,
            studentMessage: "How do I solve 3/4 ÷ 2?",
            tutorMessage: "What does 3/4 represent?",
            intent: "ask_probe",
            conceptTags: ["fractions:meaning"],
            hintLevel: 0,
            timestamp: new Date(),
            masteryGained: []
          },
          {
            turnNumber: 2,
            studentMessage: "3 parts out of 4?",
            tutorMessage: "Good! Now what does ÷ 2 mean?",
            intent: "ask_probe",
            conceptTags: ["fractions:divide_by_whole"],
            hintLevel: 0,
            timestamp: new Date(),
            masteryGained: []
          }
        ]
      };

      const prompt = PromptBuilder.buildPrompt({
        topicConfig: TOPIC_CONFIGS.fractions_divide_by_whole,
        sessionContext: sessionWithHistory,
        studentMessage: "I think it means sharing?",
        turnCount: 3,
        hintLevel: 0,
        detectedFrustration: false
      });

      expect(prompt).toContain('PREVIOUS CONVERSATION');
      expect(prompt).toContain('Student: How do I solve 3/4 ÷ 2?');
      expect(prompt).toContain('Tutor: What does 3/4 represent?');
      expect(prompt).toContain('Student: 3 parts out of 4?');
      expect(prompt).toContain('Tutor: Good! Now what does ÷ 2 mean?');
    });

    test('should include frustration guidance when detected', () => {
      const prompt = PromptBuilder.buildPrompt({
        topicConfig: TOPIC_CONFIGS.fractions_divide_by_whole,
        sessionContext: mockSession,
        studentMessage: "I don't know",
        turnCount: 1,
        hintLevel: 1,
        detectedFrustration: true
      });

      expect(prompt).toContain('STUDENT FRUSTRATION DETECTED');
      expect(prompt).toContain('simplify your approach');
      expect(prompt).toContain('provide more scaffolding');
      expect(prompt).toContain('encouragement');
    });

    test('should adjust hint level guidance', () => {
      const promptLevel0 = PromptBuilder.buildPrompt({
        topicConfig: TOPIC_CONFIGS.fractions_divide_by_whole,
        sessionContext: mockSession,
        studentMessage: "Help me",
        turnCount: 1,
        hintLevel: 0,
        detectedFrustration: false
      });

      const promptLevel2 = PromptBuilder.buildPrompt({
        topicConfig: TOPIC_CONFIGS.fractions_divide_by_whole,
        sessionContext: mockSession,
        studentMessage: "Help me",
        turnCount: 1,
        hintLevel: 2,
        detectedFrustration: false
      });

      expect(promptLevel0).toContain('Hint Level: 0');
      expect(promptLevel0).toContain('open-ended questions');
      
      expect(promptLevel2).toContain('Hint Level: 2');
      expect(promptLevel2).toContain('more specific guidance');
    });

    test('should include algebra topic configuration correctly', () => {
      const algebraSession: TutorSession = {
        ...mockSession,
        topicKey: 'algebra_unknown_letter'
      };

      const prompt = PromptBuilder.buildPrompt({
        topicConfig: TOPIC_CONFIGS.algebra_unknown_letter,
        sessionContext: algebraSession,
        studentMessage: "How do I solve x + 3 = 7?",
        turnCount: 1,
        hintLevel: 0,
        detectedFrustration: false
      });

      expect(prompt).toContain('Algebra with Unknown Letters');
      expect(prompt).toContain('unknown letter represents');
      expect(prompt).toContain('inverse operations');
      expect(prompt).toContain('How do I solve x + 3 = 7?');
    });
  });

  describe('buildTopicObjectives', () => {
    test('should format fractions objectives correctly', () => {
      const objectives = PromptBuilder.buildTopicObjectives(
        TOPIC_CONFIGS.fractions_divide_by_whole
      );

      expect(objectives).toContain('LEARNING OBJECTIVES');
      expect(objectives).toContain('sharing/partition');
      expect(objectives).toContain('(a/b) ÷ n = a/(b×n)');
      expect(objectives).toContain('Dividing a fraction by a whole number results in a smaller fraction');
    });

    test('should format algebra objectives correctly', () => {
      const objectives = PromptBuilder.buildTopicObjectives(
        TOPIC_CONFIGS.algebra_unknown_letter
      );

      expect(objectives).toContain('LEARNING OBJECTIVES');
      expect(objectives).toContain('unknown letter represents');
      expect(objectives).toContain('inverse operations');
      expect(objectives).toContain('The letter can represent different numbers');
    });
  });

  describe('buildSessionContext', () => {
    test('should format session with no history', () => {
      const context = PromptBuilder.buildSessionContext(mockSession, 1);

      expect(context).toContain('CURRENT SESSION CONTEXT');
      expect(context).toContain('Turn: 1');
      expect(context).toContain('Mastery Score: 0%');
      expect(context).toContain('Frustrated Turns: 0');
      expect(context).not.toContain('PREVIOUS CONVERSATION');
    });

    test('should format session with history', () => {
      const sessionWithHistory: TutorSession = {
        ...mockSession,
        turns: [
          {
            turnNumber: 1,
            studentMessage: "How do I divide fractions?",
            tutorMessage: "What do you think division means?",
            intent: "ask_probe",
            conceptTags: ["fractions:divide_by_whole"],
            hintLevel: 0,
            timestamp: new Date(),
            masteryGained: []
          }
        ],
        masteryScore: 0.3,
        frustratedTurns: 1
      };

      const context = PromptBuilder.buildSessionContext(sessionWithHistory, 2);

      expect(context).toContain('Turn: 2');
      expect(context).toContain('Mastery Score: 30%');
      expect(context).toContain('Frustrated Turns: 1');
      expect(context).toContain('PREVIOUS CONVERSATION');
      expect(context).toContain('Student: How do I divide fractions?');
      expect(context).toContain('Tutor: What do you think division means?');
    });

    test('should summarize long conversation history', () => {
      const longHistory: TutorTurn[] = [];
      for (let i = 1; i <= 15; i++) {
        longHistory.push({
          turnNumber: i,
          studentMessage: `Student message ${i}`,
          tutorMessage: `Tutor response ${i}`,
          intent: "ask_probe",
          conceptTags: ["test"],
          hintLevel: 0,
          timestamp: new Date(),
          masteryGained: []
        });
      }

      const sessionWithLongHistory: TutorSession = {
        ...mockSession,
        turns: longHistory
      };

      const context = PromptBuilder.buildSessionContext(sessionWithLongHistory, 16);

      expect(context).toContain('CONVERSATION SUMMARY');
      expect(context).toContain('Recent turns (last 5)');
      // Should not include all 15 turns verbatim
      const turnMatches = context.match(/Student message/g);
      expect(turnMatches?.length).toBeLessThan(15);
    });
  });

  describe('formatConversationHistory', () => {
    test('should format single turn correctly', () => {
      const turns: TutorTurn[] = [{
        turnNumber: 1,
        studentMessage: "Help me with fractions",
        tutorMessage: "What do you know about fractions?",
        intent: "ask_probe",
        conceptTags: ["fractions:basic"],
        hintLevel: 0,
        timestamp: new Date(),
        masteryGained: []
      }];

      const formatted = PromptBuilder.formatConversationHistory(turns);

      expect(formatted).toContain('Turn 1:');
      expect(formatted).toContain('Student: Help me with fractions');
      expect(formatted).toContain('Tutor: What do you know about fractions?');
    });

    test('should format multiple turns correctly', () => {
      const turns: TutorTurn[] = [
        {
          turnNumber: 1,
          studentMessage: "How do I solve 1/2 ÷ 3?",
          tutorMessage: "What does 1/2 represent?",
          intent: "ask_probe",
          conceptTags: ["fractions:meaning"],
          hintLevel: 0,
          timestamp: new Date(),
          masteryGained: []
        },
        {
          turnNumber: 2,
          studentMessage: "Half of something?",
          tutorMessage: "Good! Now what does ÷ 3 mean?",
          intent: "ask_probe",
          conceptTags: ["fractions:divide_by_whole"],
          hintLevel: 0,
          timestamp: new Date(),
          masteryGained: []
        }
      ];

      const formatted = PromptBuilder.formatConversationHistory(turns);

      expect(formatted).toContain('Turn 1:');
      expect(formatted).toContain('Turn 2:');
      expect(formatted).toContain('Student: How do I solve 1/2 ÷ 3?');
      expect(formatted).toContain('Student: Half of something?');
      expect(formatted).toContain('Tutor: What does 1/2 represent?');
      expect(formatted).toContain('Tutor: Good! Now what does ÷ 3 mean?');
    });
  });

  describe('truncateText', () => {
    test('should not truncate short text', () => {
      const text = "Short message";
      const result = PromptBuilder.truncateText(text, 100);
      expect(result).toBe(text);
    });

    test('should truncate long text with ellipsis', () => {
      const text = "This is a very long message that should be truncated";
      const result = PromptBuilder.truncateText(text, 20);
      expect(result).toBe("This is a very lo...");
      expect(result.length).toBe(20);
    });

    test('should handle exact length boundary', () => {
      const text = "Exactly twenty chars";
      const result = PromptBuilder.truncateText(text, 20);
      expect(result).toBe(text);
      expect(result.length).toBe(20);
    });
  });
});