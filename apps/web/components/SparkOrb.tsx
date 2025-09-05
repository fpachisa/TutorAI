'use client';

import { motion } from 'framer-motion';
import { Sparkles, Brain, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export type OrbState = 'idle' | 'thinking' | 'celebrate' | 'nudge' | 'hint';

interface SparkOrbProps {
  state: OrbState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

/**
 * ✨ SparkOrb - The magical centerpiece of our TutorAI experience
 * This orb responds to different states with beautiful animations
 */
export function SparkOrb({ state, size = 'md', className = '', onClick }: SparkOrbProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`${getSizeClasses(size)} ${className}`} />;
  }

  const sizeClasses = getSizeClasses(size);
  const baseClasses = "relative flex items-center justify-center rounded-full cursor-pointer";
  const orbConfig = getOrbConfig(state);

  return (
    <motion.div
      className={`${baseClasses} ${sizeClasses} ${className}`}
      onClick={onClick}
      animate={orbConfig.animate}
      transition={orbConfig.transition as any}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Main Orb */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: orbConfig.background }}
        animate={orbConfig.backgroundAnimate}
        transition={orbConfig.backgroundTransition as any}
      />

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-60"
        style={{ 
          background: orbConfig.glowBackground,
          filter: 'blur(8px)',
        }}
        animate={orbConfig.glowAnimate}
        transition={orbConfig.glowTransition as any}
      />

      {/* Shimmer Effect */}
      {(state === 'thinking' || state === 'nudge') && <ShimmerEffect />}

      {/* Icon */}
      <motion.div
        className="relative z-10 text-white"
        animate={orbConfig.iconAnimate}
        transition={orbConfig.iconTransition as any}
      >
        {getOrbIcon(state, size)}
      </motion.div>

      {/* Particle Effects */}
      {state === 'celebrate' && <CelebrationParticles />}
      {state === 'hint' && <HintSparkles />}
    </motion.div>
  );
}

/**
 * 📏 Size configuration
 */
function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm': return 'w-12 h-12';
    case 'md': return 'w-16 h-16';
    case 'lg': return 'w-24 h-24';
  }
}

/**
 * 🎭 Get orb configuration based on state
 */
function getOrbConfig(state: OrbState) {
  const configs = {
    idle: {
      background: 'linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%)',
      glowBackground: 'linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%)',
      animate: {
        scale: [1, 1.05, 1],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      },
      backgroundAnimate: {},
      backgroundTransition: {},
      glowAnimate: {
        opacity: [0.4, 0.8, 0.4],
      },
      glowTransition: {
        duration: 2,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      },
      iconAnimate: {
        rotate: [0, 5, 0, -5, 0],
      },
      iconTransition: {
        duration: 4,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    
    thinking: {
      background: 'linear-gradient(45deg, #8B5CF6, #A855F7, #22D3EE, #06B6D4)',
      glowBackground: 'linear-gradient(45deg, #8B5CF6, #22D3EE)',
      animate: {
        y: [-2, 2, -2],
        scale: [1, 1.02, 1],
      },
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      },
      backgroundAnimate: {
        backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
      },
      backgroundTransition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear'
      },
      glowAnimate: {
        scale: [1, 1.2, 1],
        opacity: [0.6, 1, 0.6],
      },
      glowTransition: {
        duration: 1.2,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      },
      iconAnimate: {
        scale: [1, 1.1, 1],
      },
      iconTransition: {
        duration: 1,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    
    celebrate: {
      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 50%, #22D3EE 100%)',
      glowBackground: 'linear-gradient(135deg, #22C55E 0%, #22D3EE 100%)',
      animate: {
        scale: [1, 1.3, 1.1, 1],
      },
      transition: {
        duration: 0.6,
        ease: [0, 0, 0.2, 1]
      },
      backgroundAnimate: {},
      backgroundTransition: {},
      glowAnimate: {
        scale: [1, 1.5, 1.2],
        opacity: [0.8, 1, 0.8],
      },
      glowTransition: {
        duration: 0.8,
        ease: [0, 0, 0.2, 1]
      },
      iconAnimate: {
        scale: [1, 1.4, 1.2],
        rotate: [0, 360],
      },
      iconTransition: {
        duration: 0.8,
        ease: [0, 0, 0.2, 1]
      }
    },
    
    nudge: {
      background: 'linear-gradient(135deg, #F59E0B 0%, #EAB308 100%)',
      glowBackground: 'linear-gradient(135deg, #F59E0B 0%, #EAB308 100%)',
      animate: {
        rotate: [-2, 2, -2, 2, 0],
        scale: [1, 1.05, 1],
      },
      transition: {
        duration: 0.5,
        repeat: 3,
        ease: [0.4, 0, 0.2, 1]
      },
      backgroundAnimate: {},
      backgroundTransition: {},
      glowAnimate: {
        opacity: [0.6, 1, 0.6],
        scale: [1, 1.1, 1],
      },
      glowTransition: {
        duration: 0.3,
        repeat: 6,
        ease: [0.4, 0, 0.2, 1]
      },
      iconAnimate: {
        scale: [1, 1.2, 1],
      },
      iconTransition: {
        duration: 0.4,
        repeat: 4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    
    hint: {
      background: 'linear-gradient(135deg, #F59E0B 0%, #8B5CF6 100%)',
      glowBackground: 'linear-gradient(135deg, #F59E0B 0%, #8B5CF6 100%)',
      animate: {
        scale: [1, 1.08, 1],
      },
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      },
      backgroundAnimate: {},
      backgroundTransition: {},
      glowAnimate: {
        opacity: [0.5, 0.9, 0.5],
      },
      glowTransition: {
        duration: 2,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      },
      iconAnimate: {
        scale: [1, 1.15, 1],
      },
      iconTransition: {
        duration: 1.8,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  return configs[state];
}

/**
 * 🎨 Get appropriate icon for orb state
 */
function getOrbIcon(state: OrbState, size: 'sm' | 'md' | 'lg') {
  const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';
  
  switch (state) {
    case 'idle':
      return <Brain className={iconSize} />;
    case 'thinking':
      return <Brain className={iconSize} />;
    case 'celebrate':
      return <CheckCircle2 className={iconSize} />;
    case 'nudge':
      return <Sparkles className={iconSize} />;
    case 'hint':
      return <Lightbulb className={iconSize} />;
  }
}

/**
 * ✨ Shimmer effect for thinking/nudge states
 */
function ShimmerEffect() {
  return (
    <motion.div
      className="absolute inset-0 rounded-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}

/**
 * 🎉 Celebration particles
 */
function CelebrationParticles() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: [0, (Math.cos((i * Math.PI * 2) / 6) * 40)],
            y: [0, (Math.sin((i * Math.PI * 2) / 6) * 40)],
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.1,
            ease: [0, 0, 0.2, 1]
          }}
        />
      ))}
    </div>
  );
}

/**
 * 💡 Hint sparkles
 */
function HintSparkles() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white/70"
          style={{
            left: '50%',
            top: '50%',
            marginLeft: -6,
            marginTop: -6,
          }}
          animate={{
            scale: [0, 1, 0],
            rotate: [0, 180],
            x: [0, (Math.cos((i * Math.PI * 2) / 4) * 25)],
            y: [0, (Math.sin((i * Math.PI * 2) / 4) * 25)],
          }}
          transition={{
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <Sparkles className="w-3 h-3" />
        </motion.div>
      ))}
    </div>
  );
}

export default SparkOrb;