import { describe, test, expect } from '@jest/globals';
import { SafetySystem } from '@/lib/tutor/safety';

describe('SafetySystem', () => {
  describe('sanitizeStudentInput', () => {
    test('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> world';
      const result = SafetySystem.sanitizeStudentInput(input);
      expect(result).toBe('Hello  world');
    });

    test('should remove javascript protocols', () => {
      const input = 'javascript:alert("test")';
      const result = SafetySystem.sanitizeStudentInput(input);
      expect(result).toBe('alert("test")');
    });

    test('should truncate very long messages', () => {
      const input = 'a'.repeat(600);
      const result = SafetySystem.sanitizeStudentInput(input);
      expect(result.length).toBeLessThanOrEqual(503); // 500 + '...'
    });

    test('should preserve normal mathematical content', () => {
      const input = 'I think 3/4 ÷ 2 = 3/8';
      const result = SafetySystem.sanitizeStudentInput(input);
      expect(result).toBe(input);
    });
  });

  describe('detectFrustration', () => {
    test('should detect "I don\'t know"', () => {
      expect(SafetySystem.detectFrustration("I don't know")).toBe(true);
      expect(SafetySystem.detectFrustration("i dont know")).toBe(true);
    });

    test('should detect "idk"', () => {
      expect(SafetySystem.detectFrustration('idk')).toBe(true);
      expect(SafetySystem.detectFrustration('IDK this is hard')).toBe(true);
    });

    test('should detect confusion indicators', () => {
      expect(SafetySystem.detectFrustration('I am confused')).toBe(true);
      expect(SafetySystem.detectFrustration('This is confusing')).toBe(true);
      expect(SafetySystem.detectFrustration('I am stuck')).toBe(true);
    });

    test('should not detect normal responses', () => {
      expect(SafetySystem.detectFrustration('I think it is 3/8')).toBe(false);
      expect(SafetySystem.detectFrustration('Let me try again')).toBe(false);
      expect(SafetySystem.detectFrustration('Maybe 1/4?')).toBe(false);
    });
  });

  describe('detectFrustrationFromHistory', () => {
    test('should detect repeated frustration indicators', () => {
      const messages = ['I don\'t know', 'idk', 'still confused'];
      expect(SafetySystem.detectFrustrationFromHistory(messages)).toBe(true);
    });

    test('should not trigger on single instance', () => {
      const messages = ['I don\'t know', 'Let me think', 'Maybe 3/8?'];
      expect(SafetySystem.detectFrustrationFromHistory(messages)).toBe(false);
    });
  });

  describe('validateTutorResponse', () => {
    test('should reject direct answers', () => {
      const response = 'The answer is 3/8.';
      const result = SafetySystem.validateTutorResponse(response);
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('Contains direct answer or solution');
    });

    test('should reject obvious direct answer patterns', () => {
      const responses = [
        'The answer is 5',
        'Final answer: 3/8',
        'Your answer should be 7'
      ];
      
      responses.forEach(response => {
        const result = SafetySystem.validateTutorResponse(response);
        expect(result.passed).toBe(false);
        expect(result.violations).toContain('Contains direct answer or solution');
      });
    });

    test('should allow contextual mathematical statements', () => {
      const responses = [
        'When we have 3/4 ÷ 2, what operation helps us share?',
        'If x + 3 = 7, what could x be? Think about it.',
        'So you got 0.375. Does that make sense for this problem?',
        'Your work shows 1/4. What do you think about that result?'
      ];
      
      responses.forEach(response => {
        const result = SafetySystem.validateTutorResponse(response);
        expect(result.passed).toBe(true);
      });
    });

    test('should reject overly prescriptive instructions', () => {
      const responses = [
        "Here's how to do it: multiply the numerator by 4",
        "Follow these exact steps: first add 3, then divide by 2"
      ];
      
      responses.forEach(response => {
        const result = SafetySystem.validateTutorResponse(response);
        expect(result.passed).toBe(false);
        expect(result.violations).toContain('Contains direct instruction instead of Socratic questioning');
      });
    });

    test('should allow educational guidance', () => {
      const responses = [
        'What operation do you think would help us solve this?',
        'Can you try a different approach?',
        'Think about what happens when we share something equally.',
        'What step might come next in solving this equation?'
      ];
      
      responses.forEach(response => {
        const result = SafetySystem.validateTutorResponse(response);
        expect(result.passed).toBe(true);
      });
    });

    test('should require questions or prompts', () => {
      const response = 'That is correct.';
      const result = SafetySystem.validateTutorResponse(response);
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('Should end with question or prompt to engage student');
    });

    test('should pass good Socratic responses', () => {
      const responses = [
        'What do you think happens when we divide by 2?',
        'Can you try multiplying 3/4 by 1/2?',
        'Let\'s think about sharing this pizza. How much would each person get?'
      ];
      
      responses.forEach(response => {
        const result = SafetySystem.validateTutorResponse(response);
        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
      });
    });

    test('should filter profanity', () => {
      const response = 'Don\'t be stupid, just think about it!';
      const result = SafetySystem.validateTutorResponse(response);
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('Contains inappropriate language');
      expect(result.filteredText).toContain('[filtered]');
    });

    test('should reject overly long responses', () => {
      const response = 'a'.repeat(1100);
      const result = SafetySystem.validateTutorResponse(response);
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('Response too long (should be ≤1000 characters)');
    });
  });

  describe('validateSocraticMethod', () => {
    test('should require questions', () => {
      const response = 'That is correct. Well done.';
      const result = SafetySystem.validateSocraticMethod(response);
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('No questions found - should use Socratic questioning');
    });

    test('should reject overly prescriptive language', () => {
      const response = 'You must first multiply, then you need to simplify, and you should check your work.';
      const result = SafetySystem.validateSocraticMethod(response);
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('Too prescriptive - should guide with questions instead');
    });

    test('should reject overly complex language', () => {
      const response = 'Subsequently, you should accommodate the predominantly complex methodology?';
      const result = SafetySystem.validateSocraticMethod(response);
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('Language too complex for Primary 6 students');
    });

    test('should pass good Socratic responses', () => {
      const response = 'What do you think happens when we share 3/4 among 3 friends?';
      const result = SafetySystem.validateSocraticMethod(response);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('detectMethodologyLeak', () => {
    test('should detect AI system references', () => {
      const responses = [
        'As an AI model, I can help you',
        'My training data suggests',
        'The Vertex AI system recommends',
        'According to my prompts'
      ];
      
      responses.forEach(response => {
        expect(SafetySystem.detectMethodologyLeak(response)).toBe(true);
      });
    });

    test('should not flag normal tutoring language', () => {
      const responses = [
        'Let\'s try a different approach',
        'What method would you like to use?',
        'This is a great learning opportunity'
      ];
      
      responses.forEach(response => {
        expect(SafetySystem.detectMethodologyLeak(response)).toBe(false);
      });
    });
  });

  describe('performComprehensiveCheck', () => {
    test('should catch multiple violations', () => {
      const response = 'The answer is 3/8. You must multiply by 1/2.';
      const result = SafetySystem.performComprehensiveCheck(response);
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);
    });

    test('should pass clean Socratic responses', () => {
      const response = 'What happens when you multiply 3/4 by 1/2?';
      const result = SafetySystem.performComprehensiveCheck(response);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('validateContentLength', () => {
    test('should reject content exceeding max length', () => {
      const content = 'a'.repeat(600);
      const result = SafetySystem.validateContentLength(content, 500);
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('exceeds maximum length');
    });

    test('should accept content within limits', () => {
      const content = 'This is a normal length message.';
      const result = SafetySystem.validateContentLength(content, 500);
      expect(result.success).toBe(true);
    });
  });
});