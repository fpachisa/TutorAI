#!/usr/bin/env node

// Script to populate Firestore with curriculum content
// Usage: node populate-firestore.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection } = require('firebase/firestore');
const fs = require('fs').promises;
const path = require('path');

// Firebase config - use your actual config
const firebaseConfig = {
  // Add your Firebase config here
  projectId: "ai-math-tutor-prod",
  // Other config values...
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadCurriculumFiles(topic = 'fractions') {
  const curriculumDir = path.join(__dirname, 'primary-6', 'mathematics', topic);
  
  try {
    const files = await fs.readdir(curriculumDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const subtopics = [];
    for (const file of jsonFiles) {
      const filePath = path.join(curriculumDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const subtopic = JSON.parse(content);
      subtopics.push(subtopic);
    }
    
    // Sort by order field if present, otherwise alphabetical
    subtopics.sort((a, b) => {
      const aOrder = a.metadata?.order;
      const bOrder = b.metadata?.order;
      
      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder;
      }
      
      if (aOrder !== undefined && bOrder === undefined) return -1;
      if (aOrder === undefined && bOrder !== undefined) return 1;
      
      return (a.metadata?.name || a.id).localeCompare(b.metadata?.name || b.id);
    });
    
    return subtopics;
  } catch (error) {
    console.error('Error loading curriculum files:', error);
    return [];
  }
}

async function populateFirestore(topicName = 'fractions') {
  console.log(`🚀 Starting Firestore population for ${topicName}...`);
  
  try {
    const subtopics = await loadCurriculumFiles(topicName);
    
    if (subtopics.length === 0) {
      console.log(`❌ No subtopics found to populate for ${topicName}`);
      return;
    }
    
    console.log(`📚 Found ${subtopics.length} subtopics to populate for ${topicName}`);
    
    // Create topic metadata first
    const topicPath = `curriculum/grades/primary-6/subjects/mathematics/topics/${topicName}`;
    const topicDisplayNames = {
      'fractions': { name: 'Fractions', description: 'Learn about fractions - addition, subtraction, multiplication, division, and word problems', icon: '🍰' },
      'algebra': { name: 'Algebra', description: 'Learn algebraic concepts - unknowns, expressions, equations, and solving', icon: '🔤' },
      'geometry': { name: 'Geometry', description: 'Learn about shapes, angles, and geometric problem solving', icon: '📐' },
      'measurement': { name: 'Measurement', description: 'Learn about area, volume, and measurement calculations', icon: '📏' },
      'percentage': { name: 'Percentage', description: 'Learn about percentages and their applications', icon: '💯' },
      'ratio': { name: 'Ratio', description: 'Learn about ratios and their relationships', icon: '⚖️' },
      'data-analysis': { name: 'Data Analysis', description: 'Learn to read and interpret data from charts and graphs', icon: '📊' },
      'distance-time-speed': { name: 'Distance, Time & Speed', description: 'Learn relationships between distance, time, and speed', icon: '🏃' }
    };
    
    const topicInfo = topicDisplayNames[topicName] || { name: topicName, description: '', icon: '📚' };
    const topicMetadata = {
      id: topicName,
      name: topicInfo.name,
      description: topicInfo.description,
      icon: topicInfo.icon,
      totalSubtopics: subtopics.length,
      estimatedTime: subtopics.reduce((sum, s) => sum + s.metadata.estimatedTime, 0),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, topicPath), topicMetadata);
    console.log(`✅ Created topic metadata for ${topicInfo.name}`);
    
    // Create each subtopic
    for (const subtopic of subtopics) {
      const subtopicPath = `${topicPath}/subtopics/${subtopic.id}`;
      
      // Main subtopic document
      const subtopicDoc = {
        id: subtopic.id,
        path: subtopic.path,
        metadata: subtopic.metadata,
        objectives: subtopic.objectives,
        prerequisites: subtopic.prerequisites,
        canonicalPath: subtopic.canonicalPath,
        misconceptions: subtopic.misconceptions,
        socraticLadder: subtopic.socraticLadder,
        conversationFlow: subtopic.conversationFlow,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, subtopicPath), subtopicDoc);
      console.log(`✅ Created subtopic: ${subtopic.metadata.name}`);
      
      // Create items collection
      for (const [index, item] of subtopic.itemBank.entries()) {
        const itemPath = `${subtopicPath}/items/item_${index + 1}`;
        await setDoc(doc(db, itemPath), {
          ...item,
          createdAt: new Date()
        });
      }
      console.log(`📝 Added ${subtopic.itemBank.length} items for ${subtopic.metadata.name}`);
      
      // Create assessments (checkpoints) collection
      for (const [index, checkpoint] of subtopic.checkpoints.entries()) {
        const assessmentPath = `${subtopicPath}/assessments/checkpoint_${index + 1}`;
        await setDoc(doc(db, assessmentPath), {
          ...checkpoint,
          type: 'checkpoint',
          createdAt: new Date()
        });
      }
      console.log(`🎯 Added ${subtopic.checkpoints.length} checkpoints for ${subtopic.metadata.name}`);
      
      // Create main conversation flow
      const flowPath = `${subtopicPath}/flows/main`;
      await setDoc(doc(db, flowPath), {
        ...subtopic.conversationFlow,
        createdAt: new Date()
      });
      console.log(`💬 Added conversation flow for ${subtopic.metadata.name}`);
    }
    
    // Create subject-level metadata
    const subjectPath = 'curriculum/grades/primary-6/subjects/mathematics/metadata';
    const subjectMetadata = {
      id: 'mathematics',
      name: 'Primary 6 Mathematics',
      description: 'Complete Primary 6 Mathematics curriculum aligned with MOE syllabus',
      totalTopics: 1, // Currently just fractions
      topics: ['fractions'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, subjectPath), subjectMetadata);
    console.log('✅ Created subject metadata');
    
    // Create progression tracking
    const progressionPath = 'curriculum/grades/primary-6/subjects/mathematics/progression';
    const progression = {
      sequence: ['fractions'],
      dependencies: {
        'fractions': []
      },
      createdAt: new Date()
    };
    
    await setDoc(doc(db, progressionPath), progression);
    console.log('✅ Created progression tracking');
    
    console.log('🎉 Firestore population completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - 1 subject (Mathematics)`);
    console.log(`   - 1 topic (Fractions)`);
    console.log(`   - ${subtopics.length} subtopics`);
    console.log(`   - ${subtopics.reduce((sum, s) => sum + s.itemBank.length, 0)} assessment items`);
    console.log(`   - ${subtopics.reduce((sum, s) => sum + s.checkpoints.length, 0)} checkpoint questions`);
    
  } catch (error) {
    console.error('❌ Error populating Firestore:', error);
  }
}

// Run the script
if (require.main === module) {
  const topicArg = process.argv[2];
  const topicName = topicArg || 'fractions';
  
  console.log(`Running script for topic: ${topicName}`);
  
  populateFirestore(topicName).then(() => {
    console.log('Script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { populateFirestore };