import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { SessionManager } from '@/lib/tutor/sessionManager';
import type { TutorSession, TutorTurn } from '@/lib/tutor/types';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
      }))
    }))
  }
}));

describe('SessionManager', () => {
  let mockDoc: any;

  beforeEach(() => {
    mockDoc = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      exists: false,
      data: jest.fn()
    };

    // Mock Firebase collection/doc chain
    const { db } = require('@/lib/firebase');
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDoc)
    });
  });

  describe('getOrCreateSession', () => {
    test('should create new session when none exists', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });
      mockDoc.set.mockResolvedValue(undefined);

      const result = await SessionManager.getOrCreateSession(
        'user123',
        'session123',
        'fractions_divide_by_whole'
      );

      expect(result.success).toBe(true);
      expect(result.data?.uid).toBe('user123');
      expect(result.data?.sessionId).toBe('session123');
      expect(result.data?.topicKey).toBe('fractions_divide_by_whole');
      expect(result.data?.turns).toHaveLength(0);
      expect(result.data?.masteryScore).toBe(0);
      expect(result.data?.completed).toBe(false);
      
      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'user123',
          sessionId: 'session123',
          topicKey: 'fractions_divide_by_whole'
        })
      );
    });

    test('should return existing session when found', async () => {
      const existingSession: TutorSession = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        turns: [{
          turnNumber: 1,
          studentMessage: "How do I divide fractions?",
          tutorMessage: "What do you think division means?",
          intent: "ask_probe",
          conceptTags: ["fractions:divide_by_whole"],
          hintLevel: 0,
          timestamp: new Date(),
          masteryGained: []
        }],
        createdAt: new Date(),
        lastActivity: new Date(),
        masteryScore: 0.2,
        frustratedTurns: 0,
        currentHintLevel: 0,
        completed: false
      };

      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => existingSession
      });

      const result = await SessionManager.getOrCreateSession(
        'user123',
        'session123',
        'fractions_divide_by_whole'
      );

      expect(result.success).toBe(true);
      expect(result.data?.turns).toHaveLength(1);
      expect(result.data?.masteryScore).toBe(0.2);
      expect(mockDoc.set).not.toHaveBeenCalled();
    });

    test('should handle Firebase errors gracefully', async () => {
      mockDoc.get.mockRejectedValue(new Error('Firebase connection error'));

      const result = await SessionManager.getOrCreateSession(
        'user123',
        'session123',
        'fractions_divide_by_whole'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to get/create session');
    });
  });

  describe('addTurn', () => {
    test('should add turn and update session metrics', async () => {
      const session: TutorSession = {
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

      const newTurn: TutorTurn = {
        turnNumber: 1,
        studentMessage: "How do I solve 1/2 ÷ 3?",
        tutorMessage: "What does 1/2 represent?",
        intent: "ask_probe",
        conceptTags: ["fractions:meaning"],
        hintLevel: 0,
        timestamp: new Date(),
        masteryGained: ["fractions:basic_understanding"]
      };

      mockDoc.update.mockResolvedValue(undefined);

      const result = await SessionManager.addTurn(session, newTurn);

      expect(result.success).toBe(true);
      expect(result.data?.turns).toHaveLength(1);
      expect(result.data?.turns[0].turnNumber).toBe(1);
      expect(result.data?.masteryScore).toBeGreaterThan(0);
      
      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          turns: expect.arrayContaining([
            expect.objectContaining({
              turnNumber: 1,
              studentMessage: "How do I solve 1/2 ÷ 3?"
            })
          ])
        })
      );
    });

    test('should increment frustrated turns when student frustrated', async () => {
      const session: TutorSession = {
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

      const frustratedTurn: TutorTurn = {
        turnNumber: 1,
        studentMessage: "I don't know",
        tutorMessage: "Let's try a different approach. What do you know about sharing?",
        intent: "ask_probe",
        conceptTags: ["fractions:divide_by_whole"],
        hintLevel: 1,
        timestamp: new Date(),
        masteryGained: [],
        studentFrustrated: true
      };

      mockDoc.update.mockResolvedValue(undefined);

      const result = await SessionManager.addTurn(session, frustratedTurn);

      expect(result.success).toBe(true);
      expect(result.data?.frustratedTurns).toBe(1);
      expect(result.data?.currentHintLevel).toBe(1);
    });

    test('should handle Firebase update errors', async () => {
      const session: TutorSession = {
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

      const newTurn: TutorTurn = {
        turnNumber: 1,
        studentMessage: "Help me",
        tutorMessage: "What do you think?",
        intent: "ask_probe",
        conceptTags: ["test"],
        hintLevel: 0,
        timestamp: new Date(),
        masteryGained: []
      };

      mockDoc.update.mockRejectedValue(new Error('Update failed'));

      const result = await SessionManager.addTurn(session, newTurn);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to update session');
    });
  });

  describe('calculateMasteryScore', () => {
    test('should calculate mastery from concept tags', () => {
      const turns: TutorTurn[] = [
        {
          turnNumber: 1,
          studentMessage: "Test",
          tutorMessage: "Test",
          intent: "ask_probe",
          conceptTags: ["fractions:meaning", "fractions:divide_by_whole"],
          hintLevel: 0,
          timestamp: new Date(),
          masteryGained: ["fractions:basic_understanding"]
        },
        {
          turnNumber: 2,
          studentMessage: "Test",
          tutorMessage: "Test",
          intent: "ask_probe",
          conceptTags: ["fractions:simplify"],
          hintLevel: 0,
          timestamp: new Date(),
          masteryGained: ["fractions:simplification"]
        }
      ];

      const score = SessionManager.calculateMasteryScore(turns, 'fractions_divide_by_whole');

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should return 0 for empty turns', () => {
      const score = SessionManager.calculateMasteryScore([], 'fractions_divide_by_whole');
      expect(score).toBe(0);
    });
  });

  describe('determineNextHintLevel', () => {
    test('should increase hint level when frustrated', () => {
      const session: TutorSession = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        turns: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        masteryScore: 0,
        frustratedTurns: 1,
        currentHintLevel: 0,
        completed: false
      };

      const nextLevel = SessionManager.determineNextHintLevel(session, true);
      expect(nextLevel).toBe(1);
    });

    test('should not exceed maximum hint level', () => {
      const session: TutorSession = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        turns: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        masteryScore: 0,
        frustratedTurns: 3,
        currentHintLevel: 2,
        completed: false
      };

      const nextLevel = SessionManager.determineNextHintLevel(session, true);
      expect(nextLevel).toBe(2); // Should cap at max level
    });

    test('should maintain level when not frustrated', () => {
      const session: TutorSession = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        turns: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        masteryScore: 0.5,
        frustratedTurns: 0,
        currentHintLevel: 1,
        completed: false
      };

      const nextLevel = SessionManager.determineNextHintLevel(session, false);
      expect(nextLevel).toBe(1);
    });

    test('should decrease hint level with good progress', () => {
      const session: TutorSession = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        turns: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        masteryScore: 0.7,
        frustratedTurns: 0,
        currentHintLevel: 2,
        completed: false
      };

      const nextLevel = SessionManager.determineNextHintLevel(session, false);
      expect(nextLevel).toBeLessThan(2);
    });
  });

  describe('validateSession', () => {
    test('should validate correct session format', () => {
      const validSession: TutorSession = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        turns: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        masteryScore: 0.5,
        frustratedTurns: 1,
        currentHintLevel: 0,
        completed: false
      };

      const result = SessionManager.validateSession(validSession);
      expect(result.success).toBe(true);
    });

    test('should reject session with invalid topic key', () => {
      const invalidSession = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'invalid_topic',
        turns: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        masteryScore: 0.5,
        frustratedTurns: 1,
        currentHintLevel: 0,
        completed: false
      } as any;

      const result = SessionManager.validateSession(invalidSession);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid topic key');
    });

    test('should reject session with invalid mastery score', () => {
      const invalidSession: TutorSession = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        turns: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        masteryScore: 1.5, // Invalid - should be 0-1
        frustratedTurns: 1,
        currentHintLevel: 0,
        completed: false
      };

      const result = SessionManager.validateSession(invalidSession);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid mastery score');
    });
  });

  describe('getSessionStats', () => {
    test('should calculate session statistics correctly', () => {
      const session: TutorSession = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        turns: [
          {
            turnNumber: 1,
            studentMessage: "Help",
            tutorMessage: "What do you think?",
            intent: "ask_probe",
            conceptTags: ["fractions:meaning"],
            hintLevel: 0,
            timestamp: new Date(),
            masteryGained: ["fractions:basic"]
          },
          {
            turnNumber: 2,
            studentMessage: "I don't know",
            tutorMessage: "Let's try another approach",
            intent: "ask_probe",
            conceptTags: ["fractions:divide_by_whole"],
            hintLevel: 1,
            timestamp: new Date(),
            masteryGained: [],
            studentFrustrated: true
          }
        ],
        createdAt: new Date(),
        lastActivity: new Date(),
        masteryScore: 0.3,
        frustratedTurns: 1,
        currentHintLevel: 1,
        completed: false
      };

      const stats = SessionManager.getSessionStats(session);

      expect(stats.totalTurns).toBe(2);
      expect(stats.masteryScore).toBe(0.3);
      expect(stats.frustratedTurns).toBe(1);
      expect(stats.currentHintLevel).toBe(1);
      expect(stats.uniqueConceptsCovered).toBe(2);
      expect(stats.masteryGained).toContain("fractions:basic");
      expect(stats.avgHintLevel).toBe(0.5);
    });
  });
});