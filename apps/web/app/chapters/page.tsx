'use client';

import { motion } from 'framer-motion';
import { Calculator, Shapes, Scale, PlusCircle, BarChart3, Package, TrendingUp, PieChart, ArrowRight, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useState, useEffect } from 'react';

interface Topic {
  id: string;
  name: string;
  subtopicCount: number;
}

interface Chapter {
  id: string;
  name: string;
  description: string;
  icon: any;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  subtopicCount: number;
  color: string;
  gradient: string;
}

// Map topic IDs to display data
const getChapterData = (topic: Topic): Chapter => {
  const topicMap: Record<string, Omit<Chapter, 'id' | 'subtopicCount'>> = {
    'fractions': {
      name: 'Fractions',
      description: 'Master fraction operations including division by whole numbers and proper fractions, plus solving complex word problems.',
      icon: Calculator,
      difficulty: 'Intermediate',
      estimatedTime: '75 minutes',
      color: 'text-purple-400',
      gradient: 'from-purple-500 to-violet-500'
    },
    'percentage': {
      name: 'Percentage',
      description: 'Calculate percentages, discounts, and solve percentage word problems in real contexts.',
      icon: PieChart,
      difficulty: 'Intermediate',
      estimatedTime: '85 minutes',
      color: 'text-indigo-400',
      gradient: 'from-indigo-500 to-purple-500'
    },
    'ratio': {
      name: 'Ratio',
      description: 'Understand ratios, their relationship with fractions, and solve real-world ratio problems.',
      icon: Scale,
      difficulty: 'Intermediate',
      estimatedTime: '50 minutes',
      color: 'text-emerald-400',
      gradient: 'from-emerald-500 to-teal-500'
    },
    'distance-time-speed': {
      name: 'Speed',
      description: 'Master speed concepts, unit conversions, and solve multi-step word problems involving motion.',
      icon: TrendingUp,
      difficulty: 'Intermediate',
      estimatedTime: '120 minutes',
      color: 'text-blue-400',
      gradient: 'from-blue-500 to-cyan-500'
    },
    'algebra': {
      name: 'Algebra',
      description: 'Learn to work with unknown letters, simplify expressions, evaluate algebraic terms, and solve linear equations.',
      icon: PlusCircle,
      difficulty: 'Intermediate',
      estimatedTime: '145 minutes',
      color: 'text-rose-400',
      gradient: 'from-rose-500 to-pink-500'
    },
    'measurement': {
      name: 'Measurement',
      description: 'Calculate area and circumference of circles, find volumes of cubes and cuboids, work with dimensions, and master square and cube roots.',
      icon: Package,
      difficulty: 'Intermediate',
      estimatedTime: '230 minutes',
      color: 'text-amber-400',
      gradient: 'from-amber-500 to-orange-500'
    },
    'geometry': {
      name: 'Geometry',
      description: 'Find unknown angles in composite geometric figures involving squares, rectangles, triangles, and other quadrilaterals.',
      icon: Shapes,
      difficulty: 'Intermediate',
      estimatedTime: '40 minutes',
      color: 'text-orange-400',
      gradient: 'from-orange-500 to-red-500'
    },
    'data-analysis': {
      name: 'Data Analysis',
      description: 'Read and interpret pie charts, solve problems using data from tables and graphs.',
      icon: BarChart3,
      difficulty: 'Intermediate',
      estimatedTime: '55 minutes',
      color: 'text-green-400',
      gradient: 'from-green-500 to-emerald-500'
    }
  };

  const data = topicMap[topic.id] || {
    name: topic.name,
    description: 'Learn mathematical concepts and problem-solving skills.',
    icon: Calculator,
    difficulty: 'Intermediate' as const,
    estimatedTime: '30 minutes',
    color: 'text-gray-400',
    gradient: 'from-gray-500 to-slate-500'
  };

  return {
    id: topic.id,
    subtopicCount: topic.subtopicCount,
    ...data
  };
};

export default function ChaptersPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/test-curriculum?grade=primary-6&subject=mathematics')
      .then(res => res.json())
      .then(data => {
        const chapterData = data.topics.map((topic: Topic) => getChapterData(topic));
        setChapters(chapterData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load topics:', err);
        setLoading(false);
      });
  }, []);


  if (loading) {
    return (
      <AppShell showParticles={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-muted">Loading curriculum...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showParticles={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold gradient-text mb-4">
            Choose Your Learning Path
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
          </p>
        </motion.div>

        {/* Chapter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {chapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onHoverStart={() => setHoveredCard(chapter.id)}
              onHoverEnd={() => setHoveredCard(null)}
            >
              <Link href={`/chapters/${chapter.id}`}>
                <motion.div
                  className="group relative bg-surface border border-border rounded-2xl shadow-surface overflow-hidden cursor-pointer"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${chapter.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${chapter.gradient} text-white shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                        <chapter.icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ArrowRight className={`w-4 h-4 ${chapter.color} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`} />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-heading font-semibold text-tutor mb-3 group-hover:text-accent transition-colors duration-300">
                      {chapter.name}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-4 line-clamp-3">
                      {chapter.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          <span>{chapter.subtopicCount} topics</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{chapter.estimatedTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Placeholder */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-xs text-muted mb-2">
                        <span>Progress</span>
                        <span>0%</span>
                      </div>
                      <div className="h-2 bg-surfaceAlt rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${chapter.gradient} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: hoveredCard === chapter.id ? '20%' : 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect Border */}
                  <motion.div
                    className={`absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-gradient-to-r ${chapter.gradient}`}
                    style={{
                      background: `linear-gradient(135deg, transparent 50%, ${chapter.color.replace('text-', '')}20 100%)`
                    }}
                  />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          className="text-center mt-12 pt-8 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-muted">
            Each chapter uses interactive Socratic dialogue to help you discover solutions naturally. 
            No direct answers - just guided thinking! 🧠
          </p>
        </motion.div>
      </div>
    </AppShell>
  );
}