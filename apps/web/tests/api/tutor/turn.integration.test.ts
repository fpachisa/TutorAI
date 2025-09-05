import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/tutor/turn/route';
import type { TutorTurnRequest, TutorTurnResponse } from '@/lib/tutor/types';

// Mock all dependencies
jest.mock('@/lib/tutor/vertexClient');
jest.mock('@/lib/tutor/sessionManager');
jest.mock('@/lib/tutor/safety');
jest.mock('@/lib/firebase');

describe('/api/tutor/turn Integration Tests', () => {
  let mockVertexClient: any;
  let mockSessionManager: any;
  let mockSafetySystem: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock VertexAIClient
    mockVertexClient = {
      generateResponse: jest.fn()
    };
    const { VertexAIClient } = require('@/lib/tutor/vertexClient');
    VertexAIClient.mockImplementation(() => mockVertexClient);

    // Mock SessionManager
    mockSessionManager = {
      getOrCreateSession: jest.fn(),
      addTurn: jest.fn(),
      determineNextHintLevel: jest.fn()
    };
    const { SessionManager } = require('@/lib/tutor/sessionManager');
    Object.assign(SessionManager, mockSessionManager);

    // Mock SafetySystem
    mockSafetySystem = {
      sanitizeStudentInput: jest.fn(input => input),
      detectFrustration: jest.fn(() => false),
      performComprehensiveCheck: jest.fn(() => ({
        passed: true,
        violations: [],
        filteredText: null
      }))
    };
    const { SafetySystem } = require('@/lib/tutor/safety');
    Object.assign(SafetySystem, mockSafetySystem);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Happy Path', () => {
    test('should process a valid tutor turn request successfully', async () => {
      // Setup mocks for happy path
      mockSessionManager.getOrCreateSession.mockResolvedValue({
        success: true,
        data: {
          uid: 'user123',
          sessionId: 'session123',
          topicKey: 'fractions_divide_by_whole',
          turns: [],
          masteryScore: 0,
          frustratedTurns: 0,
          currentHintLevel: 0,
          completed: false,
          createdAt: new Date(),
          lastActivity: new Date()
        }
      });

      mockVertexClient.generateResponse.mockResolvedValue({
        success: true,
        data: {
          tutor_message: "What do you think 3/4 ÷ 2 means in terms of sharing?",
          intent: "ask_probe",
          concept_tags: ["fractions:divide_by_whole", "fractions:sharing"],
          hint_level: 0
        }
      });

      mockSessionManager.determineNextHintLevel.mockReturnValue(0);
      mockSessionManager.addTurn.mockResolvedValue({
        success: true,
        data: {} // Updated session
      });

      // Create request
      const requestBody: TutorTurnRequest = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        studentMessage: 'How do I solve 3/4 ÷ 2?',
        metadata: {
          clientTs: Date.now(),
          userAgent: 'test-agent'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/tutor/turn', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Make request
      const response = await POST(request);
      const responseData: TutorTurnResponse = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.tutor_message).toContain('What do you think');
      expect(responseData.intent).toBe('ask_probe');
      expect(responseData.concept_tags).toContain('fractions:divide_by_whole');
      expect(responseData.hint_level).toBe(0);
      expect(responseData.session_id).toBe('session123');

      // Verify all services were called
      expect(mockSessionManager.getOrCreateSession).toHaveBeenCalledWith(
        'user123',
        'session123',
        'fractions_divide_by_whole'
      );
      expect(mockSafetySystem.sanitizeStudentInput).toHaveBeenCalledWith('How do I solve 3/4 ÷ 2?');
      expect(mockVertexClient.generateResponse).toHaveBeenCalled();
      expect(mockSafetySystem.performComprehensiveCheck).toHaveBeenCalled();
      expect(mockSessionManager.addTurn).toHaveBeenCalled();
    });
  });

  describe('Safety System Integration', () => {
    test('should block unsafe tutor responses', async () => {
      // Setup session
      mockSessionManager.getOrCreateSession.mockResolvedValue({
        success: true,
        data: {
          uid: 'user123',
          sessionId: 'session123',
          topicKey: 'fractions_divide_by_whole',
          turns: [],
          masteryScore: 0,
          frustratedTurns: 0,
          currentHintLevel: 0,
          completed: false,
          createdAt: new Date(),
          lastActivity: new Date()
        }
      });

      // Mock AI response with direct answer (unsafe)
      mockVertexClient.generateResponse.mockResolvedValue({
        success: true,
        data: {
          tutor_message: "The answer is 3/8. Just divide 3 by 8.",
          intent: "give_answer",
          concept_tags: ["fractions:divide_by_whole"],
          hint_level: 0
        }
      });

      // Mock safety system blocking the response
      mockSafetySystem.performComprehensiveCheck.mockReturnValue({
        passed: false,
        violations: ['Contains direct answer or solution'],
        filteredText: "I can't give you the answer directly. What do you think happens when we share 3/4 among 2 people?"
      });

      mockSessionManager.determineNextHintLevel.mockReturnValue(0);
      mockSessionManager.addTurn.mockResolvedValue({
        success: true,
        data: {}
      });

      // Create request
      const requestBody: TutorTurnRequest = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        studentMessage: 'Just tell me the answer to 3/4 ÷ 2',
        metadata: { clientTs: Date.now() }
      };

      const request = new NextRequest('http://localhost:3000/api/tutor/turn', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      // Make request
      const response = await POST(request);
      const responseData: TutorTurnResponse = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.tutor_message).not.toContain('answer is 3/8');
      expect(responseData.tutor_message).toContain("I can't give you the answer directly");
      expect(responseData.safety_violations).toContain('Contains direct answer or solution');
    });

    test('should detect and handle student frustration', async () => {
      // Setup session with some frustration history
      mockSessionManager.getOrCreateSession.mockResolvedValue({
        success: true,
        data: {
          uid: 'user123',
          sessionId: 'session123',
          topicKey: 'fractions_divide_by_whole',
          turns: [
            {
              turnNumber: 1,
              studentMessage: "I don't know",
              tutorMessage: "What do you think sharing means?",
              intent: "ask_probe",
              conceptTags: ["fractions:sharing"],
              hintLevel: 0,
              timestamp: new Date(),
              masteryGained: [],
              studentFrustrated: true
            }
          ],
          masteryScore: 0,
          frustratedTurns: 1,
          currentHintLevel: 1,
          completed: false,
          createdAt: new Date(),
          lastActivity: new Date()
        }
      });

      // Mock frustration detection
      mockSafetySystem.detectFrustration.mockReturnValue(true);

      // Mock AI response appropriate for frustrated student
      mockVertexClient.generateResponse.mockResolvedValue({
        success: true,
        data: {
          tutor_message: "I understand this is tricky! Let's use a pizza example. If you have 3/4 of a pizza and want to share it between 2 people, how much does each person get?",
          intent: "ask_probe",
          concept_tags: ["fractions:divide_by_whole", "fractions:real_world"],
          hint_level: 1
        }
      });

      mockSessionManager.determineNextHintLevel.mockReturnValue(1);
      mockSessionManager.addTurn.mockResolvedValue({
        success: true,
        data: {}
      });

      // Create request
      const requestBody: TutorTurnRequest = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        studentMessage: "I'm still confused",
        metadata: { clientTs: Date.now() }
      };

      const request = new NextRequest('http://localhost:3000/api/tutor/turn', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      // Make request
      const response = await POST(request);
      const responseData: TutorTurnResponse = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.hint_level).toBe(1);
      expect(responseData.tutor_message).toContain('pizza example');
      expect(responseData.student_frustrated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid request format', async () => {
      const request = new NextRequest('http://localhost:3000/api/tutor/turn', {
        method: 'POST',
        body: JSON.stringify({
          uid: 'user123'
          // Missing required fields
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid request format');
    });

    test('should handle session creation failure', async () => {
      mockSessionManager.getOrCreateSession.mockResolvedValue({
        success: false,
        errors: ['Database connection failed']
      });

      const requestBody: TutorTurnRequest = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        studentMessage: 'Help me',
        metadata: { clientTs: Date.now() }
      };

      const request = new NextRequest('http://localhost:3000/api/tutor/turn', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Failed to get session');
    });

    test('should handle AI generation failure with fallback', async () => {
      mockSessionManager.getOrCreateSession.mockResolvedValue({
        success: true,
        data: {
          uid: 'user123',
          sessionId: 'session123',
          topicKey: 'fractions_divide_by_whole',
          turns: [],
          masteryScore: 0,
          frustratedTurns: 0,
          currentHintLevel: 0,
          completed: false,
          createdAt: new Date(),
          lastActivity: new Date()
        }
      });

      mockVertexClient.generateResponse.mockResolvedValue({
        success: false,
        errors: ['AI service unavailable']
      });

      const requestBody: TutorTurnRequest = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        studentMessage: 'Help me with fractions',
        metadata: { clientTs: Date.now() }
      };

      const request = new NextRequest('http://localhost:3000/api/tutor/turn', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('AI generation failed');
    });
  });

  describe('Performance Requirements', () => {
    test('should respond within 1.5 seconds', async () => {
      // Setup fast mocks
      mockSessionManager.getOrCreateSession.mockResolvedValue({
        success: true,
        data: {
          uid: 'user123',
          sessionId: 'session123',
          topicKey: 'fractions_divide_by_whole',
          turns: [],
          masteryScore: 0,
          frustratedTurns: 0,
          currentHintLevel: 0,
          completed: false,
          createdAt: new Date(),
          lastActivity: new Date()
        }
      });

      mockVertexClient.generateResponse.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: {
            tutor_message: "What do you think?",
            intent: "ask_probe",
            concept_tags: ["test"],
            hint_level: 0
          }
        }), 100)) // 100ms mock AI response
      );

      mockSessionManager.addTurn.mockResolvedValue({ success: true, data: {} });

      const requestBody: TutorTurnRequest = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'fractions_divide_by_whole',
        studentMessage: 'Test message',
        metadata: { clientTs: Date.now() }
      };

      const request = new NextRequest('http://localhost:3000/api/tutor/turn', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1500); // Should be under 1.5 seconds
    });
  });

  describe('Topic-Specific Behavior', () => {
    test('should handle algebra topics correctly', async () => {
      mockSessionManager.getOrCreateSession.mockResolvedValue({
        success: true,
        data: {
          uid: 'user123',
          sessionId: 'session123',
          topicKey: 'algebra_unknown_letter',
          turns: [],
          masteryScore: 0,
          frustratedTurns: 0,
          currentHintLevel: 0,
          completed: false,
          createdAt: new Date(),
          lastActivity: new Date()
        }
      });

      mockVertexClient.generateResponse.mockResolvedValue({
        success: true,
        data: {
          tutor_message: "What do you think the letter x represents in this equation?",
          intent: "ask_probe",
          concept_tags: ["algebra:unknown_letter", "algebra:variable_meaning"],
          hint_level: 0
        }
      });

      mockSessionManager.addTurn.mockResolvedValue({ success: true, data: {} });

      const requestBody: TutorTurnRequest = {
        uid: 'user123',
        sessionId: 'session123',
        topicKey: 'algebra_unknown_letter',
        studentMessage: 'How do I solve x + 3 = 7?',
        metadata: { clientTs: Date.now() }
      };

      const request = new NextRequest('http://localhost:3000/api/tutor/turn', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData: TutorTurnResponse = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.concept_tags).toContain('algebra:unknown_letter');
      expect(responseData.tutor_message).toContain('letter x');
    });
  });
});