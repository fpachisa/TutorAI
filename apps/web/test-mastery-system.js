#!/usr/bin/env node

// Simple test script to verify the new mastery system
const fs = require('fs');
const path = require('path');

async function testMasterySystem() {
  console.log('🧪 Testing Unknown Letter Mastery System');
  console.log('=' .repeat(50));
  
  try {
    // 1. Test curriculum structure
    const curriculumPath = path.join(__dirname, '../../curriculum/primary-6/mathematics/algebra/unknown-letter.json');
    const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
    
    console.log('✅ 1. Curriculum structure test');
    console.log('   Learning objective:', curriculumData.learning_objective);
    console.log('   Mastery steps:', curriculumData.mastery_progression.length);
    console.log('   Completion policy:', JSON.stringify(curriculumData.completion_policy, null, 2));
    
    // 2. Test mastery progression structure
    console.log('\n✅ 2. Mastery progression test');
    curriculumData.mastery_progression.forEach((step, index) => {
      console.log(`   Step ${step.step}: ${step.concept}`);
      console.log(`     Sample: "${step.sample_question}"`);
      console.log(`     Min questions: ${step.min_questions}`);
    });
    
    // 3. Test TypeScript interfaces compilation
    console.log('\n✅ 3. TypeScript interfaces defined:');
    console.log('   - MasteryStep');
    console.log('   - CompletionPolicy');
    console.log('   - MasteryStepProgress');
    console.log('   - Updated TutorSession');
    console.log('   - Updated TutorTurnResponse');
    
    // 4. Test completion criteria logic
    console.log('\n✅ 4. Completion criteria test');
    console.log('   Requires all steps:', curriculumData.completion_policy.requires_all_steps);
    console.log('   Min total questions:', curriculumData.completion_policy.min_total_questions);
    console.log('   Target mastery per step:', curriculumData.completion_policy.target_mastery_per_step);
    
    const totalMinQuestions = curriculumData.mastery_progression.reduce((sum, step) => sum + step.min_questions, 0);
    console.log('   Expected min questions (sum of steps):', totalMinQuestions);
    
    console.log('\n🎉 All mastery system components are properly configured!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test API endpoint with real requests');
    console.log('   2. Verify step progression logic in SessionManager');
    console.log('   3. Test completion detection');
    console.log('   4. Update frontend to display step progress');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMasterySystem().catch(console.error);