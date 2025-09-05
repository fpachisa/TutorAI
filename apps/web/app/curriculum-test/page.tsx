'use client';

import { useState, useEffect } from 'react';

interface Topic {
  id: string;
  name: string;
  subtopicCount: number;
}

interface Subtopic {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  icon: string;
}

export default function CurriculumTest() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/test-curriculum?grade=primary-6&subject=mathematics')
      .then(res => res.json())
      .then(data => {
        setTopics(data.topics);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load topics:', err);
        setLoading(false);
      });
  }, []);

  const handleTopicClick = async (topicId: string) => {
    setSelectedTopic(topicId);
    setLoading(true);
    try {
      const res = await fetch(`/api/test-curriculum?grade=primary-6&subject=mathematics&topic=${topicId}`);
      const data = await res.json();
      setSubtopics(data.subtopics);
    } catch (err) {
      console.error('Failed to load subtopics:', err);
    }
    setLoading(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'E': return 'bg-green-100 text-green-800';
      case 'M': return 'bg-yellow-100 text-yellow-800';  
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading && topics.length === 0) {
    return <div className="p-8">Loading curriculum...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Primary 6 Mathematics Curriculum
      </h1>
      
      <div className="max-w-6xl mx-auto">
        {!selectedTopic ? (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Topics ({topics.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map(topic => (
                <div 
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-blue-500"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {topic.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {topic.subtopicCount} subtopic{topic.subtopicCount !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <button 
                onClick={() => setSelectedTopic(null)}
                className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
              >
                ← Back to Topics
              </button>
              <h2 className="text-2xl font-semibold text-gray-700">
                {topics.find(t => t.id === selectedTopic)?.name} Subtopics ({subtopics.length})
              </h2>
            </div>
            
            {loading ? (
              <div>Loading subtopics...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {subtopics.map(subtopic => (
                  <div 
                    key={subtopic.id}
                    className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{subtopic.icon}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(subtopic.difficulty)}`}>
                        {getDifficultyText(subtopic.difficulty)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {subtopic.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {subtopic.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      ⏱️ {subtopic.estimatedTime} minutes
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}