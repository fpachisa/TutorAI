#!/usr/bin/env node

// Load required env from the environment. Do NOT hardcode secrets here.
const requiredEnv = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const missing = requiredEnv.filter((k) => !process.env[k] || !String(process.env[k]).trim());
if (missing.length) {
  console.error(`Missing required env vars for Firebase Admin: ${missing.join(', ')}`);
  console.error('Set them in a local .env file (ignored by git) or your shell before running.');
  process.exit(1);
}

// Test Firebase Admin connection directly
import { getAdminDb } from './apps/web/lib/firebaseAdmin.js';

async function testFirebaseConnection() {
  console.log('🧪 Testing Firebase Admin SDK connection...');
  
  try {
    const db = getAdminDb();
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    // Test basic Firestore operation
    console.log('📝 Testing basic Firestore operation...');
    const testDoc = db.collection('test').doc('connection-test');
    await testDoc.set({ 
      timestamp: new Date(),
      test: 'Firebase Admin SDK connection test' 
    });
    
    const docSnap = await testDoc.get();
    if (docSnap.exists) {
      console.log('✅ Successfully wrote and read from Firestore:', docSnap.data());
      
      // Clean up test document
      await testDoc.delete();
      console.log('✅ Test document cleaned up');
      
      console.log('🎉 Firebase Admin SDK is working correctly!');
      process.exit(0);
    } else {
      console.error('❌ Document was not found after writing');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK test failed:', error.message);
    if (error.message.includes('client is offline')) {
      console.error('🔍 Found the "client is offline" error - this confirms the issue!');
    }
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testFirebaseConnection();
