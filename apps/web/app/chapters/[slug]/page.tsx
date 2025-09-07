'use client';

import { motion } from 'framer-motion';
import { Calculator, Clock, Star, ArrowRight, ChevronLeft, Shapes, Scale, PlusCircle, BarChart3, Package, TrendingUp, PieChart } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useState, useEffect } from 'react';

interface Subtopic {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  icon: string;
  isCompleted?: boolean;
  masteryScore?: number;
}

interface ChapterInfo {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  estimatedTime: string;
}

// Map topic IDs to display data (same as in main chapters page)
const getChapterInfo = (topicId: string): ChapterInfo => {
  const topicMap: Record<string, ChapterInfo> = {
    'fractions': {
      id: 'fractions',
      name: 'Fractions',
      description: 'Master fraction operations including division by whole numbers and proper fractions, plus solving complex word problems.',
      icon: Calculator,
      estimatedTime: '75 minutes',
      color: 'text-purple-400',
      gradient: 'from-purple-500 to-violet-500'
    },
    'percentage': {
      id: 'percentage',
      name: 'Percentage',
      description: 'Calculate percentages, discounts, and solve percentage word problems in real contexts.',
      icon: PieChart,
      estimatedTime: '85 minutes',
      color: 'text-indigo-400',
      gradient: 'from-indigo-500 to-purple-500'
    },
    'ratio': {
      id: 'ratio',
      name: 'Ratio',
      description: 'Understand ratios, their relationship with fractions, and solve real-world ratio problems.',
      icon: Scale,
      estimatedTime: '50 minutes',
      color: 'text-emerald-400',
      gradient: 'from-emerald-500 to-teal-500'
    },
    'distance-time-speed': {
      id: 'distance-time-speed',
      name: 'Speed',
      description: 'Master speed concepts, unit conversions, and solve multi-step word problems involving motion.',
      icon: TrendingUp,
      estimatedTime: '120 minutes',
      color: 'text-blue-400',
      gradient: 'from-blue-500 to-cyan-500'
    },
    'algebra': {
      id: 'algebra',
      name: 'Algebra',
      description: 'Learn to work with unknown letters, simplify expressions, evaluate algebraic terms, and solve linear equations.',
      icon: PlusCircle,
      estimatedTime: '145 minutes',
      color: 'text-rose-400',
      gradient: 'from-rose-500 to-pink-500'
    },
    'measurement': {
      id: 'measurement',
      name: 'Measurement',
      description: 'Calculate area and circumference of circles, find volumes of cubes and cuboids, work with dimensions, and master square and cube roots.',
      icon: Package,
      estimatedTime: '230 minutes',
      color: 'text-amber-400',
      gradient: 'from-amber-500 to-orange-500'
    },
    'geometry': {
      id: 'geometry',
      name: 'Geometry',
      description: 'Find unknown angles in composite geometric figures involving squares, rectangles, triangles, and other quadrilaterals.',
      icon: Shapes,
      estimatedTime: '40 minutes',
      color: 'text-orange-400',
      gradient: 'from-orange-500 to-red-500'
    },
    'data-analysis': {
      id: 'data-analysis',
      name: 'Data Analysis',
      description: 'Read and interpret pie charts, solve problems using data from tables and graphs.',
      icon: BarChart3,
      estimatedTime: '55 minutes',
      color: 'text-green-400',
      gradient: 'from-green-500 to-emerald-500'
    }
  };

  return topicMap[topicId] || {
    id: topicId,
    name: topicId.charAt(0).toUpperCase() + topicId.slice(1),
    description: 'Learn mathematical concepts and problem-solving skills.',
    icon: Calculator,
    estimatedTime: '30 minutes',
    color: 'text-gray-400',
    gradient: 'from-gray-500 to-slate-500'
  };
};

export default function ChapterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [chapter, setChapter] = useState<ChapterInfo | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSubtopic, setHoveredSubtopic] = useState<string | null>(null);

  useEffect(() => {
    // Load chapter info and subtopics
    const chapterInfo = getChapterInfo(slug);
    setChapter(chapterInfo);

    // Fetch subtopics from API
    fetch(`/api/test-curriculum?grade=primary-6&subject=mathematics&topic=${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.subtopics) {
          const mappedSubtopics = data.subtopics.map((subtopic: any) => ({
            ...subtopic,
            isCompleted: false,
            masteryScore: 0
          }));
          setSubtopics(mappedSubtopics);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load subtopics:', err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted">Loading chapter...</p>
        </div>
      </AppShell>
    );
  }

  if (!chapter || subtopics.length === 0) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <h1 className="text-2xl font-heading font-bold text-tutor mb-4">Chapter Not Found</h1>
          <p className="text-muted mb-6">The chapter you're looking for doesn't exist or has no subtopics.</p>
          <Link href="/chapters" className="btn btn-primary">
            Back to Chapters
          </Link>
        </div>
      </AppShell>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'E': return 'text-success bg-success/10 border-success/20';
      case 'M': return 'text-warn bg-warn/10 border-warn/20';
      case 'C': return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-muted bg-surfaceAlt border-border';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'E': return 'Easy';
      case 'M': return 'Medium';
      case 'C': return 'Challenging';
      default: return 'Unknown';
    }
  };

  const completedCount = subtopics.filter(subtopic => subtopic.isCompleted).length;
  const progressPercent = (completedCount / subtopics.length) * 100;

  return (
    <AppShell showParticles={false}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        
        {/* Breadcrumb */}
        <motion.div
          className="flex items-center gap-2 text-sm text-muted mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/chapters" className="hover:text-accent transition-colors">
            Chapters
          </Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span className="text-tutor font-medium">{chapter.name}</span>
        </motion.div>

        {/* Chapter Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${chapter.gradient} text-white shadow-soft`}>
              <chapter.icon className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold gradient-text mb-2">
                {chapter.name}
              </h1>
              <p className="text-base text-muted max-w-2xl">
                {chapter.description}
              </p>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-tutor">Your Progress</h3>
              <span className="text-sm text-muted">
                {completedCount} of {subtopics.length} completed
              </span>
            </div>
            
            <div className="h-2 bg-surfaceAlt rounded-full overflow-hidden mb-2">
              <motion.div
                className={`h-full bg-gradient-to-r ${chapter.gradient} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted">
              <span>{Math.round(progressPercent)}% Complete</span>
              <span>
                {subtopics.reduce((total, subtopic) => total + subtopic.estimatedTime, 0)} min total
              </span>
            </div>
          </div>
        </motion.div>

        {/* Subtopics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {subtopics.map((subtopic, index) => (
            <motion.div
              key={subtopic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="group relative bg-surface border border-border rounded-2xl shadow-surface overflow-hidden h-full cursor-pointer"
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${chapter.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative p-8">
                  {/* Header */}
                  <div className="flex items-start justify-start mb-6">
                    <div className="w-10 h-10 rounded-xl bg-surfaceAlt text-muted flex items-center justify-center text-base font-bold group-hover:scale-110 transition-transform duration-300">
                      {index + 1}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-heading font-semibold text-tutor mb-8 leading-relaxed min-h-[4rem] flex items-center group-hover:text-accent transition-colors duration-300">
                    {subtopic.name}
                  </h3>

                  {/* Learn/Practice Buttons */}
                  <div className="space-y-12">
                    <Link href={`/tutor?grade=primary-6&subject=mathematics&topic=${slug}&subtopic=${subtopic.id}`}>
                      <motion.button
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-base transition-all shadow-md hover:shadow-lg"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-xl">🎓</span>
                        <span>Learn</span>
                      </motion.button>
                    </Link>
                    
                    <Link href={`/practice/${slug}?subtopic=${subtopic.id}`}>
                      <motion.button
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-base transition-all shadow-md hover:shadow-lg"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-xl">🎯</span>
                        <span>Practice</span>
                      </motion.button>
                    </Link>
                  </div>

                  {/* Completion Badge */}
                  {subtopic.isCompleted && (
                    <div className="absolute top-6 right-6">
                      <div className="w-7 h-7 bg-success rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Back to Chapters */}
        <motion.div
          className="text-center mt-8 pt-6 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Link 
            href="/chapters"
            className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to all chapters
          </Link>
        </motion.div>
      </div>
    </AppShell>
  );
}