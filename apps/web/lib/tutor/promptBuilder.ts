import type { PromptContext, TutorSession } from './types';
import type { CurriculumPath, SimpleCurriculumContent } from '../api';

export class PromptBuilder {
  /**
   * Build a complete LearnLM system prompt using PARTS template
   */
  static buildPrompt(context: PromptContext, userMessage: string = ''): string {
    const systemInstructions = this.getLearnLMSystemInstructions();
    const partsPrompt = this.buildPARTSPrompt(context);
    const curriculumContext = this.buildCurriculumContext(context.curriculumData);
    const sessionHistory = this.buildSessionHistory(context.sessionContext);
    const adaptiveInstructions = this.buildAdaptiveInstructions(context);
    const currentMessage = userMessage ? `\n\nCurrent student message: ${userMessage}` : '';
    
    return `${systemInstructions}

${partsPrompt}

${curriculumContext}

${sessionHistory}

${adaptiveInstructions}${currentMessage}`;
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
- Ask **exactly one** guiding question per turn.

## Mathematical Expression Formatting
- Math variables and algebraic expressions MUST use double dollars: $$n + 5$$, $$\\frac{1}{2}$$, $$x^2$$
- Variable expressions: $$4p$$, $$3x$$, $$n + 7$$ (never write as plain text like 4p)
- Operations: Use $$\\times$$ for multiplication, $$\\div$$ for division
- Examples: "The expression $$4p$$ means 4 times $$p$$" NOT "4p means 4 times p"

## Currency vs Math Distinction
- Currency amounts: Use normal text like "$2", "$0.50", "$10" (NOT $$2$$)
- Math variables: Use double dollars like $$a$$, $$x$$, $$p$$ 
- Correct: "If each apple costs $$a$$ dollars and a drink costs $2..."
- Incorrect: "If each apple costs $$a$$ dollars and a drink costs $$2$$..."`;
  }
  
  /**
   * Build PARTS template specific to the tutoring context
   */
  private static buildPARTSPrompt(context: PromptContext): string {
    const isFirstTurn = context.turnCount === 1;
    
    // Get data from simplified curriculum
    const topicName = context.curriculumData?.metadata.name || context.topicConfig.name;
    const intro = context.curriculumData?.intro_context || '';
    const firstProbe = context.curriculumData?.mastery_progression?.[0]?.sample_question;
    const objective = context.curriculumData?.learning_objective || context.topicConfig.description;
    
    return `## PARTS Template Context
**Persona**: Supportive Primary 6 Maths coach (Singapore)
**Act**: Coach with one guiding question per turn  
**Recipient**: Primary 6 learner (11–12 years old)
**Theme**: ${topicName}
**Structure**: Socratic loop: diagnose → micro‑step → check → adapt → summarize

## Current Session Context
- Turn number: ${context.turnCount}
- Hint level: ${context.hintLevel}
- Learning objective: ${objective}


${isFirstTurn ? `
## First Turn - Natural Introduction
- This is the first interaction - create a welcoming start to ${topicName.toLowerCase()}
- Reference context: The topic is about ${intro}
- Example question: ${firstProbe}
- Create your own natural introduction and diagnostic question
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
- If the user response indicates frustration, provide a brief worked micro-example before conituning with the current question
- Acknowledge correct answers briefly, then ask the next question
- Use detailed mathematical expression formatting as specified above
- Age-appropriate language for 11-12 year olds

${conceptTagsGuidance}

## JSON FORMAT IS MANDATORY
You MUST respond in this exact JSON structure:
{
  "tutor_message": "Your response here, if the intent is ask_question, it MUST include a question",
  "intent": "ask_question|give_hint|concept_closing",
  "concept_tags": ["${availableConcepts[0] || 'relevant_concept'}"],
  "student_correct": true|false,
  "hint_level": 0|1|2
}

## Intent Usage Guidelines:
- **ask_question**: When posing a completely new question and not a socratic question which you ask to guide the student on current problem
- **give_hint**: When providing guidance, scaffolding, or clarification or asking a socratic question to guide the student on current problem
- **concept_closing**: When wrapping up or summarizing a completed concept`;
    
    return instructions;
  }
  
}
