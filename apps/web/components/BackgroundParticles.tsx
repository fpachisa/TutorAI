'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * 🌟 Floating background particles for ambiance
 * Fixed hydration mismatch by using deterministic positions
 */
export function BackgroundParticles() {
  const [mounted, setMounted] = useState(false);
  const [particles] = useState(() => {
    // Pre-generate deterministic positions to avoid hydration mismatch
    return {
      large: Array.from({ length: 6 }, (_, i) => ({
        left: (i * 17 + 10) % 90,
        top: (i * 23 + 15) % 80,
        delay: i * 0.5,
        duration: 4 + (i % 3)
      })),
      small: Array.from({ length: 12 }, (_, i) => ({
        left: (i * 8 + 5) % 95,
        top: (i * 13 + 10) % 85,
        delay: i * 0.3,
        duration: 3 + (i % 2)
      })),
      sparkles: Array.from({ length: 4 }, (_, i) => ({
        left: (i * 25 + 12) % 80 + 10,
        top: (i * 31 + 20) % 60 + 20,
        delay: i * 0.8,
        duration: 5 + (i % 2)
      })),
      orbs: Array.from({ length: 3 }, (_, i) => ({
        left: (i * 30 + 15) % 70 + 10,
        top: (i * 25 + 20) % 60 + 10,
        delay: i * 1.5,
        duration: 6 + (i % 3)
      }))
    };
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a minimal placeholder during SSR
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large ambient particles */}
      {particles.large.map((particle, i) => (
        <motion.div
          key={`large-${i}`}
          className="absolute w-2 h-2 bg-accent/10 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
      
      {/* Small sparkle particles */}
      {particles.small.map((particle, i) => (
        <motion.div
          key={`small-${i}`}
          className="absolute w-1 h-1 bg-accentAlt/20 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            x: [-5, 5, -5],
            y: [-5, 5, -5],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}

      {/* Floating Sparkles */}
      {particles.sparkles.map((particle, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute text-accent/20"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            fontSize: '12px',
          }}
          animate={{
            rotate: [0, 360],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        >
          ✨
        </motion.div>
      ))}
      
      {/* Gradient orbs */}
      {particles.orbs.map((particle, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute w-8 h-8 bg-gradient-primary rounded-full opacity-5 blur-sm"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [-5, 5, -5],
            y: [-8, 8, -8],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}

export default BackgroundParticles;