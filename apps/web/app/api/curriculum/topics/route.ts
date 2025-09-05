import { NextRequest, NextResponse } from 'next/server';
import { TopicSummary, SubtopicSummary, CurriculumPath } from '@/lib/api';
import { client } from '@/sanity/lib/client';
import { withCors, preflight } from '../../_lib/cors';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function OPTIONS() { return preflight(); }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    const subject = searchParams.get('subject');

    if (!grade || !subject) {
      return withCors(NextResponse.json(
        { error: 'Grade and subject are required' },
        { status: 400 }
      ));
    }

    // Query Sanity for subtopics matching grade and subject
    const query = `
      *[_type == "subtopic" && path.grade == $grade && path.subject == $subject] {
        id,
        path,
        metadata,
        objectives,
        _id
      }
    `;

    const subtopics = await client.fetch(query, { grade, subject });

    if (!subtopics || subtopics.length === 0) {
      return withCors(NextResponse.json(
        { error: `No curriculum found for ${grade} ${subject}` },
        { status: 404 }
      ));
    }

    // Group subtopics by topic
    const topicsMap = new Map<string, {
      name: string;
      description: string;
      icon: string;
      subtopics: SubtopicSummary[];
      totalEstimatedTime: number;
    }>();

    for (const subtopicData of subtopics) {
      const topicId = subtopicData.path.topic;
      
      if (!topicsMap.has(topicId)) {
        // Initialize topic (we'll use the first subtopic's topic metadata or defaults)
        topicsMap.set(topicId, {
          name: topicId.charAt(0).toUpperCase() + topicId.slice(1).replace(/-/g, ' '),
          description: `${topicId.charAt(0).toUpperCase() + topicId.slice(1).replace(/-/g, ' ')} concepts and skills`,
          icon: '📚', // Default icon, can be customized per topic
          subtopics: [],
          totalEstimatedTime: 0
        });
      }

      const topic = topicsMap.get(topicId)!;
      
      const path: CurriculumPath = {
        grade: subtopicData.path.grade,
        subject: subtopicData.path.subject,
        topic: subtopicData.path.topic,
        subtopic: subtopicData.path.subtopic
      };

      const estimatedTime = subtopicData.metadata?.estimatedTime || 20;

      const subtopic: SubtopicSummary = {
        id: subtopicData.id,
        name: subtopicData.metadata?.name || subtopicData.id,
        description: subtopicData.metadata?.description || '',
        difficulty: subtopicData.metadata?.difficulty || 'M',
        estimatedTime,
        path
      };

      topic.subtopics.push(subtopic);
      topic.totalEstimatedTime += estimatedTime;
    }

    // Convert map to array and sort subtopics within each topic
    const topics: TopicSummary[] = Array.from(topicsMap.entries()).map(([topicId, topicData]) => {
      // Sort subtopics by order field, then by name
      topicData.subtopics.sort((a, b) => {
        const aSubtopic = subtopics.find((s: any) => s.id === a.id);
        const bSubtopic = subtopics.find((s: any) => s.id === b.id);
        
        const aOrder = aSubtopic?.metadata?.order;
        const bOrder = bSubtopic?.metadata?.order;
        
        if (aOrder !== undefined && bOrder !== undefined) {
          return aOrder - bOrder;
        }
        
        if (aOrder !== undefined && bOrder === undefined) return -1;
        if (aOrder === undefined && bOrder !== undefined) return 1;
        
        return a.name.localeCompare(b.name);
      });

      return {
        id: topicId,
        name: topicData.name,
        description: topicData.description,
        subtopics: topicData.subtopics,
        totalEstimatedTime: topicData.totalEstimatedTime,
        icon: topicData.icon
      };
    });

    // Sort topics alphabetically
    topics.sort((a, b) => a.name.localeCompare(b.name));

    return withCors(NextResponse.json(topics));

  } catch (error) {
    console.error('Error fetching topics from Sanity:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    ));
  }
}
