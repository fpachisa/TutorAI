#!/usr/bin/env ts-node

/**
 * Seed the simplified unknown-letter curriculum JSON into Firestore
 * Path: curriculum/grades/primary-6/subjects/mathematics/topics/algebra/subtopics/unknown-letter
 *
 * Uses Firebase Admin SDK. Configure via env vars or connect to emulator.
 * - For emulator, set: FIRESTORE_EMULATOR_HOST=localhost:8080
 */

import path from 'path';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';
import { curriculumPathToTopicKey } from '../lib/tutor/types';

async function main() {
  // Resolve JSON file from repo root
  const jsonPath = path.join(__dirname, '../../../curriculum/primary-6/mathematics/algebra/unknown-letter.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Could not find unknown-letter.json at', jsonPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Minimal validation
  if (!raw || !raw.path || !raw.path.subtopic) {
    console.error('❌ Invalid JSON: missing path/subtopic');
    process.exit(1);
  }

  // Initialize Firebase client (works with emulator)
  const firebaseConfig = {
    apiKey: 'demo-key',
    authDomain: 'demo-project.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
    storageBucket: 'demo-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'demo-app-id'
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.USE_EMULATOR === '1') {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('ℹ️ Connected to Firestore emulator at localhost:8080');
  }

  const docId = curriculumPathToTopicKey(raw.path);
  console.log('🚀 Seeding Firestore document: curriculum/' + docId);
  await setDoc(doc(db, 'curriculum', docId), raw, { merge: true });

  console.log('✅ Seeded unknown-letter to Firestore');
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
