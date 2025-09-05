'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps extends ToastData {
  onClose: (id: string) => void;
}

/**
 * 🍞 Toast - Beautiful notification component
 */
export function Toast({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  action, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  const config = getToastConfig(type);

  // Auto close timer
  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setProgress((remaining / duration) * 100);
      
      if (remaining <= 0) {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            relative bg-surface border rounded-xl shadow-float overflow-hidden
            max-w-sm w-full pointer-events-auto
            ${config.borderColor}
          `}
          initial={{ opacity: 0, scale: 0.9, x: 100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 100 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          layout
        >
          {/* Progress Bar */}
          {duration > 0 && (
            <motion.div
              className={`absolute top-0 left-0 h-1 ${config.bgColor}`}
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          )}

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <motion.div
                className={`flex-shrink-0 ${config.textColor}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
              >
                {config.icon}
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <motion.h4
                  className="font-medium text-tutor text-sm mb-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h4>
                
                {message && (
                  <motion.p
                    className="text-xs text-muted leading-relaxed"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {message}
                  </motion.p>
                )}

                {/* Action Button */}
                {action && (
                  <motion.button
                    onClick={action.onClick}
                    className={`mt-2 text-xs font-medium hover:underline ${config.textColor}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {action.label}
                  </motion.button>
                )}
              </div>

              {/* Close Button */}
              <motion.button
                onClick={handleClose}
                className="flex-shrink-0 p-1 rounded-md hover:bg-surfaceHover transition-colors text-muted hover:text-tutor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 🎨 Get toast configuration
 */
function getToastConfig(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        icon: <CheckCircle2 className="w-5 h-5" />,
        textColor: 'text-success',
        bgColor: 'bg-success',
        borderColor: 'border-success/20'
      };
    case 'error':
      return {
        icon: <XCircle className="w-5 h-5" />,
        textColor: 'text-danger',
        bgColor: 'bg-danger',
        borderColor: 'border-danger/20'
      };
    case 'warning':
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        textColor: 'text-warn',
        bgColor: 'bg-warn',
        borderColor: 'border-warn/20'
      };
    case 'info':
    default:
      return {
        icon: <Info className="w-5 h-5" />,
        textColor: 'text-accent',
        bgColor: 'bg-accent',
        borderColor: 'border-accent/20'
      };
  }
}

/**
 * 📋 Toast Container - Manages multiple toasts
 */
interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ToastContainer({ 
  toasts, 
  onRemove, 
  position = 'top-right' 
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-modal space-y-2`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * 🎣 Toast Hook - Convenient toast management
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title: string, message?: string, options?: Partial<ToastData>) =>
    addToast({ type: 'success', title, message, ...options });

  const error = (title: string, message?: string, options?: Partial<ToastData>) =>
    addToast({ type: 'error', title, message, ...options });

  const warning = (title: string, message?: string, options?: Partial<ToastData>) =>
    addToast({ type: 'warning', title, message, ...options });

  const info = (title: string, message?: string, options?: Partial<ToastData>) =>
    addToast({ type: 'info', title, message, ...options });

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}

export default Toast;