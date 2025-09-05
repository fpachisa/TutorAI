#!/usr/bin/env ts-node

const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const { createClient } = require('@sanity/client')
const fs = require('fs')

// Sanity client configuration
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN, // Need write permissions
  apiVersion: '2024-08-30',
  useCdn: false
})

interface CurriculumData {
  id: string
  path: {
    grade: string
    subject: string
    topic: string
    subtopic: string
  }
  metadata: any
  objectives?: any[]
  prerequisites?: string[]
  canonicalPath?: any[]
  misconceptions?: any[]
  socraticLadder?: any[]
  conversationFlow?: any
  itemBank?: any[]
  checkpoints?: any[]
}

async function findCurriculumFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  
  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      
      if (entry.isDirectory()) {
        traverse(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

function transformCurriculumData(data: CurriculumData): any {
  return {
    _type: 'subtopic',
    _id: `subtopic-${data.path.grade}-${data.path.subject}-${data.path.topic}-${data.path.subtopic}`,
    id: data.id,
    path: data.path,
    metadata: data.metadata,
    objectives: data.objectives || [],
    prerequisites: data.prerequisites || [],
    canonicalPath: data.canonicalPath || [],
    misconceptions: data.misconceptions || [],
    socraticLadder: data.socraticLadder || [],
    conversationFlow: data.conversationFlow,
    itemBank: data.itemBank || [],
    checkpoints: data.checkpoints || []
  }
}

async function migrateToSanity() {
  console.log('🚀 Starting curriculum migration to Sanity...')
  
  // Find curriculum directory relative to script location
  const curriculumDir = path.join(__dirname, '../../../curriculum')
  
  if (!fs.existsSync(curriculumDir)) {
    console.error('❌ Curriculum directory not found:', curriculumDir)
    process.exit(1)
  }
  
  console.log('📂 Scanning curriculum directory:', curriculumDir)
  
  const jsonFiles = await findCurriculumFiles(curriculumDir)
  console.log(`📄 Found ${jsonFiles.length} curriculum JSON files`)
  
  const documents = []
  
  for (const filePath of jsonFiles) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const curriculumData: CurriculumData = JSON.parse(fileContent)
      
      const sanityDocument = transformCurriculumData(curriculumData)
      documents.push(sanityDocument)
      
      console.log(`✅ Processed: ${curriculumData.metadata?.name || curriculumData.id}`)
    } catch (error) {
      console.error(`❌ Error processing file ${filePath}:`, error)
    }
  }
  
  console.log(`\n📦 Preparing to upload ${documents.length} documents to Sanity...`)
  
  // Create a transaction to upload all documents
  const transaction = client.transaction()
  
  for (const doc of documents) {
    transaction.createOrReplace(doc)
  }
  
  try {
    console.log('⏳ Uploading to Sanity...')
    const result = await transaction.commit()
    console.log('🎉 Migration completed successfully!')
    console.log(`📊 Uploaded ${result.results?.length || documents.length} documents`)
    
    // Print summary
    const subjects = new Set(documents.map(d => d.path.subject))
    const topics = new Set(documents.map(d => d.path.topic))
    
    console.log('\n📈 Migration Summary:')
    console.log(`   • Subjects: ${subjects.size} (${Array.from(subjects).join(', ')})`)
    console.log(`   • Topics: ${topics.size}`)
    console.log(`   • Total Subtopics: ${documents.length}`)
    
  } catch (error) {
    console.error('❌ Error uploading to Sanity:', error)
    process.exit(1)
  }
}

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.error('❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable')
  process.exit(1)
}

if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ Missing SANITY_API_TOKEN environment variable')
  console.log('💡 Get a token with write permissions from: https://sanity.io/manage')
  process.exit(1)
}

// Run migration
migrateToSanity().catch(console.error)