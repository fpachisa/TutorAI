#!/usr/bin/env node

// Test script to show exactly how AI prompts are generated from the new JSON structure
const fs = require('fs');
const path = require('path');

// Mock the required modules and classes
class MockPromptBuilder {
  static buildPrompt(context) {
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
  
  static getLearnLMSystemInstructions() {
    return `# System Instructions — Primary 6 Maths Socratic Tutor (LearnLM → Gemini 2.5 Flash)

## Role & Tone
- You are a **supportive Primary 6 Mathematics coach** for Singapore MOE syllabus.
- **Never give full solutions immediately.** Use **Socratic questioning**: ask one concise guiding question per turn, then wait.
- Keep tone **warm, confident, patient, curious**. Use simple, age-appropriate language.

## Pedagogical Behaviors (required)
1. **Active learning**: Prompt the student to explain thinking before you explain.
2. **Manage cognitive load**: Break problems into **small steps** (one step per turn). Use numbered steps and short sentences.
3. **Metacognition**: Ask learners to check, estimate, or compare strategies.
4. **Curiosity**: Ask "what if…?" and connect to concrete examples (money, time, distances).
5. **Adaptive difficulty**: If 2 mistakes in a row → give a worked **micro‑example**. If correct twice → **increase difficulty** slightly.`;
  }
  
  static buildPARTSPrompt(context) {
    const isFirstTurn = context.turnCount === 1;
    const frustrationLevel = context.detectedFrustration ? 'frustrated' : 'engaged';
    
    // Get data from simplified curriculum
    const topicName = context.curriculumData?.metadata.name || context.topicConfig.name;
    const intro = context.curriculumData?.intro_context || '';
    const firstProbe = context.curriculumData?.mastery_progression?.[0]?.sample_question || 'What do you already know about this topic?';
    const objective = context.curriculumData?.learning_objective || context.topicConfig.description;
    
    return `## PARTS Template Context
**P**ersona: Supportive Primary 6 Maths coach (Singapore)
**A**ct: Coach with one guiding question per turn  
**R**ecipient: Primary 6 learner (11–12 years old, currently ${frustrationLevel})
**T**heme: ${topicName}
**S**tructure: Socratic loop: diagnose → micro‑step → check → adapt → summarize

## Current Session Context
- Turn number: ${context.turnCount}
- Hint level: ${context.hintLevel}
- Student frustration detected: ${context.detectedFrustration ? 'Yes (provide micro-example)' : 'No'}

## Learning Objective
${objective}

## Context
${intro}

${isFirstTurn ? `
## Starting Instructions
- This is the first turn in the session
- Begin with a warm greeting and brief context about ${topicName}
- Example probe direction: ${firstProbe}
- Create your own natural introduction and diagnostic question
- Use Socratic method - understand what they know before teaching
- Set intent = "ask_probe" and hint_level = 0 in your JSON.
` : ''}`;
  }
  
  static buildCurriculumContext(curriculumData) {
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
  - Minimum Questions: ${step.min_questions}
  - Success Criteria: ${step.mastery_criteria}
`).join('\n') || '- No progression defined'}

### Completion Policy
- Requires all steps: ${curriculumData.completion_policy?.requires_all_steps ? 'Yes' : 'No'}
- Minimum total questions: ${curriculumData.completion_policy?.min_total_questions || 'Not specified'}
- Target mastery per step: ${(curriculumData.completion_policy?.target_mastery_per_step || 0) * 100}%`;
  }
  
  static buildSessionHistory(session) {
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
  `**Step ${step.step} (${step.concept}):** ${step.questionsCorrect}/${step.questionsAsked} correct (${Math.round(step.masteryScore * 100)}% mastery)${step.completed ? ' ✓ COMPLETED' : ''}`
).join('\n')}` : ''}`;
  }
  
  static buildAdaptiveInstructions(context) {
    return `## Response Format (JSON REQUIRED)
Return your response as valid JSON with this structure:
{
  "tutor_message": "Your Socratic question or guidance here",
  "intent": "ask_probe|give_hint|checkpoint|reflect|summarize",
  "concept_tags": ["relevant_concept_tags"],
  "hint_level": ${context.hintLevel},
  "student_correct": false
}

## Current Focus
- You are currently on mastery step: ${context.sessionContext.currentMasteryStep || 1}
- Focus on the current step's concept before moving forward
- Use the sample questions as inspiration, but create your own variations
- Only advance to next step when current step shows mastery`;
  }
}

async function testPromptGeneration() {
  console.log('🤖 AI Prompt Generation Test');
  console.log('=' .repeat(60));
  
  try {
    // Load curriculum data
    const curriculumPath = path.join(__dirname, '../../curriculum/primary-6/mathematics/algebra/unknown-letter.json');
    const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
    
    // Create mock context for different scenarios
    const scenarios = [
      {
        name: "First Turn - New Session",
        context: {
          turnCount: 1,
          hintLevel: 0,
          detectedFrustration: false,
          curriculumData: curriculumData,
          topicConfig: { name: "Unknown Letters", description: "Basic algebra with variables" },
          sessionContext: {
            turns: [],
            masteryScore: 0,
            currentMasteryStep: 1,
            frustratedTurns: 0,
            currentHintLevel: 0,
            masteryStepProgress: []
          }
        }
      },
      {
        name: "Mid-Session - Step 2 with Progress",
        context: {
          turnCount: 5,
          hintLevel: 1,
          detectedFrustration: false,
          curriculumData: curriculumData,
          topicConfig: { name: "Unknown Letters", description: "Basic algebra with variables" },
          sessionContext: {
            turns: [
              { studentMessage: "What does n mean?", tutorMessage: "Good question! What do you think n represents in 'n + 5'?" },
              { studentMessage: "A number?", tutorMessage: "Exactly! Now, can you write 'a number plus 3' using a letter?" }
            ],
            masteryScore: 0.25,
            currentMasteryStep: 2,
            frustratedTurns: 0,
            currentHintLevel: 1,
            masteryStepProgress: [
              { step: 1, concept: "variable_meaning", questionsAsked: 3, questionsCorrect: 2, masteryScore: 0.8, completed: true },
              { step: 2, concept: "basic_addition_subtraction", questionsAsked: 2, questionsCorrect: 1, masteryScore: 0.6, completed: false }
            ]
          }
        }
      }
    ];
    
    scenarios.forEach((scenario, index) => {
      console.log(`\n📝 Scenario ${index + 1}: ${scenario.name}`);
      console.log('─'.repeat(50));
      
      const prompt = MockPromptBuilder.buildPrompt(scenario.context);
      console.log(prompt);
      
      if (index < scenarios.length - 1) {
        console.log('\n' + '='.repeat(60));
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPromptGeneration().catch(console.error);