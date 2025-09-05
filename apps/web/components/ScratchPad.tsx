'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Eraser, RotateCcw, Download, Grid3X3, Save, Plus, FileText } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';

interface ScratchPadProps {
  className?: string;
  isVisible?: boolean;
  onToggle?: () => void;
}

interface WorkPage {
  id: string;
  name: string;
  data: string;
  timestamp: number;
}

interface SimpleTool {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * 📝 ScratchPad - Modern drawing canvas for mathematical work
 */
export function ScratchPad({ className = '', isVisible = true }: ScratchPadProps) {
  const canvasRef = useRef<any>(null);
  const [selectedTool, setSelectedTool] = useState('pen');
  const [brushRadius, setBrushRadius] = useState(3);
  const [brushColor, setBrushColor] = useState('#2563eb'); // Blue
  const [showGrid, setShowGrid] = useState(false);
  const [workPages, setWorkPages] = useState<WorkPage[]>([{
    id: 'page-1',
    name: 'Problem 1',
    data: '',
    timestamp: Date.now()
  }]);
  const [currentPageId, setCurrentPageId] = useState('page-1');

  // Simplified essential tools only
  const tools: SimpleTool[] = [
    { id: 'pen', name: 'Pen', icon: Palette },
    { id: 'eraser', name: 'Eraser', icon: Eraser },
  ];

  // Essential colors only
  const colors = [
    '#2563eb', // Blue (default)
    '#dc2626', // Red
    '#000000', // Black
    '#16a34a', // Green
  ];

  // Two brush sizes only
  const brushSizes = [3, 6]; // Normal and Thick

  // Load saved work from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('scratch-pad-pages');
    if (saved) {
      try {
        const pages = JSON.parse(saved);
        setWorkPages(pages);
        if (pages.length > 0) {
          setCurrentPageId(pages[0].id);
        }
      } catch (e) {
        console.error('Failed to load saved pages:', e);
      }
    }
  }, []);

  // Save work to localStorage whenever pages change
  useEffect(() => {
    localStorage.setItem('scratch-pad-pages', JSON.stringify(workPages));
  }, [workPages]);

  // Load page data when current page changes
  useEffect(() => {
    const currentPage = workPages.find(page => page.id === currentPageId);
    if (currentPage && currentPage.data && canvasRef.current) {
      try {
        canvasRef.current.loadSaveData(currentPage.data, true);
      } catch (e) {
        console.error('Failed to load page data:', e);
      }
    }
  }, [currentPageId, workPages]);

  const handleClear = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.undo();
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current.canvasContainer.children[1];
      const currentPage = workPages.find(page => page.id === currentPageId);
      const filename = `${currentPage?.name || 'scratch-pad'}-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL();
      link.click();
    }
  }, [workPages, currentPageId]);

  const handleSave = useCallback(() => {
    if (canvasRef.current) {
      const saveData = canvasRef.current.getSaveData();
      setWorkPages(prev => prev.map(page => 
        page.id === currentPageId 
          ? { ...page, data: saveData, timestamp: Date.now() }
          : page
      ));
    }
  }, [currentPageId]);

  const handleAddPage = useCallback(() => {
    const newPage: WorkPage = {
      id: `page-${Date.now()}`,
      name: `Problem ${workPages.length + 1}`,
      data: '',
      timestamp: Date.now()
    };
    setWorkPages(prev => [...prev, newPage]);
    setCurrentPageId(newPage.id);
  }, [workPages.length]);

  const handleDeletePage = useCallback((pageId: string) => {
    if (workPages.length === 1) return; // Don't delete the last page
    
    setWorkPages(prev => prev.filter(page => page.id !== pageId));
    if (currentPageId === pageId) {
      const remainingPages = workPages.filter(page => page.id !== pageId);
      setCurrentPageId(remainingPages[0]?.id || '');
    }
  }, [workPages, currentPageId]);

  const handlePageSwitch = useCallback((pageId: string) => {
    // Save current page before switching
    if (canvasRef.current) {
      const saveData = canvasRef.current.getSaveData();
      setWorkPages(prev => prev.map(page => 
        page.id === currentPageId 
          ? { ...page, data: saveData, timestamp: Date.now() }
          : page
      ));
    }
    setCurrentPageId(pageId);
  }, [currentPageId]);


  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3 }}
          className={`bg-surface border-l border-border h-full flex flex-col ${className}`}
        >
          {/* Compact Header with Pages */}
          <div className="flex-shrink-0 px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-heading font-semibold text-tutor">Scratch Pad</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSave}
                  className="p-1.5 text-muted hover:text-tutor hover:bg-surfaceAlt rounded transition-colors"
                  title="Save Work"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleUndo}
                  className="p-1.5 text-muted hover:text-tutor hover:bg-surfaceAlt rounded transition-colors"
                  title="Undo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 text-muted hover:text-tutor hover:bg-surfaceAlt rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Page Tabs */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 overflow-x-auto">
                {workPages.map((page, index) => (
                  <div key={page.id} className="relative group">
                    <button
                      onClick={() => handlePageSwitch(page.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                        currentPageId === page.id
                          ? 'bg-accent text-white'
                          : 'bg-surfaceAlt text-muted hover:text-tutor'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      {page.name}
                    </button>
                    {workPages.length > 1 && (
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-danger text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete page"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddPage}
                className="p-1 text-muted hover:text-tutor hover:bg-surfaceAlt rounded transition-colors"
                title="Add new page"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Horizontal Slim Toolbar */}
          <div className="flex-shrink-0 px-3 py-2 border-b border-border">
            <div className="flex items-center gap-4">
              {/* Tools */}
              <div className="flex items-center gap-1">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`p-2 rounded transition-all ${
                      selectedTool === tool.id
                        ? 'bg-accent text-white'
                        : 'text-muted hover:text-tutor hover:bg-surfaceAlt'
                    }`}
                    title={tool.name}
                  >
                    <tool.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              {/* Colors */}
              <div className="flex items-center gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      brushColor === color ? 'border-accent scale-110' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              {/* Brush Size */}
              <div className="flex items-center gap-1">
                {brushSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushRadius(size)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      brushRadius === size
                        ? 'border-accent bg-accent text-white'
                        : 'border-border text-muted hover:border-accent'
                    }`}
                    title={size === 3 ? 'Normal' : 'Thick'}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{ width: `${Math.max(size/2, 1)}px`, height: `${Math.max(size/2, 1)}px` }}
                    />
                  </button>
                ))}
              </div>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded transition-all ${
                  showGrid
                    ? 'bg-accent text-white'
                    : 'text-muted hover:text-tutor hover:bg-surfaceAlt'
                }`}
                title="Toggle Grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>

              {/* Clear Button */}
              <button
                onClick={handleClear}
                className="px-3 py-1 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded text-xs font-medium transition-colors"
                title="Clear Canvas"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Large Drawing Canvas Area */}
          <div className="flex-1 relative bg-white m-3 rounded-lg border border-border overflow-hidden">
            {/* Grid Overlay */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
            )}

            {/* Drawing Canvas */}
            <DrawingCanvas
              ref={canvasRef}
              brushRadius={selectedTool === 'eraser' ? brushRadius * 2 : brushRadius}
              brushColor={selectedTool === 'eraser' ? '#ffffff' : brushColor}
              showGrid={showGrid}
              className="w-full h-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ScratchPad;