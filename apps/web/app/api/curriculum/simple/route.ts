import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { CurriculumPath, SimpleCurriculumContent } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json() as { path: CurriculumPath };
    
    if (!path || !path.grade || !path.subject || !path.topic || !path.subtopic) {
      return NextResponse.json({
        error: 'Invalid curriculum path. All fields required: grade, subject, topic, subtopic'
      }, { status: 400 });
    }

    // Construct file path to JSON curriculum file
    const curriculumRoot = join(process.cwd(), '../../curriculum');
    const filePath = join(
      curriculumRoot,
      path.grade,
      path.subject,
      path.topic,
      `${path.subtopic}.json`
    );

    // Read and parse JSON file directly
    const fileContent = readFileSync(filePath, 'utf-8');
    const curriculumData: SimpleCurriculumContent = JSON.parse(fileContent);

    // Return the curriculum data as-is (no transformation)
    return NextResponse.json(curriculumData);
    
  } catch (error) {
    console.error('❌ [CurriculumAPI] Failed to load curriculum:', error);
    
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json({
        error: 'Curriculum file not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      error: 'Failed to load curriculum content'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'simple-curriculum-api',
    timestamp: new Date().toISOString()
  });
}