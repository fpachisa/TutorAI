#!/usr/bin/env node

// Set environment variables for testing
process.env.FIREBASE_PROJECT_ID = 'ai-math-tutor-prod';
process.env.FIREBASE_CLIENT_EMAIL = 'firebase-admin@ai-math-tutor-prod.iam.gserviceaccount.com';
process.env.NODE_ENV = 'development';

// We need the private key - let's get it from Secret Manager first

async function testSessionManager() {
  console.log('🧪 Testing SessionManager with Firebase Admin SDK...');
  
  try {
    // Test creating a session
    console.log('📝 Creating test session...');
    const sessionResult = await SessionManager.getOrCreateSession(
      'test-user-123',
      'test-session-123', 
      'basic-math'
    );
    
    if (sessionResult.success) {
      console.log('✅ Session created successfully:', sessionResult.data?.sessionId);
      
      // Test adding a turn
      console.log('📝 Adding test turn...');
      const turnResult = await SessionManager.addTurn('test-session-123', {
        studentMessage: 'What is 2 + 2?',
        tutorResponse: 'Let me help you think through this...',
        intent: 'ask_probe',
        hintLevel: 0,
        studentFrustrated: false,
        conceptsLearned: []
      });
      
      if (turnResult.success) {
        console.log('✅ Turn added successfully. Total turns:', turnResult.data?.turns?.length);
        console.log('🎉 SessionManager is working correctly with Admin SDK!');
        process.exit(0);
      } else {
        console.error('❌ Failed to add turn:', turnResult.errors);
        process.exit(1);
      }
    } else {
      console.error('❌ Failed to create session:', sessionResult.errors);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.message.includes('client is offline')) {
      console.error('🔍 This is the exact error we need to fix!');
    }
    process.exit(1);
  }
}

testSessionManager();