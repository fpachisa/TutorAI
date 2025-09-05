const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

console.log('Environment Variables:')
console.log('NEXT_PUBLIC_SANITY_PROJECT_ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
console.log('NEXT_PUBLIC_SANITY_DATASET:', process.env.NEXT_PUBLIC_SANITY_DATASET)
console.log('SANITY_API_TOKEN:', process.env.SANITY_API_TOKEN ? 'Set' : 'Not set')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-08-30',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function testSanity() {
  try {
    console.log('\nTesting Sanity connection...')
    const result = await client.fetch('*[_type == "subtopic"] | order(_createdAt desc) [0..2] { _id, "name": metadata.name }')
    console.log('✅ Connection successful!')
    console.log('Sample data:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  }
}

testSanity()