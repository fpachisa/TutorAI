'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap } from 'lucide-react';
import { ReactNode } from 'react';
import { BackgroundParticles } from './BackgroundParticles';

interface AppShellProps {
  children: ReactNode;
  headerContent?: ReactNode;
  showParticles?: boolean;
}

/**
 * 🏗️ AppShell - Beautiful container for our TutorAI experience
 */
export function AppShell({ children, headerContent, showParticles = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Animated Background Particles */}
      {showParticles && <BackgroundParticles />}
      
      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-container px-4 py-4">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-accentAlt rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              
              <div>
                <h1 className="text-xl font-heading font-semibold gradient-text">
                  TutorAI
                </h1>
                <p className="text-xs text-muted">
                  Primary 6 Math Tutor
                </p>
              </div>
            </div>

            {/* Header Content (Topic Select, etc.) */}
            <div className="flex items-center gap-4">
              {headerContent}
              
              {/* Environment Indicator */}
              <EnvironmentPill />
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="relative"
        >
          {children}
        </motion.main>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent pointer-events-none z-20" />
    </div>
  );
}


/**
 * 🏷️ Environment indicator pill
 */
function EnvironmentPill() {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-warn/10 border border-warn/20 rounded-full"
    >
      <Zap className="w-3 h-3 text-warn" />
      <span className="text-xs font-medium text-warn">DEV</span>
    </motion.div>
  );
}

export default AppShell;