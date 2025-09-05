import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 TutorAI Design System - Core Palette
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surfaceAlt: 'var(--surface-alt)',
        surfaceHover: 'var(--surface-hover)',
        tutor: 'var(--tutor)',
        student: 'var(--student)',
        accent: 'var(--accent)',
        accentAlt: 'var(--accent-alt)',
        success: 'var(--success)',
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        muted: 'var(--muted)',
        border: 'var(--border)',
      },
      
      // Custom Gradients
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-surface': 'var(--gradient-surface)',
        'gradient-glow': 'var(--gradient-glow)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)',
      },
      
      // Border Radius
      borderRadius: {
        'xl': 'var(--radius-xl)',
        'lg': 'var(--radius-lg)', 
        'md': 'var(--radius-md)',
        'sm': 'var(--radius-sm)',
      },
      
      // Shadows
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'glow': 'var(--shadow-glow)',
        'surface': 'var(--shadow-surface)',
        'float': 'var(--shadow-float)',
      },
      
      // Typography
      fontFamily: {
        'heading': ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
      },
      
      // Transitions
      transitionTimingFunction: {
        'bounce-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'em': 'cubic-bezier(0.16, 1, 0.3, 1)', // easeOutExpo-ish
      },
      
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
      
      // Layout
      maxWidth: {
        'container': 'var(--container-max)',
      },
      
      height: {
        'header': 'var(--header-height)',
        'composer': 'var(--composer-height)',
      },
      
      // Screens for responsive design
      screens: {
        'xs': '360px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // Animations
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'skeleton': 'skeleton-loading 1.5s infinite',
        'message-enter': 'message-slide-in 250ms ease-out',
        'bounce-gentle': 'bounce 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 15px rgba(139,92,246,0.3)'
          },
          '50%': { 
            opacity: '0.8',
            boxShadow: '0 0 25px rgba(139,92,246,0.5)'
          }
        },
        'shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' }
        },
        'skeleton-loading': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        },
        'message-slide-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(12px) scale(0.95)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        'glow-pulse': {
          '0%, 100%': { 
            opacity: '1',
            filter: 'brightness(1)'
          },
          '50%': { 
            opacity: '0.8',
            filter: 'brightness(1.2)'
          }
        }
      },
      
      // Z-index scale
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal': '1040',
        'popover': '1050',
        'tooltip': '1060',
      },
      
      // Custom spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    // Custom plugin for component utilities
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.gradient-text': {
          background: 'var(--gradient-primary)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.glass-surface': {
          background: 'rgba(23, 26, 43, 0.8)',
          'backdrop-filter': 'blur(12px)',
          border: '1px solid rgba(42, 47, 66, 0.5)',
        },
        '.text-shadow': {
          'text-shadow': '0 2px 4px rgba(0,0,0,0.3)',
        }
      }
      
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
}

export default config