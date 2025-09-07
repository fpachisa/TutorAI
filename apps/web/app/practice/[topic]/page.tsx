'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PracticePath, PracticeUnit } from '@/components/PracticePath';

interface PracticeData {
  topic: string;
  metadata: {
    total_units: number;
    estimated_time: string;
    description: string;
  };
  units: {
    unit_id: number;
    story_theme: {
      title: string;
      emoji: string;
      intro: string;
    };
    total_questions: number;
  }[];
}

function PracticePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topic = params.topic as string;
  const subtopic = searchParams.get('subtopic');
  
  const [units, setUnits] = useState<PracticeUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPracticeUnits();
  }, [topic]);

  const loadPracticeUnits = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load consolidated practice data
      const response = await fetch(`/curriculum/primary-6/mathematics/${topic}-practice.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${topic} practice data`);
      }
      
      const practiceData: PracticeData = await response.json();
      
      // Transform data and add state information
      const practiceUnits: PracticeUnit[] = practiceData.units.map((unitData, index) => ({
        ...unitData,
        isLocked: index > 0, // Only first unit unlocked for now
        isCompleted: false,
        score: undefined,
        perfectScore: false
      }));

      setUnits(practiceUnits);
    } catch (err) {
      console.error('Failed to load practice units:', err);
      setError(err instanceof Error ? err.message : 'Failed to load practice content');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell showParticles={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted">Loading practice adventures...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell showParticles={false}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="text-danger mb-4">⚠️</div>
          <h1 className="text-2xl font-heading font-bold text-tutor mb-4">Unable to Load Practice</h1>
          <p className="text-muted mb-6">{error}</p>
          <Link href="/chapters" className="btn btn-primary">
            Back to Chapters
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showParticles={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        
        {/* Breadcrumb */}
        <motion.div
          className="flex items-center gap-2 text-sm text-muted mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/chapters" className="hover:text-accent transition-colors">
            Chapters
          </Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <Link 
            href={`/chapters/${topic}`} 
            className="hover:text-accent transition-colors"
          >
            {topic.charAt(0).toUpperCase() + topic.slice(1)}
          </Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span className="text-tutor font-medium">Practice</span>
        </motion.div>

        {/* Practice Path */}
        <PracticePath 
          topic={topic}
          units={units}
          className="mb-8"
        />

        {/* Instructions */}
        <motion.div
          className="text-center mt-12 p-6 bg-surface border border-border rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-heading font-bold text-tutor mb-2">How Practice Works</h3>
          <div className="text-sm text-muted space-y-2">
            <p>🎯 Complete each unit by answering all questions correctly</p>
            <p>📚 Each adventure covers all key algebra concepts</p>
            <p>⭐ Earn perfect scores to unlock bonus achievements</p>
            <p>🔓 New units unlock as you progress through the path</p>
          </div>
        </motion.div>

        {/* Back Navigation */}
        <motion.div
          className="text-center mt-8 pt-6 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Link 
            href={`/chapters/${topic}`}
            className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {topic} lessons
          </Link>
        </motion.div>
      </div>
    </AppShell>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PracticePageContent />
    </Suspense>
  );
}