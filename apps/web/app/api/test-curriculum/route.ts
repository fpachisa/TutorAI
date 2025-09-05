import { NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { withCors, preflight } from '../_lib/cors';

export async function OPTIONS() { return preflight(); }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade') || 'primary-6';
    const subject = searchParams.get('subject') || 'mathematics';
    const topic = searchParams.get('topic');
    
    const curriculumPath = join(process.cwd(), '../../curriculum', grade, subject);
    
    if (topic) {
      // Return subtopics for a specific topic
      const topicPath = join(curriculumPath, topic);
      try {
        const subtopicFiles = readdirSync(topicPath).filter(f => f.endsWith('.json'));
        const subtopics = subtopicFiles.map(file => {
          const content = JSON.parse(readFileSync(join(topicPath, file), 'utf8'));
          return {
            id: content.id,
            name: content.metadata.name,
            description: content.metadata.description,
            difficulty: content.metadata.difficulty,
            estimatedTime: content.metadata.estimatedTime,
            icon: content.metadata.icon,
            path: content.path,
            order: content.metadata.order
          };
        }).sort((a, b) => {
          // Sort by order field, fallback to alphabetical by name
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          
          if (a.order !== undefined && b.order === undefined) return -1;
          if (a.order === undefined && b.order !== undefined) return 1;
          
          return a.name.localeCompare(b.name);
        });
        return withCors(NextResponse.json({ subtopics }));
      } catch (error) {
        return withCors(NextResponse.json({ error: `Topic ${topic} not found` }, { status: 404 }));
      }
    } else {
      // Return all topics
      try {
        const topics = readdirSync(curriculumPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => {
            const topicName = dirent.name;
            const topicPath = join(curriculumPath, topicName);
            const subtopicFiles = readdirSync(topicPath).filter(f => f.endsWith('.json'));
            
            // Get first subtopic to extract topic metadata
            if (subtopicFiles.length > 0) {
              const firstSubtopic = JSON.parse(readFileSync(join(topicPath, subtopicFiles[0]), 'utf8'));
              return {
                id: topicName,
                name: topicName.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' '),
                subtopicCount: subtopicFiles.length,
                path: firstSubtopic.path
              };
            }
            return null;
          })
          .filter(Boolean);
        
        return withCors(NextResponse.json({ topics }));
      } catch (error) {
        return withCors(NextResponse.json({ error: 'Failed to load topics' }, { status: 500 }));
      }
    }
  } catch (error) {
    return withCors(NextResponse.json({ error: 'Server error' }, { status: 500 }));
  }
}
