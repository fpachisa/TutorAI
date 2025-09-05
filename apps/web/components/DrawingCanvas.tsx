'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  brushColor?: string;
  brushRadius?: number;
  disabled?: boolean;
  showGrid?: boolean;
  className?: string;
  onSave?: (data: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  radius: number;
  timestamp: number;
}

/**
 * 🎨 DrawingCanvas - Custom HTML5 canvas implementation for mathematical drawing
 */
export function DrawingCanvas({
  width = 800,
  height = 600,
  brushColor = '#2563eb',
  brushRadius = 3,
  disabled = false,
  showGrid = false,
  className = '',
  onSave
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width, height });

  // Handle responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw canvas when strokes or size changes
  useEffect(() => {
    redrawCanvas();
  }, [strokes, canvasSize, showGrid]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx);
    }

    // Draw all strokes
    strokes.forEach(stroke => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.radius);
    });

    // Draw current stroke if drawing
    if (currentStroke.length > 0) {
      drawStroke(ctx, currentStroke, brushColor, brushRadius);
    }
  }, [strokes, currentStroke, brushColor, brushRadius, canvasSize, showGrid]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 20;
    
    // Vertical lines
    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, points: Point[], color: string, radius: number) => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = radius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  };

  const getPointerPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    setIsDrawing(true);
    const point = getPointerPos(e);
    setCurrentStroke([point]);
    
    // Capture pointer to handle events outside canvas
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [disabled, getPointerPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const point = getPointerPos(e);
    setCurrentStroke(prev => [...prev, point]);
  }, [isDrawing, disabled, getPointerPos]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    setIsDrawing(false);
    
    // Save the completed stroke
    if (currentStroke.length > 0) {
      const newStroke: Stroke = {
        points: [...currentStroke, getPointerPos(e)],
        color: brushColor,
        radius: brushRadius,
        timestamp: Date.now()
      };
      
      setStrokes(prev => [...prev, newStroke]);
    }
    
    setCurrentStroke([]);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, [isDrawing, currentStroke, brushColor, brushRadius, getPointerPos]);

  // Public methods for external control
  const clear = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
  }, []);

  const undo = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
  }, []);

  const getSaveData = useCallback(() => {
    return JSON.stringify({
      strokes,
      canvasSize,
      timestamp: Date.now()
    });
  }, [strokes, canvasSize]);

  const loadSaveData = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.strokes) {
        setStrokes(parsed.strokes);
      }
    } catch (e) {
      console.error('Failed to load save data:', e);
    }
  }, []);

  // Expose methods via ref
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as any).clear = clear;
      (canvasRef.current as any).undo = undo;
      (canvasRef.current as any).getSaveData = getSaveData;
      (canvasRef.current as any).loadSaveData = loadSaveData;
    }
  }, [clear, undo, getSaveData, loadSaveData]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          background: '#ffffff',
          borderRadius: '8px'
        }}
      />
      
      {disabled && (
        <div className="absolute inset-0 bg-gray-500/20 rounded-lg flex items-center justify-center">
          <p className="text-gray-600 font-medium">Canvas Disabled</p>
        </div>
      )}
    </div>
  );
}

export default DrawingCanvas;