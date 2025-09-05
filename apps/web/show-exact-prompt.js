#!/usr/bin/env node

// Shows the EXACT prompt sent to AI (as assembled in vertexClient.generateResponse)
const fs = require('fs');
const path = require('path');

async function showExactPrompt() {
  console.log('🎯 EXACT AI PROMPT - What Actually Gets Sent to Gemini');
  console.log('=' .repeat(80));
  
  try {
    // Load curriculum data
    const curriculumPath = path.join(__dirname, '../../curriculum/primary-6/mathematics/algebra/unknown-letter.json');
    const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
    
    // This is the systemPrompt from PromptBuilder.buildPrompt()
    const systemPrompt = buildFullSystemPrompt(curriculumData);
    
    // This is what gets sent to Vertex AI (from vertexClient.generateResponse)
    const userMessage = "I don't understand what n means in n + 5";
    
    const fullPrompt = `${systemPrompt}

Current student message: ${userMessage}
Please respond with valid JSON in this exact format:
{
  "tutor_message": "Your Socratic question or response in markdown format",
  "intent": "ask_probe|give_hint|checkpoint|reflect|summarize",
  "concept_tags": ["array", "of", "relevant", "concept", "tags"],
  "hint_level": 0,
  "student_correct": false
}`;

    console.log('📤 FINAL PROMPT SENT TO GEMINI 2.5 FLASH:');
    console.log('─' .repeat(80));
    console.log(fullPrompt);
    console.log('─' .repeat(80));
    
    console.log('\n🔍 KEY SECTIONS BREAKDOWN:');
    console.log('1. System Instructions (pedagogy, safety, tone)');
    console.log('2. PARTS Template (context, objective, current step)');  
    console.log('3. Mastery Progression (4 steps with sample questions)');
    console.log('4. Session History (previous turns, progress tracking)');
    console.log('5. Student Message (current input)');
    console.log('6. JSON Response Format (required structure)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function buildFullSystemPrompt(curriculumData) {
  // This mimics the PromptBuilder.buildPrompt() method
  const systemInstructions = `# System Instructions — Primary 6 Maths Socratic Tutor (LearnLM → Gemini 2.5 Flash)

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

  const partsPrompt = `## PARTS Template Context
**P**ersona: Supportive Primary 6 Maths coach (Singapore)
**A**ct: Coach with one guiding question per turn  
**R**ecipient: Primary 6 learner (11–12 years old, currently engaged)
**T**heme: Using a Letter to Represent an Unknown Number
**S**tructure: Socratic loop: diagnose → micro‑step → check → adapt → summarize

## Current Session Context
- Turn number: 3
- Hint level: 0
- Student frustration detected: No

## Learning Objective
Use letters to represent unknown numbers and write simple algebraic expressions from word statements

## Context
In math, we use letters like n, x, or a to represent numbers we don't know yet. Today you'll learn to write expressions using these letters.`;

  const curriculumContext = `## Curriculum Reference Materials
### Learning Objective
${curriculumData.learning_objective}

### Context Introduction
${curriculumData.intro_context}

### Mastery Progression (Follow this step-by-step approach)
${curriculumData.mastery_progression.map(step => 
  `**Step ${step.step} - ${step.concept}:**
  - Sample Question: "${step.sample_question}"
  - Minimum Questions: ${step.min_questions}
  - Success Criteria: ${step.mastery_criteria}
`).join('\n')}

### Completion Policy
- Requires all steps: ${curriculumData.completion_policy.requires_all_steps ? 'Yes' : 'No'}
- Minimum total questions: ${curriculumData.completion_policy.min_total_questions}
- Target mastery per step: ${curriculumData.completion_policy.target_mastery_per_step * 100}%`;

  const sessionHistory = `## Previous Conversation History
Student: What is algebra?
Tutor: Great question! Algebra uses letters to represent numbers we don't know. What do you think 'n' might represent?

## Session Progress
- Total turns: 2
- Overall mastery score: 0%
- Current mastery step: 1
- Frustrated turns: 0
- Current hint level: 0

### Step-by-Step Progress
**Step 1 (variable_meaning):** 0/2 correct (0% mastery)
**Step 2 (basic_addition_subtraction):** 0/3 correct (0% mastery)
**Step 3 (multiplication_notation):** 0/2 correct (0% mastery)
**Step 4 (combined_operations):** 0/2 correct (0% mastery)`;

  const adaptiveInstructions = `## Response Format (JSON REQUIRED)
Return your response as valid JSON with this structure:
{
  "tutor_message": "Your Socratic question or guidance here",
  "intent": "ask_probe|give_hint|checkpoint|reflect|summarize",
  "concept_tags": ["relevant_concept_tags"],
  "hint_level": 0,
  "student_correct": false
}

## Current Focus
- You are currently on mastery step: 1
- Focus on the current step's concept before moving forward
- Use the sample questions as inspiration, but create your own variations
- Only advance to next step when current step shows mastery`;

  return `${systemInstructions}

${partsPrompt}

${curriculumContext}

${sessionHistory}

${adaptiveInstructions}`;
}

// Run the test
showExactPrompt().catch(console.error);