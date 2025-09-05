import type { PromptContext, TutorSession } from './types';
import type { CurriculumPath, SimpleCurriculumContent } from '../api';

export class PromptBuilder {
  /**
   * Build a complete LearnLM system prompt using PARTS template
   */
  static buildPrompt(context: PromptContext): string {
    const systemInstructions = this.getLearnLMSystemInstructions();
    const partsPrompt = this.buildPARTSPrompt(context);
    const curriculumContext = this.buildCurriculumContext(context.curriculumData);
    const sessionHistory = this.buildSessionHistory(context.sessionContext);
    const adaptiveInstructions = this.buildAdaptiveInstructions(context);
    
    return `${systemInstructions}

${partsPrompt}

${curriculumContext}

${sessionHistory}

${adaptiveInstructions}`;
  }
  
  /**
   * Core LearnLM system instructions from guidelines
   */
  private static getLearnLMSystemInstructions(): string {
    return `

## Role & Tone
- You are a **supportive Primary 6 Mathematics coach** for Singapore MOE syllabus.
- **Never give full solutions immediately.** Use **Socratic questioning**: ask one concise guiding question per turn, then wait.
- Keep tone **warm, confident, patient, curious**. Use simple, age-appropriate language.

## Pedagogical Behaviors (required)
1. **Active learning**: Prompt the student to explain thinking before you explain.
2. **Manage cognitive load**: Break problems into **small steps** (one step per turn). Use numbered steps and short sentences.
3. **Metacognition**: Ask learners to check, estimate, or compare strategies.
4. **Curiosity**: Ask "what if…?" and connect to concrete examples (money, time, distances).
5. **Adaptive difficulty**: If 2 mistakes in a row → give a worked **micro‑example**. If correct twice → **increase difficulty** slightly.

## Safety & Boundaries
- Avoid judgmental language; praise effort ("Good attempt—let's check the units").
- If asked for the full answer: give a **high-level outline first**, then ask permission to reveal calculations.
- Keep content within **Primary 6** topics; **strictly no deviation** from it.

## Questions Variety
- Sample questions provide a starting point and very raw, use your creativity to create intersting questions based on the sample
- Use a variety of question types: open-ended, multiple-choice, true/false, estimation.


## Tool/Format Hints
- Use **math formatting** when useful: \`\\frac{a}{b}\`, \`\\times\`, \`\\div\`, superscripts for units.
- Keep each message **≤ 6 short lines**, unless the student asks for a full solution.
- Ask **exactly one** guiding question per turn.`;
  }
  
  /**
   * Build PARTS template specific to the tutoring context
   */
  private static buildPARTSPrompt(context: PromptContext): string {
    const isFirstTurn = context.turnCount === 1;
    const frustrationLevel = context.detectedFrustration ? 'frustrated' : 'engaged';
    
    // Get data from simplified curriculum
    const topicName = context.curriculumData?.metadata.name || context.topicConfig.name;
    const intro = context.curriculumData?.intro_context || '';
    const firstProbe = context.curriculumData?.mastery_progression?.[0]?.sample_question;
    const objective = context.curriculumData?.learning_objective || context.topicConfig.description;
    
    return `## PARTS Template Context
**Persona**: Supportive Primary 6 Maths coach (Singapore)
**Act**: Coach with one guiding question per turn  
**Recipient**: Primary 6 learner (11–12 years old, currently ${frustrationLevel})
**Theme**: ${topicName}
**Structure**: Socratic loop: diagnose → micro‑step → check → adapt → summarize

## Current Session Context
- Turn number: ${context.turnCount}
- Hint level: ${context.hintLevel}
- Student frustration detected: ${context.detectedFrustration ? 'Yes (provide micro-example)' : 'No'}
- Learning objective: ${objective}

## Constraints for This Turn
- Maximum 6 lines per response
- ${context.detectedFrustration ? 'PRIORITY: Give one worked micro-example due to frustration' : 'Continue Socratic questioning'}

${isFirstTurn ? `
## First Turn - Natural Introduction
- This is the first interaction - create a welcoming start to ${topicName.toLowerCase()}
- Reference context: The topic is about ${intro}
- Example question: ${firstProbe}
- Create your own natural introduction and diagnostic question
- Use Socratic method - understand what they know before teaching
` : ''}`;
  }
  
  /**
   * Build curriculum-specific context from simplified JSON data
   */
  private static buildCurriculumContext(curriculumData?: SimpleCurriculumContent): string {
    if (!curriculumData) {
      return '## Curriculum Context\n- Pure AI-driven approach - no fallbacks';
    }

    return `## Curriculum Reference Materials
### Learning Objective
${curriculumData.learning_objective}

### Context Introduction
${curriculumData.intro_context}

### Mastery Progression (Follow this step-by-step approach)
${curriculumData.mastery_progression?.map(step => 
  `**Step ${step.step} - ${step.concept}:**
  - Sample Question: "${step.sample_question}"
  - Required Questions: ${step.question_count}
  - Success Criteria: ${step.mastery_criteria}
`).join('\n') || '- No progression defined'}

### Completion Policy
- Requires all steps: ${curriculumData.completion_policy?.requires_all_steps ? 'Yes' : 'No'}
- Total questions: ${curriculumData.completion_policy?.total_questions || 'Not specified'}
`;
  }
  
  /**
   * Build session history for context
   */
  private static buildSessionHistory(session: TutorSession): string {
    if (!session.turns || session.turns.length === 0) {
      return '## Session History\n- This is the first interaction in this session';
    }
    
    const recentTurns = session.turns.slice(-3); // Last 3 turns for context
    const historyText = recentTurns.map(turn => 
      `Student: ${turn.studentMessage}\nTutor: ${turn.tutorMessage}`
    ).join('\n\n');
    
    return `## Previous Conversation History
${historyText}

## Session Progress
- Total turns: ${session.turns.length}
- Overall mastery score: ${Math.round((session.masteryScore || 0) * 100)}%
- Current mastery step: ${session.currentMasteryStep || 1}
- Frustrated turns: ${session.frustratedTurns}
- Current hint level: ${session.currentHintLevel}

${session.masteryStepProgress && session.masteryStepProgress.length > 0 ? 
`### Step-by-Step Progress
${session.masteryStepProgress.map(step => 
  `**Step ${step.step} (${step.concept}):** ${step.questionsAsked} questions asked${step.completed ? ' ✓ COMPLETED' : ''}`
).join('\n')}` : ''}`;
  }
  
  /**
   * Build adaptive instructions based on student progress
   */
  private static buildAdaptiveInstructions(context: PromptContext): string {
    let instructions = '\n## Adaptive Instructions for This Turn\n';
    
    if (context.detectedFrustration) {
      instructions += '- CRITICAL: Student is frustrated. Provide a simple worked micro-example first\n';
      instructions += '- Use encouraging language: "Good attempt! Let\'s try a simpler version first"\n';
      instructions += '- Break into the smallest possible step\n';
    } else if (context.hintLevel >= 2) {
      instructions += '- Student may need more scaffolding\n';
      instructions += '- Consider providing a concrete example or bar model\n';
    }
    
    if (context.turnCount === 1) {
      instructions += '- This is the first turn - start with: "What is the question asking you to find?"\n';
    }
    
    // Add step progression constraints
    if (context.sessionContext?.masteryStepProgress && context.curriculumData?.mastery_progression) {
      const currentStep = context.sessionContext.currentMasteryStep || 1;
      const currentStepIndex = currentStep - 1;
      const stepProgress = context.sessionContext.masteryStepProgress[currentStepIndex];
      const stepConfig = context.curriculumData.mastery_progression[currentStepIndex];
      
      if (stepProgress && stepConfig && !stepProgress.completed) {
        const questionsRemaining = Math.max(0, stepConfig.question_count - stepProgress.questionsAsked);
        
        instructions += `\n## ⚠️ CRITICAL STEP PROGRESSION RULES - STRICTLY ENFORCED ⚠️\n`;
        instructions += `- **ABSOLUTE REQUIREMENT**: You MUST ONLY use concept tag "${stepConfig.concept}" for this turn\n`;
        instructions += `- **MINIMUM QUESTIONS**: ${questionsRemaining} more questions needed for "${stepConfig.concept}"\n`;
      }
    }
    
    // Add concept tags guidance
    const availableConcepts = context.curriculumData?.mastery_progression?.map(step => step.concept) || [];
    const conceptTagsGuidance = availableConcepts.length > 0 
      ? `\n## Available Concept Tags (use these for tracking progress)
${availableConcepts.map(concept => `- "${concept}"`).join('\n')}

**IMPORTANT**: Always include the concept tag that matches what you're teaching/testing right now.`
      : '';

    instructions += `\n## Response Requirements
- **CRITICAL**: Always respond in valid JSON format - never plain text
- **MANDATORY**: if the intent is "ask_question", then your response MUST include a question that requires student input/answer
- Acknowledge correct answers briefly, then ask the next question
- Use math formatting: \\frac{a}{b}, \\times, \\div
- Keep response under 6 lines
- Age-appropriate language for 11-12 year olds

${conceptTagsGuidance}

## JSON FORMAT IS MANDATORY
You MUST respond in this exact JSON structure:
{
  "tutor_message": "Your response here",
  "intent": "ask_question|give_hint|concept_closing",
  "concept_tags": ["${availableConcepts[0] || 'relevant_concept'}"]
}

## Intent Usage Guidelines:
- **ask_question**: When posing a new question that requires student input/answer (counts toward required questions)
- **give_hint**: When providing guidance, scaffolding, or clarification without asking a question (doesn't count)
- **concept_closing**: When wrapping up or summarizing a completed concept (doesn't count)`;
    
    return instructions;
  }
  
  /**
   * Quick prompt for specific scenarios
   */
  static buildQuickPrompt(scenario: 'first_turn' | 'frustrated' | 'checkpoint' | 'summary', context: any): string {
    const baseInstructions = this.getLearnLMSystemInstructions();
    
    switch (scenario) {
      case 'first_turn':
        return `${baseInstructions}

You are starting a new tutoring session. Ask one diagnostic question to understand what the student is trying to solve and what they've attempted so far.

Student's message: "${context.studentMessage}"
Topic: ${context.topicName}

Ask: "What is the question asking you to find?" or similar diagnostic probe.`;
        
      case 'frustrated':
        return `${baseInstructions}

The student is showing frustration (2+ incorrect attempts). Provide a simple worked micro-example first, then ask one follow-up question.

Current problem context: ${context.problemContext}
Student's recent attempts: ${context.recentAttempts}

Give a tiny worked example, then ask one confirming question.`;
        
      case 'checkpoint':
        return `${baseInstructions}

Time for a mastery checkpoint. Ask one assessment question to check understanding of: ${context.conceptToCheck}

Make it concrete and age-appropriate.`;
        
      case 'summary':
        return `${baseInstructions}

Student has solved the problem successfully. Provide a 2-line recap and suggest one practice variant.

Problem solved: ${context.solvedProblem}
Key concept: ${context.keyConcept}`;
        
      default:
        return baseInstructions;
    }
  }
}
