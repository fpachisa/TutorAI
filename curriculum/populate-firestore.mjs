#!/usr/bin/env node

// Script to populate Firestore with curriculum content
// Usage: node populate-firestore.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config - use your actual config
const firebaseConfig = {
  // Add your Firebase config here
  projectId: "ai-math-tutor-prod",
  // Other config values...
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// All topic directories to process
const TOPIC_DIRECTORIES = [
  'fractions',
  'percentage', 
  'ratio',
  'distance-time-speed',
  'algebra',
  'area-circumference-circle',
  'volume-cube-cuboid'
];

// Topic metadata
const TOPIC_METADATA = {
  fractions: {
    name: 'Fractions',
    description: 'Learn about fractions - addition, subtraction, multiplication, division, and word problems',
    icon: '🍰'
  },
  percentage: {
    name: 'Percentage', 
    description: 'Master percentage calculations, increases/decreases, and real-world applications',
    icon: '💯'
  },
  ratio: {
    name: 'Ratio',
    description: 'Understand ratios, their relationship with fractions, and solve ratio problems',
    icon: '⚖️'
  },
  'distance-time-speed': {
    name: 'Distance, Time and Speed',
    description: 'Explore motion concepts, speed calculations, and solving related word problems', 
    icon: '🏃‍♂️'
  },
  algebra: {
    name: 'Algebra',
    description: 'Introduction to algebraic thinking with unknown variables and simple equations',
    icon: '🔤'
  },
  'area-circumference-circle': {
    name: 'Area and Circumference of Circle',
    description: 'Calculate area and circumference of circles and composite figures',
    icon: '⭕'
  },
  'volume-cube-cuboid': {
    name: 'Volume of Cube and Cuboid', 
    description: 'Find volumes and dimensions of 3D shapes including cubes and cuboids',
    icon: '📦'
  }
};

async function loadCurriculumFiles() {
  const mathDir = path.join(__dirname, 'primary-6', 'mathematics');
  const allSubtopics = [];
  
  try {
    for (const topicDir of TOPIC_DIRECTORIES) {
      const topicPath = path.join(mathDir, topicDir);
      
      try {
        const files = await fs.readdir(topicPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
          const filePath = path.join(topicPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const subtopic = JSON.parse(content);
          allSubtopics.push(subtopic);
        }
      } catch (err) {
        console.log(`⏭️  Skipping ${topicDir} (directory not found or empty)`);
      }
    }
    
    return allSubtopics;
  } catch (error) {
    console.error('Error loading curriculum files:', error);
    return [];
  }
}

async function populateFirestore() {
  console.log('🚀 Starting Firestore population...');
  
  try {
    const subtopics = await loadCurriculumFiles();
    
    if (subtopics.length === 0) {
      console.log('❌ No subtopics found to populate');
      return;
    }
    
    console.log(`📚 Found ${subtopics.length} subtopics to populate`);
    
    // Group subtopics by topic
    const subtopicsByTopic = {};
    subtopics.forEach(subtopic => {
      const topic = subtopic.path.topic;
      if (!subtopicsByTopic[topic]) {
        subtopicsByTopic[topic] = [];
      }
      subtopicsByTopic[topic].push(subtopic);
    });
    
    // Create each topic and its subtopics
    for (const [topicId, topicSubtopics] of Object.entries(subtopicsByTopic)) {
      const topicPath = `curriculum/grades/primary-6/subjects/mathematics/topics/${topicId}`;
      const topicInfo = TOPIC_METADATA[topicId];
      
      // Create topic metadata
      const topicMetadata = {
        id: topicId,
        name: topicInfo?.name || topicId,
        description: topicInfo?.description || `Learn about ${topicId}`,
        icon: topicInfo?.icon || '📚',
        totalSubtopics: topicSubtopics.length,
        estimatedTime: topicSubtopics.reduce((sum, s) => sum + (s.metadata?.estimatedTime || 20), 0),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, topicPath), topicMetadata);
      console.log(`✅ Created topic: ${topicMetadata.name}`);
      
      // Create each subtopic
      for (const subtopic of topicSubtopics) {
        const subtopicPath = `${topicPath}/subtopics/${subtopic.id}`;
        
        // Main subtopic document
        const subtopicDoc = {
          id: subtopic.id,
          path: subtopic.path,
          metadata: subtopic.metadata,
          objectives: subtopic.objectives || [],
          prerequisites: subtopic.prerequisites || [],
          canonicalPath: subtopic.canonicalPath || [],
          misconceptions: subtopic.misconceptions || [],
          socraticLadder: subtopic.socraticLadder || [],
          conversationFlow: subtopic.conversationFlow || { states: [], transitions: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, subtopicPath), subtopicDoc);
        console.log(`  📝 Created subtopic: ${subtopic.metadata?.name || subtopic.id}`);
        
        // Create items collection
        const itemBank = subtopic.itemBank || [];
        for (const [index, item] of itemBank.entries()) {
          const itemPath = `${subtopicPath}/items/item_${index + 1}`;
          await setDoc(doc(db, itemPath), {
            ...item,
            createdAt: new Date()
          });
        }
        if (itemBank.length > 0) {
          console.log(`    🎯 Added ${itemBank.length} items`);
        }
        
        // Create assessments (checkpoints) collection
        const checkpoints = subtopic.checkpoints || [];
        for (const [index, checkpoint] of checkpoints.entries()) {
          const assessmentPath = `${subtopicPath}/assessments/checkpoint_${index + 1}`;
          await setDoc(doc(db, assessmentPath), {
            ...checkpoint,
            type: 'checkpoint',
            createdAt: new Date()
          });
        }
        if (checkpoints.length > 0) {
          console.log(`    ✅ Added ${checkpoints.length} checkpoints`);
        }
        
        // Create main conversation flow
        const flowPath = `${subtopicPath}/flows/main`;
        await setDoc(doc(db, flowPath), {
          ...subtopic.conversationFlow,
          createdAt: new Date()
        });
        console.log(`    💬 Added conversation flow`);
      }
    }
    
    // Create subject-level metadata
    const subjectPath = 'curriculum/grades/primary-6/subjects/mathematics/metadata';
    const subjectMetadata = {
      id: 'mathematics',
      name: 'Primary 6 Mathematics',
      description: 'Complete Primary 6 Mathematics curriculum aligned with MOE syllabus',
      totalTopics: Object.keys(subtopicsByTopic).length,
      topics: Object.keys(subtopicsByTopic),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, subjectPath), subjectMetadata);
    console.log('✅ Created subject metadata');
    
    // Create progression tracking
    const progressionPath = 'curriculum/grades/primary-6/subjects/mathematics/progression';
    const progression = {
      sequence: Object.keys(subtopicsByTopic),
      dependencies: Object.keys(subtopicsByTopic).reduce((deps, topic) => {
        deps[topic] = []; // No dependencies for now
        return deps;
      }, {}),
      createdAt: new Date()
    };
    
    await setDoc(doc(db, progressionPath), progression);
    console.log('✅ Created progression tracking');
    
    console.log('🎉 Firestore population completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - 1 subject (Mathematics)`);
    console.log(`   - ${Object.keys(subtopicsByTopic).length} topics`);
    console.log(`   - ${subtopics.length} subtopics`);
    console.log(`   - ${subtopics.reduce((sum, s) => sum + (s.itemBank?.length || 0), 0)} assessment items`);
    console.log(`   - ${subtopics.reduce((sum, s) => sum + (s.checkpoints?.length || 0), 0)} checkpoint questions`);
    
  } catch (error) {
    console.error('❌ Error populating Firestore:', error);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateFirestore().then(() => {
    console.log('Script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}