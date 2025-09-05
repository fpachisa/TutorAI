import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { VertexAIClient } from '@/lib/tutor/vertexClient';

// Mock the Vertex AI SDK
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}));

describe('VertexAIClient', () => {
  let client: VertexAIClient;
  let mockModel: any;

  beforeEach(() => {
    client = new VertexAIClient();
    mockModel = {
      generateContent: jest.fn()
    };
    (client as any).model = mockModel;
  });

  describe('generateResponse', () => {
    test('should return valid response with proper JSON', async () => {
      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  tutor_message: "What do you think happens when we share 3/4 pizza among 2 people?",
                  intent: "ask_probe",
                  concept_tags: ["fractions:divide_by_whole", "fractions:sharing"],
                  hint_level: 0
                })
              }]
            }
          }]
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await client.generateResponse(
        "You are a tutor\n\nCurrent student message: How do I solve 3/4 ÷ 2?"
      );

      expect(result.success).toBe(true);
      expect(result.data?.tutor_message).toContain("What do you think");
      expect(result.data?.intent).toBe("ask_probe");
      expect(result.data?.hint_level).toBe(0);
    });

    test('should handle malformed JSON with repair attempt', async () => {
      const malformedJson = `{
        "tutor_message": "What operation do we use to share?",
        "intent": "ask_probe",
        "concept_tags": ["fractions:divide_by_whole"]
        "hint_level": 0
      }`;

      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{ text: malformedJson }]
            }
          }]
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await client.generateResponse(
        "You are a tutor\n\nCurrent student message: How do I solve 3/4 ÷ 2?"
      );

      expect(result.success).toBe(true);
      expect(result.data?.tutor_message).toContain("What operation");
    });

    test('should retry on timeout errors', async () => {
      mockModel.generateContent
        .mockRejectedValueOnce(new Error('Request timeout'))
        .mockResolvedValueOnce({
          response: {
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    tutor_message: "Let's try again. What do you think?",
                    intent: "ask_probe",
                    concept_tags: ["fractions:divide_by_whole"],
                    hint_level: 1
                  })
                }]
              }
            }]
          }
        });

      const result = await client.generateResponse(
        "You are a tutor\n\nCurrent student message: Help me understand"
      );

      expect(result.success).toBe(true);
      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });

    test('should fail after max retries exceeded', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('Network error'));

      const result = await client.generateResponse(
        "You are a tutor\n\nCurrent student message: Help me"
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Max retries exceeded');
    });

    test('should validate required response fields', async () => {
      const incompleteResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  tutor_message: "What do you think?",
                  intent: "ask_probe"
                  // Missing concept_tags and hint_level
                })
              }]
            }
          }]
        }
      };

      mockModel.generateContent.mockResolvedValue(incompleteResponse);

      const result = await client.generateResponse(
        "You are a tutor\n\nCurrent student message: Help me"
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid response format');
    });

    test('should handle empty or null responses', async () => {
      const emptyResponse = {
        response: {
          candidates: []
        }
      };

      mockModel.generateContent.mockResolvedValue(emptyResponse);

      const result = await client.generateResponse(
        "You are a tutor\n\nCurrent student message: Help me"
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No response generated');
    });

    test('should respect timeout parameter', async () => {
      const startTime = Date.now();
      
      mockModel.generateContent.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      const result = await client.generateResponse(
        "You are a tutor\n\nCurrent student message: Help me"
      );

      const endTime = Date.now();
      
      expect(result.success).toBe(false);
      expect(endTime - startTime).toBeLessThan(150);
      expect(result.errors).toContain('timeout');
    });

    test('should include request ID in logs when provided', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockResponse = {
        response: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  tutor_message: "What do you think?",
                  intent: "ask_probe",
                  concept_tags: ["fractions:divide_by_whole"],
                  hint_level: 0
                })
              }]
            }
          }]
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      await client.generateResponse(
        "You are a tutor\n\nCurrent student message: Help me"
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[test-123]')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('parseResponse', () => {
    test('should parse valid JSON response', () => {
      const validJson = JSON.stringify({
        tutor_message: "What do you think?",
        intent: "ask_probe",
        concept_tags: ["test"],
        hint_level: 0
      });

      const result = (client as any).parseResponse(validJson);
      
      expect(result.success).toBe(true);
      expect(result.data.tutor_message).toBe("What do you think?");
    });

    test('should attempt repair on malformed JSON', () => {
      const malformedJson = `{
        "tutor_message": "What do you think?",
        "intent": "ask_probe",
        "concept_tags": ["test"]
        "hint_level": 0
      }`;

      const result = (client as any).parseResponse(malformedJson);
      
      expect(result.success).toBe(true);
      expect(result.data.tutor_message).toBe("What do you think?");
    });
  });

  describe('repairJSON', () => {
    test('should fix missing comma', () => {
      const broken = '{"a": 1 "b": 2}';
      const fixed = (client as any).repairJSON(broken);
      expect(JSON.parse(fixed)).toEqual({ a: 1, b: 2 });
    });

    test('should fix trailing comma', () => {
      const broken = '{"a": 1, "b": 2,}';
      const fixed = (client as any).repairJSON(broken);
      expect(JSON.parse(fixed)).toEqual({ a: 1, b: 2 });
    });

    test('should fix unescaped quotes in strings', () => {
      const broken = '{"message": "She said "hello" to me"}';
      const fixed = (client as any).repairJSON(broken);
      expect(JSON.parse(fixed)).toEqual({ message: 'She said "hello" to me' });
    });
  });
});