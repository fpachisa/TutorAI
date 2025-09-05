'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Minus, 
  Circle, 
  Square, 
  Triangle, 
  ArrowRight, 
  Type,
  Zap,
  Compass,
  Ruler
} from 'lucide-react';

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'shapes' | 'lines' | 'text' | 'special';
  description: string;
}

interface DrawingToolsProps {
  selectedTool?: string;
  onToolSelect?: (toolId: string) => void;
  onShapeAdd?: (shape: ShapeData) => void;
  className?: string;
}

interface ShapeData {
  type: 'line' | 'circle' | 'rectangle' | 'triangle' | 'arrow' | 'text';
  properties: Record<string, any>;
}

/**
 * 🔧 DrawingTools - Advanced mathematical drawing tools for precise work
 */
export function DrawingTools({ 
  selectedTool = '', 
  onToolSelect, 
  onShapeAdd, 
  className = '' 
}: DrawingToolsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('shapes');
  const [toolSettings, setToolSettings] = useState({
    lineLength: 100,
    circleRadius: 50,
    arrowLength: 80,
    textSize: 16
  });

  const tools: DrawingTool[] = [
    // Shape Tools
    {
      id: 'straight-line',
      name: 'Straight Line',
      icon: Minus,
      category: 'lines',
      description: 'Draw precise straight lines with measurement'
    },
    {
      id: 'circle-tool',
      name: 'Circle',
      icon: Circle,
      category: 'shapes',
      description: 'Perfect circles with adjustable radius'
    },
    {
      id: 'rectangle-tool',
      name: 'Rectangle',
      icon: Square,
      category: 'shapes',
      description: 'Rectangles and squares with grid snap'
    },
    {
      id: 'triangle-tool',
      name: 'Triangle',
      icon: Triangle,
      category: 'shapes',
      description: 'Various triangle types for geometry'
    },
    {
      id: 'arrow-tool',
      name: 'Arrow',
      icon: ArrowRight,
      category: 'lines',
      description: 'Directional arrows for solutions'
    },
    
    // Text Tools
    {
      id: 'math-text',
      name: 'Math Text',
      icon: Type,
      category: 'text',
      description: 'Add mathematical expressions and numbers'
    },
    
    // Special Tools
    {
      id: 'compass',
      name: 'Compass',
      icon: Compass,
      category: 'special',
      description: 'Draw arcs and circles with compass precision'
    },
    {
      id: 'angle-tool',
      name: 'Angle Measure',
      icon: Zap,
      category: 'special',
      description: 'Measure and mark angles accurately'
    },
    {
      id: 'parallel-lines',
      name: 'Parallel Lines',
      icon: Ruler,
      category: 'lines',
      description: 'Draw parallel and perpendicular lines'
    }
  ];

  const categories = [
    { id: 'shapes', name: 'Shapes', icon: Circle },
    { id: 'lines', name: 'Lines', icon: Minus },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'special', name: 'Special', icon: Compass }
  ];

  const filteredTools = tools.filter(tool => tool.category === activeCategory);

  const handleToolSelect = (toolId: string) => {
    if (onToolSelect) {
      onToolSelect(toolId);
    }
  };

  const handleQuickShape = (shapeType: string) => {
    const shapeData: ShapeData = {
      type: shapeType as any,
      properties: {
        ...toolSettings,
        x: Math.random() * 200 + 50,
        y: Math.random() * 200 + 50
      }
    };

    if (onShapeAdd) {
      onShapeAdd(shapeData);
    }
  };

  return (
    <div className={`bg-surface rounded-lg border border-border ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h4 className="font-medium text-tutor mb-2">Drawing Tools</h4>
        
        {/* Category Tabs */}
        <div className="flex gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                activeCategory === category.id
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-tutor hover:bg-surfaceAlt'
              }`}
            >
              <category.icon className="w-3 h-3" />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tools List */}
      <div className="p-3">
        <div className="space-y-2">
          {filteredTools.map((tool) => (
            <motion.button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-all hover:scale-[1.02] ${
                selectedTool === tool.id
                  ? 'bg-accent text-white shadow-glow'
                  : 'text-tutor hover:bg-surfaceAlt'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tool.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                selectedTool === tool.id ? 'text-white' : 'text-accent'
              }`} />
              <div className="min-w-0">
                <div className="font-medium text-sm">{tool.name}</div>
                <div className={`text-xs leading-tight ${
                  selectedTool === tool.id ? 'text-white/80' : 'text-muted'
                }`}>
                  {tool.description}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Quick Shapes (for shapes category) */}
        {activeCategory === 'shapes' && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted mb-2">Quick Add</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickShape('circle')}
                className="p-2 border border-border rounded text-center hover:border-accent hover:bg-accent/10 transition-colors"
              >
                <Circle className="w-4 h-4 mx-auto mb-1 text-accent" />
                <span className="text-xs text-tutor">Circle</span>
              </button>
              <button
                onClick={() => handleQuickShape('rectangle')}
                className="p-2 border border-border rounded text-center hover:border-accent hover:bg-accent/10 transition-colors"
              >
                <Square className="w-4 h-4 mx-auto mb-1 text-accent" />
                <span className="text-xs text-tutor">Square</span>
              </button>
              <button
                onClick={() => handleQuickShape('line')}
                className="p-2 border border-border rounded text-center hover:border-accent hover:bg-accent/10 transition-colors"
              >
                <Minus className="w-4 h-4 mx-auto mb-1 text-accent" />
                <span className="text-xs text-tutor">Line</span>
              </button>
            </div>
          </div>
        )}

        {/* Tool Settings */}
        {selectedTool && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted mb-2">Tool Settings</p>
            
            {/* Line Length Setting */}
            {(selectedTool === 'straight-line' || selectedTool === 'arrow-tool') && (
              <div className="mb-3">
                <label className="text-xs text-tutor block mb-1">Length: {toolSettings.lineLength}px</label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={toolSettings.lineLength}
                  onChange={(e) => setToolSettings(prev => ({ ...prev, lineLength: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-border rounded appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Circle Radius Setting */}
            {selectedTool === 'circle-tool' && (
              <div className="mb-3">
                <label className="text-xs text-tutor block mb-1">Radius: {toolSettings.circleRadius}px</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={toolSettings.circleRadius}
                  onChange={(e) => setToolSettings(prev => ({ ...prev, circleRadius: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-border rounded appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Text Size Setting */}
            {selectedTool === 'math-text' && (
              <div className="mb-3">
                <label className="text-xs text-tutor block mb-1">Text Size: {toolSettings.textSize}px</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={toolSettings.textSize}
                  onChange={(e) => setToolSettings(prev => ({ ...prev, textSize: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-border rounded appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DrawingTools;