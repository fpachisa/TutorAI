'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Sparkles, Calculator, Shapes, Scale, BookOpen } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CurriculumAPI, TopicSummary, SubtopicSummary, utils } from '@/lib/api';

interface TopicSelectProps {
  grade?: string;
  subject?: string;
  className?: string;
}

const iconMap = {
  Calculator,
  Shapes,
  Scale,
  BookOpen,
  '🍰': () => <span className="text-lg">🍰</span>,
  '🔄': () => <span className="text-lg">🔄</span>,
  '🧩': () => <span className="text-lg">🧩</span>,
  '📚': () => <span className="text-lg">📚</span>,
};

/**
 * 🎯 TopicSelect - Dynamic topic and subtopic selection component
 */
export function TopicSelect({ 
  grade = 'primary-6', 
  subject = 'mathematics', 
  className = '' 
}: TopicSelectProps) {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicSummary | null>(null);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [isSubtopicOpen, setIsSubtopicOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified: just show a message since we're testing with direct URLs
  const loadTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // For simplified testing, we don't need topic selection
    setTopics([]);
    setIsLoading(false);
  }, [grade, subject]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const handleTopicSelect = (topic: TopicSummary) => {
    setSelectedTopic(topic);
    setIsTopicOpen(false);
    setIsSubtopicOpen(true);
  };

  const handleSubtopicSelect = (subtopic: SubtopicSummary) => {
    // Navigate to tutor page with curriculum path
    const params = utils.pathToUrlParams(subtopic.path);
    router.push(`/tutor?${params.toString()}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'E': return 'text-success bg-success/10';
      case 'M': return 'text-warn bg-warn/10';
      case 'C': return 'text-danger bg-danger/10';
      default: return 'text-muted bg-surfaceAlt';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'E': return 'Easy';
      case 'M': return 'Medium';
      case 'C': return 'Challenge';
      default: return difficulty;
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || iconMap['📚'];
    return typeof IconComponent === 'function' ? <IconComponent /> : IconComponent;
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-16 bg-surface border border-border rounded-xl mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-surface border border-border rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-danger mb-2">⚠️</div>
          <p className="text-foreground font-medium mb-2">Unable to Load Topics</p>
          <p className="text-muted text-sm mb-4">{error}</p>
          <button
            onClick={loadTopics}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accentAlt transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Topic Selection */}
      <div className="relative">
        <motion.button
          onClick={() => setIsTopicOpen(!isTopicOpen)}
          className={`
            w-full p-4 bg-surface border border-border rounded-xl text-left
            flex items-center justify-between transition-all
            hover:border-accent/40 hover:bg-surfaceHover cursor-pointer
            ${isTopicOpen ? 'border-accent shadow-glow' : 'shadow-surface'}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            {selectedTopic ? (
              <>
                <div className="p-2 rounded-lg bg-gradient-primary text-white shadow-soft">
                  {getIcon(selectedTopic.icon)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground text-base">{selectedTopic.name}</h3>
                  <p className="text-sm text-muted line-clamp-2">{selectedTopic.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedTopic.totalEstimatedTime} min total
                    </span>
                    <span>{selectedTopic.subtopics.length} subtopics</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 rounded-lg bg-surfaceAlt text-muted">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-muted text-base">Choose a topic</h3>
                  <p className="text-sm text-muted">Select what you'd like to learn</p>
                </div>
              </>
            )}
          </div>

          <motion.div
            animate={{ rotate: isTopicOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted" />
          </motion.div>
        </motion.button>

        {/* Topics Dropdown */}
        <AnimatePresence>
          {isTopicOpen && (
            <motion.div
              className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-float overflow-hidden z-dropdown"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-2">
                {topics.map((topic, index) => (
                  <motion.button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic)}
                    className={`
                      w-full p-3 rounded-lg text-left flex items-center gap-3
                      hover:bg-surfaceHover transition-colors
                      ${selectedTopic?.id === topic.id ? 'bg-accent/5 border border-accent/20' : ''}
                    `}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`p-2 rounded-lg ${selectedTopic?.id === topic.id ? 'bg-accent text-white' : 'bg-surfaceAlt text-accent'}`}>
                      {getIcon(topic.icon)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground text-sm">{topic.name}</h4>
                      </div>
                      <p className="text-xs text-muted line-clamp-1">{topic.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {topic.totalEstimatedTime} min
                        </span>
                        <span>{topic.subtopics.length} lessons</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {topics.length === 0 && (
                <div className="p-4 text-center text-muted">
                  <p className="text-sm">No topics available for {grade} {subject}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtopic Selection */}
      {selectedTopic && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Choose a lesson from {selectedTopic.name}
            </h3>
            <button
              onClick={() => {
                setSelectedTopic(null);
                setIsSubtopicOpen(false);
              }}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Change Topic
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedTopic.subtopics.map((subtopic, index) => (
              <motion.button
                key={subtopic.id}
                onClick={() => handleSubtopicSelect(subtopic)}
                className="p-4 bg-surface hover:bg-surfaceHover border border-border hover:border-accent/40 rounded-xl text-left transition-all group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-surfaceAlt group-hover:bg-accent group-hover:text-white transition-colors text-accent">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground text-sm line-clamp-2">
                        {subtopic.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getDifficultyColor(subtopic.difficulty)}`}>
                        {getDifficultyLabel(subtopic.difficulty)}
                      </span>
                    </div>
                    <p className="text-xs text-muted line-clamp-2 mb-2">
                      {subtopic.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="w-3 h-3" />
                      <span>{subtopic.estimatedTime} minutes</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Click outside to close */}
      {(isTopicOpen || isSubtopicOpen) && (
        <div 
          className="fixed inset-0 z-backdrop" 
          onClick={() => {
            setIsTopicOpen(false);
            setIsSubtopicOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default TopicSelect;