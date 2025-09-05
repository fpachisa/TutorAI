import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import type { AIResponse } from './types';

export class VertexAIClient {
  private vertexAI: VertexAI;
  private model: any;
  
  constructor() {
    // Get Firebase Admin credentials for Vertex AI authentication
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'ai-math-tutor-prod';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Clear any existing GOOGLE_APPLICATION_CREDENTIALS to prevent conflicts
    const oldCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    // Initialize Vertex AI with proper service account credentials
    let authOptions = {};
    
    if (clientEmail && privateKey) {
      console.log('✅ Using Firebase Admin service account for VertexAI authentication');
      
      // Create a complete service account object
      authOptions = {
        credentials: {
          type: 'service_account',
          project_id: projectId,
          private_key_id: '',
          private_key: privateKey.replace(/\\n/g, '\n'),
          client_email: clientEmail,
          client_id: '',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`
        }
      };
    } else {
      console.warn('⚠️ No Firebase credentials available, falling back to default authentication');
    }
    
    this.vertexAI = new VertexAI({
      project: projectId,
      location: process.env.GOOGLE_CLOUD_REGION || 'asia-southeast1',
      ...authOptions
    });
    
    // Restore the old credentials path if it existed (shouldn't interfere now)
    if (oldCredentialsPath) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = oldCredentialsPath;
    }
    
    // Initialize Gemini 2.5 Flash model
    this.model = this.vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3, // Low temperature for consistent educational responses
        topP: 0.8,
        topK: 20,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
        }
      ]
    });
  }
  
  /**
   * Generate a tutor response using Gemini 2.5 Flash
   */
  async generateResponse(systemPrompt: string, userMessage: string): Promise<AIResponse> {
    try {
      // Construct the full prompt with system instructions
      const fullPrompt = `${systemPrompt}

Current student message: ${userMessage}

Please respond with valid JSON in this exact format:
{
  "tutor_message": "Your Socratic question or response in markdown format",
  "intent": "ask_probe|give_hint|checkpoint|reflect|summarize",
  "concept_tags": ["concept1", "concept2"],
  "hint_level": 0,
  "student_correct": true
}

TUTOR RESPONSE STYLE:
- BE CONVERSATIONAL AND NATURAL - avoid repetitive phrases or templates
- VARY YOUR LANGUAGE - don't use the same expressions repeatedly
- Use standard Markdown formatting (**bold**, *italic*, \`code\`)
- Use LaTeX math expressions: $$x + 5$$ for inline, $$\\frac{1}{2}$$ for block
- Examples of varied encouragement: "Great work!", "Nice thinking!", "That's exactly right!", "Well done!", "Perfect!", "Excellent reasoning!"

MATHEMATICAL EXPRESSIONS:
- Math variables and algebraic expressions MUST use double dollars: $$n + 5$$, $$\\frac{1}{2}$$, $$x^2$$
- Variable expressions: $$4p$$, $$3x$$, $$n + 7$$ (never write as plain text like 4p)
- Operations: Use $$\\times$$ for multiplication, $$\\div$$ for division
- Examples: "The expression $$4p$$ means 4 times $$p$$" NOT "4p means 4 times p"

CURRENCY vs MATH DISTINCTION:
- Currency amounts: Use normal text like "$2", "$0.50", "$10" (NOT $$2$$)
- Math variables: Use double dollars like $$a$$, $$x$$, $$p$$ 
- Correct: "If each apple costs $$a$$ dollars and a drink costs $2..."
- Incorrect: "If each apple costs $$a$$ dollars and a drink costs $$2$$..."


CORRECTNESS ASSESSMENT:
- Set student_correct: true if their answer is mathematically correct
- Set student_correct: false if their answer is wrong or incomplete
- Example: "k + 7" for "a number $$k$$ increased by 7" = student_correct: true

TUTORING GUIDELINES:
- ONE concise guiding question per turn
- Use warm, patient, age-appropriate language
- Stay within Primary 6 Singapore MOE syllabus
- Never give full solutions immediately
- AVOID FORMULAIC RESPONSES - each response should feel unique and natural
- Mix different teaching approaches: encouraging, questioning, explaining, connecting
- Vary your sentence structures and vocabulary to keep the conversation engaging`;

      const response = await this.model.generateContent(fullPrompt);
      
      console.log('🔍 VERTEX DEBUG - Full system prompt:');
      console.log(systemPrompt);
      
      // Enhanced raw response logging
      const responseTimestamp = new Date().toISOString();
      console.log(`\n🔍 VERTEX DEBUG - Raw Response Analysis [${responseTimestamp}]:`);
      console.log('📊 Response Structure:', JSON.stringify(response, null, 2));
      
      // Log response metadata
      if (response?.response) {
        console.log('📈 Response Metadata:');
        console.log('  - Has response object:', !!response.response);
        console.log('  - Response keys:', Object.keys(response.response || {}));
        
        if (response.response.candidates) {
          console.log('  - Candidates count:', response.response.candidates.length);
          console.log('  - First candidate keys:', Object.keys(response.response.candidates[0] || {}));
        }
      }
      
      if (!response || !response.response) {
        console.log('❌ VERTEX DEBUG - No response or response.response');
        return {
          success: false,
          errors: ['No response from AI model']
        };
      }
      
      const candidates = response.response.candidates;
      if (!candidates || candidates.length === 0) {
        console.log('❌ VERTEX DEBUG - No candidates. Candidates:', candidates);
        return {
          success: false,
          errors: ['No candidates in AI response']
        };
      }
      
      const content = candidates[0].content;
      if (!content || !content.parts || content.parts.length === 0) {
        console.log('❌ VERTEX DEBUG - No content parts. Content:', JSON.stringify(content, null, 2));
        return {
          success: false,
          errors: ['No content parts in AI response']
        };
      }
      
      const textContent = content.parts[0].text;
      
      // Pre-processing response analysis with metrics
      console.log('\n📝 VERTEX DEBUG - Raw Text Analysis:');
      console.log('📏 Text Content Metrics:');
      console.log('  - Length (chars):', textContent?.length || 0);
      console.log('  - Line count:', textContent?.split('\n').length || 0);
      console.log('  - Starts with:', textContent?.substring(0, 50) || 'N/A');
      console.log('  - Ends with:', textContent?.substring(-50) || 'N/A');
      console.log('  - Contains opening brace:', textContent?.includes('{') || false);
      console.log('  - Contains closing brace:', textContent?.includes('}') || false);
      console.log('  - Last 100 chars:', textContent?.substring(textContent.length - 100) || 'N/A');
      
      console.log('\n🔍 VERTEX DEBUG - Complete Raw Text Content:');
      console.log('────── START RAW CONTENT ──────');
      console.log(textContent);
      console.log('────── END RAW CONTENT ──────');
      
      if (!textContent) {
        console.log('❌ VERTEX DEBUG - No text content');
        return {
          success: false,
          errors: ['No text content in AI response']
        };
      }
      
      // Try to parse JSON response
      let parsedResponse;
      try {
        // JSON extraction debugging at each step
        console.log('\n🔧 VERTEX DEBUG - JSON Extraction Process:');
        let cleanedText = textContent;
        
        // Step 1: Check for JSON code block
        const jsonBlockMatch = textContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        console.log('🔍 Step 1 - JSON code block match:', !!jsonBlockMatch);
        if (jsonBlockMatch) {
          cleanedText = jsonBlockMatch[1];
          console.log('  - Extracted from code block, length:', cleanedText.length);
          console.log('  - Code block content preview:', cleanedText.substring(0, 100));
        } else {
          // Step 2: Look for JSON object
          const jsonObjectMatch = textContent.match(/\{[\s\S]*\}/);
          console.log('🔍 Step 2 - JSON object match:', !!jsonObjectMatch);
          if (jsonObjectMatch) {
            cleanedText = jsonObjectMatch[0];
            console.log('  - Extracted JSON object, length:', cleanedText.length);
            console.log('  - JSON object preview:', cleanedText.substring(0, 100));
            console.log('  - JSON object ending:', cleanedText.substring(cleanedText.length - 50));
          } else {
            // Step 3: Fallback cleanup
            console.log('🔍 Step 3 - Using fallback cleanup');
            cleanedText = textContent
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .trim();
            console.log('  - After fallback cleanup, length:', cleanedText.length);
          }
        }
        
        // Step 4: Fix JSON issues
        console.log('🔍 Step 4 - Before JSON fixes:');
        console.log('  - Length before fixes:', cleanedText.length);
        console.log('  - Has unescaped newlines in strings:', /("tutor_message":\s*"[^"]*?)\n([^"]*?")/.test(cleanedText));
        
        cleanedText = cleanedText
          // Fix unescaped newlines in strings - replace literal newlines with \n
          .replace(/("tutor_message":\s*"[^"]*?)\n([^"]*?")/g, '$1\\n$2')
          // Handle multiple newlines
          .replace(/("tutor_message":\s*"[^"]*?)(\n+)([^"]*?")/g, (match, p1, p2, p3) => {
            return p1 + p2.replace(/\n/g, '\\n') + p3;
          })
        
        console.log('🔍 Step 5 - Final cleaned text analysis:');
        console.log('  - Final length:', cleanedText.length);
        console.log('  - Starts with {:', cleanedText.trim().startsWith('{'));
        console.log('  - Ends with }:', cleanedText.trim().endsWith('}'));
        console.log('  - Brace balance: { count =', (cleanedText.match(/\{/g) || []).length, ', } count =', (cleanedText.match(/\}/g) || []).length);
        
        console.log('\n📋 VERTEX DEBUG - Final Cleaned Text for Parsing:');
        console.log('────── START CLEANED JSON ──────');
        console.log(cleanedText);
        console.log('────── END CLEANED JSON ──────');
        
        parsedResponse = JSON.parse(cleanedText);
        console.log('✅ VERTEX DEBUG - JSON parsing successful!');
        console.log('🔍 VERTEX DEBUG - Parsed JSON:', parsedResponse);
      } catch (parseError) {
        console.log('❌ VERTEX DEBUG - JSON parse failed:', parseError);
        console.log('❌ VERTEX DEBUG - Parse error type:', parseError.constructor.name);
        console.log('❌ VERTEX DEBUG - Parse error message:', parseError.message);
        console.log('❌ VERTEX DEBUG - Failed text length:', cleanedText?.length || 0);
        console.log('❌ VERTEX DEBUG - Failed text preview:', cleanedText?.substring(0, 200) || 'N/A');
        
        // Don't use fallback with dummy values - this corrupts mastery tracking
        // Instead, fail and let the system retry with better prompting
        return {
          success: false,
          errors: [`AI returned invalid JSON format. Parse error: ${parseError.message}. Response preview: ${cleanedText?.substring(0, 200) || 'N/A'}...`]
        };
      }
      
      // Response validation logging for completeness
      console.log('\n✅ VERTEX DEBUG - Response Validation:');
      console.log('📋 Checking required fields:');
      console.log('  - Has tutor_message:', !!parsedResponse.tutor_message);
      console.log('  - Has intent:', !!parsedResponse.intent);
      console.log('  - Tutor message length:', parsedResponse.tutor_message?.length || 0);
      console.log('  - Intent value:', parsedResponse.intent);
      
      // Check for completeness indicators
      const tutorMessage = parsedResponse.tutor_message || '';
      console.log('📋 Message completeness analysis:');
      console.log('  - Ends with question mark:', tutorMessage.endsWith('?'));
      console.log('  - Ends with period:', tutorMessage.endsWith('.'));
      console.log('  - Ends with exclamation:', tutorMessage.endsWith('!'));
      console.log('  - Last 50 chars:', tutorMessage.substring(tutorMessage.length - 50));
      console.log('  - Contains "Now" (typical follow-up):', tutorMessage.includes('Now'));
      console.log('  - Contains incomplete sentence markers:', tutorMessage.includes('...') || tutorMessage.includes('–') || tutorMessage.includes('—'));
      
      if (!parsedResponse.tutor_message || !parsedResponse.intent) {
        console.log('❌ VERTEX DEBUG - Missing required fields validation failed');
        return {
          success: false,
          errors: ['AI response missing required fields (tutor_message, intent)']
        };
      }
      
      return {
        success: true,
        data: {
          tutor_message: parsedResponse.tutor_message,
          intent: parsedResponse.intent,
          concept_tags: parsedResponse.concept_tags || [],
          hint_level: parsedResponse.hint_level || 0,
          student_correct: parsedResponse.student_correct || false
        }
      };
      
    } catch (error) {
      console.error('VertexAI generation failed:', error);
      
      return {
        success: false,
        errors: [
          error instanceof Error 
            ? `AI generation error: ${error.message}`
            : 'Unknown AI generation error'
        ]
      };
    }
  }
  
  /**
   * Test the connection to Vertex AI
   */
  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.generateResponse(
        'You are a test assistant.',
        'Say "connection successful" in JSON format with fields: tutor_message, intent, concept_tags, hint_level.'
      );
      
      return testResponse.success === true;
    } catch {
      return false;
    }
  }
}