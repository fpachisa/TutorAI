'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Ruler, Divide, Plus, Minus, X, Equal, MoreHorizontal } from 'lucide-react';

interface MathTemplate {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'algebra' | 'fractions' | 'geometry' | 'measurement' | 'general';
  svg?: string;
  description?: string;
}

interface MathTemplatesProps {
  onTemplateSelect?: (templateId: string) => void;
  activeCategory?: string;
  className?: string;
}

/**
 * 📐 MathTemplates - Pre-built mathematical templates for Primary 6 students
 */
export function MathTemplates({ onTemplateSelect, activeCategory = 'general', className = '' }: MathTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategory);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const templates: MathTemplate[] = [
    // General Templates
    {
      id: 'number-line',
      name: 'Number Line',
      icon: Ruler,
      category: 'general',
      description: 'Horizontal number line for counting and ordering',
      svg: `
        <svg viewBox="0 0 400 60" className="w-full h-full">
          <line x1="20" y1="30" x2="380" y2="30" stroke="currentColor" strokeWidth="2"/>
          ${Array.from({length: 11}, (_, i) => `
            <line x1="${20 + i * 36}" y1="25" x2="${20 + i * 36}" y2="35" stroke="currentColor" strokeWidth="1"/>
            <text x="${20 + i * 36}" y="50" textAnchor="middle" fontSize="12" fill="currentColor">${i}</text>
          `).join('')}
        </svg>
      `
    },
    {
      id: 'coordinate-grid',
      name: 'Coordinate Grid',
      icon: MoreHorizontal,
      category: 'general',
      description: '10x10 coordinate grid for plotting points',
      svg: `
        <svg viewBox="0 0 200 200" className="w-full h-full">
          ${Array.from({length: 11}, (_, i) => `
            <line x1="${20 + i * 16}" y1="20" x2="${20 + i * 16}" y2="180" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
            <line x1="20" y1="${20 + i * 16}" x2="180" y2="${20 + i * 16}" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
          `).join('')}
          <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="2"/>
          <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" strokeWidth="2"/>
        </svg>
      `
    },

    // Algebra Templates  
    {
      id: 'balance-scale',
      name: 'Balance Scale',
      icon: Equal,
      category: 'algebra',
      description: 'Visual balance scale for equation solving',
      svg: `
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <line x1="150" y1="50" x2="150" y2="120" stroke="currentColor" strokeWidth="3"/>
          <line x1="70" y1="70" x2="230" y2="70" stroke="currentColor" strokeWidth="2"/>
          <rect x="50" y="70" width="60" height="40" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="190" y="70" width="60" height="40" fill="none" stroke="currentColor" strokeWidth="2"/>
          <text x="80" y="95" textAnchor="middle" fontSize="16" fill="currentColor">Left</text>
          <text x="220" y="95" textAnchor="middle" fontSize="16" fill="currentColor">Right</text>
          <line x1="120" y1="150" x2="180" y2="150" stroke="currentColor" strokeWidth="3"/>
        </svg>
      `
    },
    {
      id: 'equation-template',
      name: 'Equation Template',
      icon: X,
      category: 'algebra',
      description: 'Template for solving linear equations step-by-step',
      svg: `
        <svg viewBox="0 0 300 150" className="w-full h-full">
          <rect x="20" y="30" width="40" height="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3"/>
          <text x="70" y="50" fontSize="16" fill="currentColor">+</text>
          <rect x="90" y="30" width="40" height="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3"/>
          <text x="140" y="50" fontSize="16" fill="currentColor">=</text>
          <rect x="160" y="30" width="40" height="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3"/>
          <text x="40" y="25" fontSize="12" fill="currentColor" opacity="0.7">x</text>
          <text x="110" y="25" fontSize="12" fill="currentColor" opacity="0.7">number</text>
          <text x="180" y="25" fontSize="12" fill="currentColor" opacity="0.7">result</text>
        </svg>
      `
    },

    // Fractions Templates
    {
      id: 'fraction-circles',
      name: 'Fraction Circles',
      icon: Divide,
      category: 'fractions',
      description: 'Circular fraction models for visualization',
      svg: `
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2"/>
          <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="1"/>
          <circle cx="150" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2"/>
          <line x1="120" y1="50" x2="180" y2="50" stroke="currentColor" strokeWidth="1"/>
          <line x1="150" y1="20" x2="150" y2="80" stroke="currentColor" strokeWidth="1"/>
        </svg>
      `
    },
    {
      id: 'fraction-bars',
      name: 'Fraction Bars',
      icon: Minus,
      category: 'fractions',
      description: 'Rectangular fraction bars for comparison',
      svg: `
        <svg viewBox="0 0 250 120" className="w-full h-full">
          <rect x="20" y="20" width="200" height="20" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="20" y="50" width="100" height="20" fill="currentColor" opacity="0.3"/>
          <rect x="120" y="50" width="100" height="20" fill="none" stroke="currentColor" strokeWidth="1"/>
          <rect x="20" y="80" width="66.67" height="20" fill="currentColor" opacity="0.5"/>
          <rect x="86.67" y="80" width="66.67" height="20" fill="none" stroke="currentColor" strokeWidth="1"/>
          <rect x="153.33" y="80" width="66.67" height="20" fill="none" stroke="currentColor" strokeWidth="1"/>
        </svg>
      `
    },

    // Geometry Templates
    {
      id: 'angle-measurer',
      name: 'Angle Measurer',
      icon: Ruler,
      category: 'geometry',
      description: 'Protractor for measuring angles',
      svg: `
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="2"/>
          ${Array.from({length: 19}, (_, i) => `
            <line x1="${20 + i * 160/18}" y1="100" x2="${20 + i * 160/18}" y2="95" stroke="currentColor" strokeWidth="1"/>
          `).join('')}
          <text x="100" y="115" textAnchor="middle" fontSize="12" fill="currentColor">0° - 180°</text>
        </svg>
      `
    },
    {
      id: 'triangle-grid',
      name: 'Triangle Grid',
      icon: Plus,
      category: 'geometry', 
      description: 'Triangular grid for geometric constructions',
      svg: `
        <svg viewBox="0 0 200 150" className="w-full h-full">
          ${Array.from({length: 8}, (_, row) => 
            Array.from({length: 12 - row}, (_, col) => `
              <polygon points="${20 + col * 15 + row * 7.5},${20 + row * 13} ${35 + col * 15 + row * 7.5},${20 + row * 13} ${27.5 + col * 15 + row * 7.5},${33 + row * 13}" 
                fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
            `).join('')
          ).join('')}
        </svg>
      `
    },

    // Measurement Templates
    {
      id: 'ruler',
      name: 'Ruler (cm)',
      icon: Ruler,
      category: 'measurement',
      description: '15cm ruler for measuring lengths',
      svg: `
        <svg viewBox="0 0 300 60" className="w-full h-full">
          <rect x="20" y="25" width="260" height="15" fill="none" stroke="currentColor" strokeWidth="2"/>
          ${Array.from({length: 16}, (_, i) => `
            <line x1="${20 + i * 260/15}" y1="25" x2="${20 + i * 260/15}" y2="${i % 5 === 0 ? 40 : 35}" stroke="currentColor" strokeWidth="1"/>
            ${i % 5 === 0 ? `<text x="${20 + i * 260/15}" y="52" textAnchor="middle" fontSize="8" fill="currentColor">${i}</text>` : ''}
          `).join('')}
        </svg>
      `
    }
  ];

  const categories = [
    { id: 'general', name: 'General', icon: Calculator },
    { id: 'algebra', name: 'Algebra', icon: X },
    { id: 'fractions', name: 'Fractions', icon: Divide },
    { id: 'geometry', name: 'Geometry', icon: Ruler },
    { id: 'measurement', name: 'Measurement', icon: Ruler }
  ];

  const filteredTemplates = templates.filter(template => template.category === selectedCategory);

  const handleTemplateSelect = (templateId: string) => {
    if (onTemplateSelect) {
      onTemplateSelect(templateId);
    }
  };

  return (
    <div className={`bg-surfaceAlt rounded-lg p-4 ${className}`}>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-accent text-white'
                : 'text-muted hover:text-tutor hover:bg-surface'
            }`}
          >
            <category.icon className="w-3 h-3" />
            <span className="hidden sm:inline">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence mode="wait">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="border border-border rounded-lg overflow-hidden hover:border-accent transition-colors"
            >
              {/* Template Header */}
              <div 
                className="flex items-center justify-between p-3 bg-surface cursor-pointer"
                onClick={() => setExpandedTemplate(
                  expandedTemplate === template.id ? null : template.id
                )}
              >
                <div className="flex items-center gap-2">
                  <template.icon className="w-4 h-4 text-accent" />
                  <span className="font-medium text-tutor">{template.name}</span>
                </div>
                <motion.div
                  animate={{ rotate: expandedTemplate === template.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.div>
              </div>

              {/* Template Content */}
              <AnimatePresence>
                {expandedTemplate === template.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-white">
                      {/* Template Preview */}
                      <div className="h-20 mb-3 flex items-center justify-center border border-border rounded-md">
                        {template.svg && (
                          <div 
                            className="w-full h-full p-2 text-gray-600"
                            dangerouslySetInnerHTML={{ __html: template.svg }}
                          />
                        )}
                      </div>

                      {/* Template Description */}
                      <p className="text-sm text-muted mb-3">{template.description}</p>

                      {/* Use Template Button */}
                      <button
                        onClick={() => handleTemplateSelect(template.id)}
                        className="w-full btn-primary text-sm py-2"
                      >
                        Use Template
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-muted">
            <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No templates available for this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MathTemplates;