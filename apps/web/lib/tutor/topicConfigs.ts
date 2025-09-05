import type { TopicConfig } from './types';
import type { CurriculumPath } from '../api';

export const TOPIC_CONFIGS: Record<string, TopicConfig> = {
  // Fractions
  'fractions_divide_by_whole': {
    name: 'Dividing Fractions by Whole Numbers',
    description: 'Learn to divide proper fractions by whole numbers using visual models and sharing concepts',
    syllabusCodes: ['4.2.4'],
    objectives: [
      'Understand division of fractions as sharing or partitioning',
      'Use visual models to represent fraction division',
      'Apply division of fractions to solve word problems'
    ],
    commonMisconceptions: [
      'Thinking division always makes numbers smaller',
      'Confusing "divide by" with "divide into"',
      'Not understanding the relationship between fractions and sharing'
    ],
    socraticPrompts: [
      'What does it mean to divide something?',
      'If we have 3/4 of a pizza and share it among 2 people, what are we doing?',
      'How would you show this division using a drawing?'
    ],
    difficultyProgression: [
      'Unit fractions divided by small whole numbers',
      'Simple fractions divided by 2 or 3',
      'Any proper fraction divided by any whole number',
      'Word problems involving fraction division'
    ],
    realWorldContexts: [
      'Sharing food equally among people',
      'Dividing materials for craft projects',
      'Distributing time among activities'
    ],
    keywords: ['divide', 'share', 'fraction', 'parts', 'equal', 'among']
  },
  
  // Algebra
  'algebra_unknown_letter': {
    name: 'Using a Letter to Represent an Unknown Number',
    description: 'Learn to use letters as placeholders for unknown numbers in mathematical expressions',
    syllabusCodes: ['5.1'],
    objectives: [
      'Understand that a letter can represent any number',
      'Use letters to write expressions for word problems',
      'Substitute values for unknown letters'
    ],
    commonMisconceptions: [
      'Treating letters as labels rather than variables',
      'Thinking different letters must represent different numbers',
      'Believing letters represent specific fixed values'
    ],
    socraticPrompts: [
      'What could this letter represent?',
      'If n stands for a number, what would n + 5 mean?',
      'How would you write "5 more than a number" using a letter?'
    ],
    difficultyProgression: [
      'Understanding letters as unknown numbers',
      'Writing simple expressions with one operation',
      'Substituting values into expressions',
      'Creating expressions from word problems'
    ],
    realWorldContexts: [
      'Unknown number of items in a bag',
      'Variable costs or prices',
      'Unknown distances or measurements'
    ],
    keywords: ['letter', 'unknown', 'variable', 'expression', 'represents']
  },
  
  // Ratio and Proportion
  'ratio_word_problems': {
    name: 'Ratio Word Problems',
    description: 'Solve real-world problems involving ratios and proportions',
    syllabusCodes: ['6.1', '6.2'],
    objectives: [
      'Identify ratios in word problems',
      'Set up proportional relationships',
      'Solve ratio problems using various methods'
    ],
    commonMisconceptions: [
      'Confusing ratio order (3:2 vs 2:3)',
      'Adding ratios instead of finding equivalent ratios',
      'Not understanding part-to-part vs part-to-whole ratios'
    ],
    socraticPrompts: [
      'What quantities are being compared?',
      'Is this a part-to-part or part-to-whole ratio?',
      'How can we find equivalent ratios?'
    ],
    difficultyProgression: [
      'Simple 2-term ratios',
      '3-term ratios',
      'Finding missing terms in ratios',
      'Complex word problems with multiple steps'
    ],
    realWorldContexts: [
      'Recipe ingredients',
      'Color mixing',
      'Speed and distance relationships'
    ],
    keywords: ['ratio', 'compare', 'for every', 'proportion', 'equivalent']
  },
  
  // Percentage
  'percentage_word_problems': {
    name: 'Percentage Word Problems',
    description: 'Apply percentage concepts to solve real-world problems',
    syllabusCodes: ['6.3'],
    objectives: [
      'Find percentages of quantities',
      'Calculate percentage increase and decrease',
      'Solve multi-step percentage problems'
    ],
    commonMisconceptions: [
      'Confusing "of" with "more than" in percentage problems',
      'Not understanding that percentages are parts of 100',
      'Mixing up increase/decrease calculations'
    ],
    socraticPrompts: [
      'What does 25% mean?',
      'If something increases by 20%, what happens to the original amount?',
      'How would you find 15% of $80?'
    ],
    difficultyProgression: [
      'Finding simple percentages (10%, 25%, 50%)',
      'Finding any percentage of a number',
      'Percentage increase and decrease',
      'Multi-step percentage problems'
    ],
    realWorldContexts: [
      'Shopping discounts and sales',
      'Test scores and grades',
      'Population changes'
    ],
    keywords: ['percent', 'discount', 'increase', 'decrease', 'of', 'total']
  },
  
  // Geometry
  'unknown_angles_composite_figures': {
    name: 'Finding Unknown Angles in Composite Figures',
    description: 'Use angle properties to find missing angles in complex shapes',
    syllabusCodes: ['3.4'],
    objectives: [
      'Apply angle properties in triangles and quadrilaterals',
      'Find missing angles in composite figures',
      'Use logical reasoning to solve angle problems'
    ],
    commonMisconceptions: [
      'Not recognizing angle relationships',
      'Forgetting that angles in a triangle sum to 180°',
      'Not identifying all the angles in composite figures'
    ],
    socraticPrompts: [
      'What angle relationships do you see?',
      'What do you know about angles in a triangle?',
      'How can we break this complex figure into simpler shapes?'
    ],
    difficultyProgression: [
      'Angles in simple triangles',
      'Angles in quadrilaterals',
      'Angles in composite figures',
      'Complex multi-step angle problems'
    ],
    realWorldContexts: [
      'Architecture and building design',
      'Art and geometric patterns',
      'Navigation and direction finding'
    ],
    keywords: ['angle', 'degrees', 'triangle', 'quadrilateral', 'sum']
  }
};

/**
 * Get topic configuration based on curriculum path
 */
export function getTopicConfig(path: CurriculumPath): TopicConfig {
  // Generate topic key from path
  const topicKey = `${path.topic}_${path.subtopic}`.replace(/-/g, '_');
  
  // Return specific config if available, otherwise return generic config
  return TOPIC_CONFIGS[topicKey] || generateGenericConfig(path);
}

/**
 * Generate a generic topic configuration for topics not in the predefined list
 */
function generateGenericConfig(path: CurriculumPath): TopicConfig {
  const topicName = path.subtopic.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  const subjectName = path.subject.charAt(0).toUpperCase() + path.subject.slice(1);
  
  return {
    name: topicName,
    description: `Learn ${topicName.toLowerCase()} concepts for ${subjectName}`,
    syllabusCodes: ['General'],
    objectives: [
      `Understand ${topicName.toLowerCase()} concepts`,
      `Apply ${topicName.toLowerCase()} to solve problems`,
      `Develop mathematical reasoning skills`
    ],
    commonMisconceptions: [
      'Common conceptual misunderstandings',
      'Procedural errors in calculations',
      'Difficulty connecting concepts to real-world applications'
    ],
    socraticPrompts: [
      'What do you think this problem is asking?',
      'What information do we have?',
      'What would you try first?'
    ],
    difficultyProgression: [
      'Basic concepts and definitions',
      'Simple applications',
      'More complex problems',
      'Real-world applications'
    ],
    realWorldContexts: [
      'Everyday situations',
      'Problem-solving scenarios',
      'Practical applications'
    ],
    keywords: ['problem', 'solve', 'calculate', 'find', 'determine']
  };
}

/**
 * Get Socratic prompts for specific hint levels
 */
export function getSocraticPromptsForLevel(config: TopicConfig, hintLevel: number): string[] {
  const allPrompts = config.socraticPrompts;
  
  switch (hintLevel) {
    case 0: // Initial diagnostic
      return [
        'What is this problem asking you to find?',
        'What information do we have?',
        'What have you tried so far?'
      ];
    case 1: // Gentle guidance
      return allPrompts.slice(0, Math.ceil(allPrompts.length / 2));
    case 2: // More specific hints
      return allPrompts;
    case 3: // Micro-examples needed
      return [
        'Let me show you a simpler example first...',
        'Think about a similar but easier problem...',
        'What if we started with smaller numbers?'
      ];
    default:
      return allPrompts;
  }
}

/**
 * Get appropriate real-world context for the current topic
 */
export function getRealWorldContext(config: TopicConfig): string {
  const contexts = config.realWorldContexts;
  return contexts[Math.floor(Math.random() * contexts.length)];
}

/**
 * Check if a concept is part of the topic's objectives
 */
export function isConceptInObjectives(config: TopicConfig, concept: string): boolean {
  const lowerConcept = concept.toLowerCase();
  return config.objectives.some(objective => 
    objective.toLowerCase().includes(lowerConcept)
  ) || config.keywords.some(keyword =>
    keyword.toLowerCase().includes(lowerConcept) || lowerConcept.includes(keyword.toLowerCase())
  );
}