// Generic programmatic seed helpers for simplified curriculum JSON
// Usage (from server code, tests, or scripts):
//   import { upsertFromFile, upsertSimplifiedSubtopic, buildFlowFromSimplified } from '@/lib/seeders/subtopicSeeder';
//   await upsertFromFile('curriculum/primary-6/mathematics/algebra/unknown-letter.json', { seedFlow: true });

import fs from 'fs';
import path from 'path';
import type { ConversationFlow, SubtopicContent, CurriculumPath } from '@/lib/api';
import { curriculumPathToTopicKey } from '@/lib/tutor/types';
import { getAdminDb } from '../firebaseAdmin';
import { initializeApp } from 'firebase/app';
import { getFirestore as getClientFirestore, connectFirestoreEmulator, doc as clientDoc, setDoc } from 'firebase/firestore';

export type SeedOptions = {
  seedFlow?: boolean;
  contentOnly?: boolean;
};

export async function upsertFromFile(filePath: string, opts: SeedOptions = {}) {
  const abs = resolveFilePath(filePath);
  const raw = JSON.parse(fs.readFileSync(abs, 'utf8'));
  return upsertSimplifiedSubtopic(raw, opts);
}

export async function upsertSimplifiedSubtopic(raw: any, opts: SeedOptions = {}) {
  const writer = await getDbWriter();
  const p = raw?.path as CurriculumPath;
  if (!p || !p.grade || !p.subject || !p.topic || !p.subtopic) {
    throw new Error('Invalid simplified JSON: missing path.grade/subject/topic/subtopic');
  }

  const docPath = buildSubtopicDocPath(p);
  await writer.write(docPath, raw);

  if (opts.seedFlow) {
    const flow = buildFlowFromSimplified(raw);
    const flowPath = `${docPath}/flows/main`;
    await writer.write(flowPath, flow);
  }

  return { path: docPath };
}

export function buildSubtopicDocPath(pathObj: CurriculumPath): string {
  const docId = curriculumPathToTopicKey(pathObj); // e.g., primary-6_mathematics_algebra_unknown-letter
  return `curriculum/${docId}`;
}

export function buildFlowFromSimplified(raw: any): ConversationFlow {
  const states: ConversationFlow['states'] = [];
  const transitions: ConversationFlow['transitions'] = [];

  states.push({ id: 'start', intent: 'start' });

  const firstProbe = raw.first_probe as string | undefined;
  const stepProbes = Array.isArray(raw.step_probes) ? raw.step_probes : [];

  if (firstProbe) {
    states.push({ id: 'probe1', intent: 'ask_probe', prompt: firstProbe });
    transitions.push({ from: 'start', on: 'answered', to: 'probe1' });
  } else {
    transitions.push({ from: 'start', on: 'answered', to: 'checkpoint' });
  }

  let lastProbeId = firstProbe ? 'probe1' : 'start';
  stepProbes.forEach((p: any, idx: number) => {
    const probeText = p?.probe || '';
    if (!probeText) return;
    const id = `probe${idx + 2}`;
    states.push({ id, intent: 'ask_probe', prompt: probeText });
    transitions.push({ from: lastProbeId, on: 'good_answer', to: id });
    transitions.push({ from: lastProbeId, on: 'stuck', to: 'hint1' });
    transitions.push({ from: 'hint1', on: 'answered', to: id });
    lastProbeId = id;
  });

  states.push({ id: 'hint1', intent: 'give_hint', prompt: 'Translate each phrase into +, -, ×, or ÷ with the letter.' });

  states.push({ id: 'checkpoint', intent: 'checkpoint', checkpointRef: 'checkpoint_1' });
  transitions.push({ from: lastProbeId, on: 'good_answer', to: 'checkpoint' });
  transitions.push({ from: 'hint1', on: 'answered', to: 'checkpoint' });
  transitions.push({ from: 'checkpoint', on: 'correct', to: 'reflect' });
  transitions.push({ from: 'checkpoint', on: 'wrong', to: 'hint1' });

  const summaryText = Array.isArray(raw.summary_templates) && raw.summary_templates.length > 0
    ? raw.summary_templates[0]
    : 'You represented unknowns with letters and formed expressions like 3p+2 and 2n+5.';

  states.push({ id: 'reflect', intent: 'reflect', prompt: 'What pattern did you use to turn words into algebra?' });
  states.push({ id: 'summary', intent: 'summarize', prompt: summaryText });
  transitions.push({ from: 'reflect', on: 'next', to: 'summary' });

  return { states, transitions };
}

// Optional: transform to full SubtopicContent shape if needed elsewhere
export function toSubtopicContentFromSimplified(raw: any, pathObj: CurriculumPath): SubtopicContent {
  const objectives = raw.objective ? [{ id: 'obj1', description: raw.objective }] : [];
  const socraticLadder = [] as any[];
  if (raw.first_probe) socraticLadder.push({ level: 'L0', type: 'probe', prompt: raw.first_probe });
  (raw.step_probes || []).forEach((p: any, i: number) => {
    if (p?.probe) socraticLadder.push({ level: i < 2 ? 'L1' : 'L2', type: 'probe', prompt: p.probe });
  });

  const itemBank = (raw.quick_checks || []).map((qc: any, i: number) => ({
    id: `qc_${i + 1}`,
    type: 'word_problem',
    difficulty: qc.difficulty || 'E',
    stem: qc.prompt,
    answer: qc.answer,
    worked: [],
    conceptTags: [] as string[],
  }));

  const metadata = raw.metadata || {
    name: raw.name || pathObj.subtopic.replace(/-/g, ' '),
    description: raw.intro_blurb || '',
    difficulty: 'M',
    estimatedTime: 20,
    icon: '📚',
    conceptTags: [],
    moeSyllabusRef: ''
  };

  return {
    id: raw.id || pathObj.subtopic,
    path: pathObj,
    metadata,
    objectives,
    prerequisites: [],
    canonicalPath: [],
    misconceptions: [],
    socraticLadder,
    conversationFlow: buildFlowFromSimplified(raw),
    itemBank,
    checkpoints: []
  } as SubtopicContent;
}

function resolveFilePath(filePath: string): string {
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) return filePath;
  const roots = [
    process.cwd(),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '../..'),
    path.join(process.cwd(), '../../..')
  ];
  for (const root of roots) {
    const candidate = path.join(root, filePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`File not found: ${filePath} (searched under ${roots.join(', ')})`);
}

async function getDbWriter(): Promise<{ write: (docPath: string, data: any) => Promise<void> }> {
  // Try Admin SDK first
  try {
    const adminDb = getAdminDb();
    return {
      write: async (docPath: string, data: any) => {
        await adminDb.doc(docPath).set(data, { merge: true });
      }
    };
  } catch (e) {
    // Fallback to client SDK (emulator or configured project)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project';
    const firebaseConfig = {
      apiKey: 'demo-key',
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.appspot.com`,
      messagingSenderId: '123456789',
      appId: 'demo-app-id'
    } as const;
    const app = initializeApp(firebaseConfig);
    const db = getClientFirestore(app);
    const host = process.env.FIRESTORE_EMULATOR_HOST;
    if (host) {
      const [hostname, portStr] = host.split(':');
      connectFirestoreEmulator(db, hostname || 'localhost', Number(portStr || '8080'));
    }
    return {
      write: async (docPath: string, data: any) => {
        await setDoc(clientDoc(db, docPath), data, { merge: true });
      }
    };
  }
}
