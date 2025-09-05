import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, collection } from 'firebase/firestore';

// Initialize Firebase for seeding (must use localhost for emulator)
const firebaseConfig = {
  apiKey: 'demo-key',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'demo-project',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'demo-app-id'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
connectFirestoreEmulator(db, 'localhost', 8080);

async function seedData() {
  console.log('Seeding curriculum data...');
  
  // Seed the specific subtopic: primary-6/mathematics/algebra/unknown-letter
  const subtopicPath = 'curriculum/grades/primary-6/subjects/mathematics/topics/algebra/subtopics/unknown-letter';
  
  const subtopicData = {
    metadata: {
      name: 'Unknown Letter',
      description: 'Introduction to algebraic expressions with unknown letters',
      difficulty: 'M',
      estimatedTime: 25,
      icon: '🔤',
      conceptTags: ['algebra', 'variables', 'expressions'],
      moeSyllabusRef: 'P6-ALG-01'
    },
    objectives: [
      'Understand what an unknown letter represents in mathematics',
      'Identify unknown letters in simple algebraic expressions',
      'Substitute values for unknown letters'
    ],
    prerequisites: [
      'Basic arithmetic operations',
      'Understanding of numbers and patterns'
    ],
    canonicalPath: [
      'Introduce the concept of unknown letters',
      'Show examples with real-world contexts',
      'Practice identifying unknowns',
      'Practice substitution'
    ],
    misconceptions: [
      'Unknown letters are just random letters',
      'Variables always represent the same value',
      'Letters in math work the same as in spelling'
    ],
    socraticLadder: [
      'What do you think this letter might represent?',
      'Can you think of a situation where we might not know a number?',
      'If x represents the number of apples, what would x + 2 mean?'
    ],
    conversationFlow: {
      states: ['introduction', 'exploration', 'practice', 'assessment'],
      transitions: [
        { from: 'introduction', to: 'exploration', trigger: 'understanding_shown' },
        { from: 'exploration', to: 'practice', trigger: 'concept_grasped' },
        { from: 'practice', to: 'assessment', trigger: 'ready_for_test' }
      ]
    }
  };
  
  await setDoc(doc(db, subtopicPath), subtopicData);
  
  // Add some sample items to the item bank
  const itemsRef = collection(db, `${subtopicPath}/items`);
  await setDoc(doc(itemsRef, 'item1'), {
    type: 'example',
    content: 'If x = 5, what is x + 3?',
    solution: '8',
    difficulty: 'easy'
  });
  
  await setDoc(doc(itemsRef, 'item2'), {
    type: 'practice',
    content: 'Sara has y stickers. She gives away 4 stickers. How many stickers does she have left?',
    solution: 'y - 4',
    difficulty: 'medium'
  });
  
  // Add a sample checkpoint
  const assessmentRef = collection(db, `${subtopicPath}/assessments`);
  await setDoc(doc(assessmentRef, 'checkpoint1'), {
    type: 'checkpoint',
    title: 'Understanding Unknown Letters',
    questions: [
      {
        question: 'What does the letter n represent in the expression n + 7?',
        options: ['The number 7', 'Any number', 'The letter n'],
        correct: 1
      }
    ],
    passingScore: 0.7
  });
  
  console.log('✅ Seeded subtopic: unknown-letter');
  
  // Also seed some basic structure for other parts
  const topicPath = 'curriculum/grades/primary-6/subjects/mathematics/topics/algebra';
  await setDoc(doc(db, topicPath), {
    name: 'Algebra',
    description: 'Introduction to algebraic thinking',
    subtopics: ['unknown-letter']
  });
  
  console.log('✅ Seeded topic: algebra');
  console.log('🎉 Data seeding complete!');
  process.exit(0);
}

seedData().catch(console.error);