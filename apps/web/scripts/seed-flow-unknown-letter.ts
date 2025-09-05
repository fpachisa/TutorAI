#!/usr/bin/env ts-node

/**
 * Seed a ConversationFlow for the simplified unknown-letter lesson into Firestore.
 * Path: curriculum/grades/primary-6/subjects/mathematics/topics/algebra/subtopics/unknown-letter/flows/main
 *
 * This reads the local JSON at curriculum/primary-6/mathematics/algebra/unknown-letter.json
 * and derives a simple, linear flow using first_probe and step_probes.
 *
 * Emulator: set FIRESTORE_EMULATOR_HOST=localhost:8080 (or USE_EMULATOR=1)
 */

import path from 'path';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';
import { curriculumPathToTopicKey } from '../lib/tutor/types';

type ConversationState = {
  id: string;
  intent: 'start' | 'ask_probe' | 'give_hint' | 'checkpoint' | 'reflect' | 'summarize';
  prompt?: string;
  checkpointRef?: string;
};

type FlowTransition = {
  from: string;
  on: 'stuck' | 'good_answer' | 'correct' | 'wrong' | 'answered' | 'next';
  to: string;
};

async function main() {
  const jsonPath = path.join(__dirname, '../../../curriculum/primary-6/mathematics/algebra/unknown-letter.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Could not find unknown-letter.json at', jsonPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const grade = raw?.path?.grade || 'primary-6';
  const subject = raw?.path?.subject || 'mathematics';
  const topic = raw?.path?.topic || 'algebra';
  const subtopic = raw?.path?.subtopic || 'unknown-letter';

  // Initialize Firebase client (supports emulator)
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

  const states: ConversationState[] = [];
  const transitions: FlowTransition[] = [];

  // Start state
  states.push({ id: 'start', intent: 'start' });

  // Probe states
  const firstProbe = raw.first_probe as string | undefined;
  const stepProbes = Array.isArray(raw.step_probes) ? raw.step_probes : [];

  if (firstProbe) {
    states.push({ id: 'probe1', intent: 'ask_probe', prompt: firstProbe });
    transitions.push({ from: 'start', on: 'answered', to: 'probe1' });
  } else {
    transitions.push({ from: 'start', on: 'answered', to: 'checkpoint' });
  }

  // Add step probes
  let lastProbeId = firstProbe ? 'probe1' : 'start';
  stepProbes.forEach((p: any, idx: number) => {
    const probeText = p?.probe || '';
    if (!probeText) return;
    const id = `probe${idx + 2}`; // probe2, probe3, ...
    states.push({ id, intent: 'ask_probe', prompt: probeText });
    // Success path from previous probe to this one
    transitions.push({ from: lastProbeId, on: 'good_answer', to: id });
    // Stuck path to hint
    transitions.push({ from: lastProbeId, on: 'stuck', to: 'hint1' });
    // From hint back to this probe when answered
    transitions.push({ from: 'hint1', on: 'answered', to: id });
    lastProbeId = id;
  });

  // Hint state (generic)
  states.push({ id: 'hint1', intent: 'give_hint', prompt: 'Think about what the letter stands for and translate the words into +, -, ×, or ÷.' });

  // Checkpoint
  states.push({ id: 'checkpoint', intent: 'checkpoint', checkpointRef: 'checkpoint_1' });
  transitions.push({ from: lastProbeId, on: 'good_answer', to: 'checkpoint' });
  transitions.push({ from: 'hint1', on: 'answered', to: 'checkpoint' });
  transitions.push({ from: 'checkpoint', on: 'correct', to: 'reflect' });
  transitions.push({ from: 'checkpoint', on: 'wrong', to: 'hint1' });

  // Reflect and summary
  const summaryText = Array.isArray(raw.summary_templates) && raw.summary_templates.length > 0
    ? raw.summary_templates[0]
    : 'Great work turning words into algebraic expressions using letters for unknowns!';

  states.push({ id: 'reflect', intent: 'reflect', prompt: 'Nice work! What was the key step you used to form expressions?' });
  states.push({ id: 'summary', intent: 'summarize', prompt: summaryText });
  transitions.push({ from: 'reflect', on: 'next', to: 'summary' });

  const flowDoc = { states, transitions };

  const docId = curriculumPathToTopicKey({ grade, subject, topic, subtopic });
  console.log('🚀 Seeding flow to: curriculum/' + docId + '/flows/main');
  await setDoc(doc(db, 'curriculum', docId, 'flows', 'main'), flowDoc, { merge: true });
  console.log('✅ Flow seeded successfully');
}

main().catch(err => {
  console.error('❌ Seed flow failed:', err);
  process.exit(1);
});
