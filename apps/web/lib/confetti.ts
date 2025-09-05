// 🎉 TutorAI Confetti System - Celebrate Learning Wins!

import { useCallback, useRef } from 'react';

export interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  drift?: number;
  gravity?: number;
  ticks?: number;
  colors?: string[];
  shapes?: ('square' | 'circle')[];
  origin?: { x: number; y: number };
}

export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  decay: number;
  gravity: number;
  drift: number;
  scalar: number;
  color: string;
  shape: 'square' | 'circle';
  life: number;
  maxLife: number;
}

/**
 * 🎆 Confetti Animation Engine
 */
class ConfettiEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: ConfettiParticle[] = [];
  private animationId?: number;
  private isRunning = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas() {
    const updateSize = () => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
    };

    updateSize();
    window.addEventListener('resize', updateSize);
  }

  /**
   * 🎊 Create confetti burst
   */
  createBurst(options: ConfettiOptions = {}) {
    const {
      particleCount = 50,
      spread = 45,
      startVelocity = 25,
      decay = 0.9,
      scalar = 1,
      drift = 0,
      gravity = 0.3,
      ticks = 200,
      colors = ['#8B5CF6', '#22D3EE', '#22C55E', '#F59E0B', '#EF4444'],
      shapes = ['square', 'circle'],
      origin = { x: 0.5, y: 0.6 }
    } = options;

    const rect = this.canvas.getBoundingClientRect();
    const originX = origin.x * rect.width;
    const originY = origin.y * rect.height;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() - 0.5) * (spread * Math.PI / 180);
      const velocity = startVelocity * (0.75 + Math.random() * 0.5);
      
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        decay,
        gravity,
        drift,
        scalar: scalar * (0.8 + Math.random() * 0.4),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        life: ticks,
        maxLife: ticks
      });
    }

    this.startAnimation();
  }

  /**
   * 🌟 Create sparkle effect
   */
  createSparkles(x: number, y: number, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const velocity = 15 + Math.random() * 10;
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        decay: 0.95,
        gravity: 0.1,
        drift: 0,
        scalar: 0.5 + Math.random() * 0.5,
        color: '#8B5CF6',
        shape: 'circle',
        life: 60,
        maxLife: 60
      });
    }

    this.startAnimation();
  }

  /**
   * 🎯 Create celebration burst (for correct answers)
   */
  createCelebration() {
    // Main burst
    this.createBurst({
      particleCount: 100,
      spread: 70,
      startVelocity: 30,
      colors: ['#8B5CF6', '#22D3EE', '#22C55E', '#F59E0B'],
      origin: { x: 0.5, y: 0.6 }
    });

    // Side bursts
    setTimeout(() => {
      this.createBurst({
        particleCount: 30,
        spread: 35,
        startVelocity: 20,
        origin: { x: 0.3, y: 0.7 }
      });
    }, 100);

    setTimeout(() => {
      this.createBurst({
        particleCount: 30,
        spread: 35,
        startVelocity: 20,
        origin: { x: 0.7, y: 0.7 }
      });
    }, 200);
  }

  private startAnimation() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  private animate = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update physics
      particle.vy += particle.gravity;
      particle.vx += particle.drift;
      particle.vx *= particle.decay;
      particle.vy *= particle.decay;
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;

      // Remove dead particles
      if (particle.life <= 0 || particle.y > this.canvas.height + 100) {
        this.particles.splice(i, 1);
        continue;
      }

      // Draw particle
      this.drawParticle(particle);
    }

    // Continue animation or stop
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.isRunning = false;
    }
  };

  private drawParticle(particle: ConfettiParticle) {
    const alpha = particle.life / particle.maxLife;
    const size = 4 * particle.scalar * alpha;
    
    this.ctx.save();
    this.ctx.translate(particle.x, particle.y);
    this.ctx.globalAlpha = alpha;
    
    this.ctx.fillStyle = particle.color;
    
    if (particle.shape === 'circle') {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.fillRect(-size/2, -size/2, size, size);
    }
    
    this.ctx.restore();
  }

  /**
   * 🧹 Clean up
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.particles = [];
    this.isRunning = false;
  }
}

/**
 * 🎣 React hook for confetti
 */
export const useConfetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ConfettiEngine | null>(null);

  const initEngine = useCallback(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new ConfettiEngine(canvasRef.current);
    }
    return engineRef.current;
  }, []);

  const fire = useCallback((options?: ConfettiOptions) => {
    const engine = initEngine();
    if (engine) {
      engine.createBurst(options);
    }
  }, [initEngine]);

  const celebrate = useCallback(() => {
    const engine = initEngine();
    if (engine) {
      engine.createCelebration();
    }
  }, [initEngine]);

  const sparkles = useCallback((x: number, y: number, count?: number) => {
    const engine = initEngine();
    if (engine) {
      engine.createSparkles(x, y, count);
    }
  }, [initEngine]);

  const cleanup = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
  }, []);

  return {
    canvasRef,
    fire,
    celebrate,
    sparkles,
    cleanup
  };
};

/**
 * 🎨 Preset confetti configurations
 */
export const confettiPresets = {
  // For correct checkpoint answers
  success: {
    particleCount: 100,
    spread: 70,
    startVelocity: 30,
    colors: ['#22C55E', '#8B5CF6', '#22D3EE'],
    origin: { x: 0.5, y: 0.6 }
  },
  
  // For session completion
  victory: {
    particleCount: 150,
    spread: 90,
    startVelocity: 35,
    colors: ['#8B5CF6', '#22D3EE', '#22C55E', '#F59E0B'],
    origin: { x: 0.5, y: 0.7 }
  },
  
  // For hint level progress
  progress: {
    particleCount: 30,
    spread: 45,
    startVelocity: 20,
    colors: ['#8B5CF6', '#22D3EE'],
    scalar: 0.8,
    origin: { x: 0.5, y: 0.3 }
  },
  
  // For spark orb interactions
  sparkle: {
    particleCount: 15,
    spread: 30,
    startVelocity: 15,
    colors: ['#8B5CF6'],
    shapes: ['circle' as const],
    scalar: 0.6,
    origin: { x: 0.5, y: 0.5 }
  }
};

export default ConfettiEngine;