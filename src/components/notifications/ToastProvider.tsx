'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Info, Clock, Bell } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'deadline';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  deadline: Clock,
};

const colorMap = {
  success: { border: 'rgba(52, 211, 153, 0.4)', bg: 'rgba(52, 211, 153, 0.08)', text: '#34D399', glow: '0 0 20px rgba(52, 211, 153, 0.2)' },
  error: { border: 'rgba(239, 68, 68, 0.4)', bg: 'rgba(239, 68, 68, 0.08)', text: '#EF4444', glow: '0 0 20px rgba(239, 68, 68, 0.2)' },
  warning: { border: 'rgba(251, 191, 36, 0.4)', bg: 'rgba(251, 191, 36, 0.08)', text: '#FBBF24', glow: '0 0 20px rgba(251, 191, 36, 0.2)' },
  info: { border: 'rgba(0, 240, 255, 0.4)', bg: 'rgba(0, 240, 255, 0.08)', text: '#00F0FF', glow: '0 0 20px rgba(0, 240, 255, 0.2)' },
  deadline: { border: 'rgba(239, 68, 68, 0.5)', bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', glow: '0 0 30px rgba(239, 68, 68, 0.3)' },
};

function GlassToast({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = iconMap[toast.type];
  const colors = colorMap[toast.type];

  React.useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [onRemove, toast.duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        background: colors.bg,
        borderColor: colors.border,
        boxShadow: colors.glow,
      }}
      className="relative flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl max-w-sm w-full cursor-pointer"
      onClick={onRemove}
    >
      {toast.type === 'deadline' && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ border: `1px solid ${colors.border}` }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={20} style={{ color: colors.text }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: colors.text }}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);

    // System push notification for deadlines
    if (toast.type === 'deadline' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`⏰ ${toast.title}`, { body: toast.message, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification(`⏰ ${toast.title}`, { body: toast.message, icon: '/favicon.ico' });
          }
        });
      }
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-24 right-6 z-[100] flex flex-col-reverse gap-3">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <GlassToast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════
// Deadline Check Hook
// ═══════════════════════════════════════════════════════

export function useDeadlineReminders() {
  const { addToast } = useToast();

  const checkDeadlines = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('zenith_tasks');
      if (!stored) return;
      const tasks = JSON.parse(stored);
      const now = new Date();

      tasks.forEach((task: { id: string; title: string; deadline?: string; completed: boolean; notified15?: boolean; notified30?: boolean; notified60?: boolean }) => {
        if (!task.deadline || task.completed) return;
        const deadline = new Date(task.deadline);
        const diff = (deadline.getTime() - now.getTime()) / 60000; // minutes

        if (diff > 0 && diff <= 15 && !task.notified15) {
          addToast({ type: 'deadline', title: '15 min remaining!', message: task.title, duration: 8000 });
          task.notified15 = true;
        } else if (diff > 15 && diff <= 30 && !task.notified30) {
          addToast({ type: 'deadline', title: '30 min remaining', message: task.title, duration: 6000 });
          task.notified30 = true;
        } else if (diff > 30 && diff <= 60 && !task.notified60) {
          addToast({ type: 'warning', title: '1 hour remaining', message: task.title, duration: 5000 });
          task.notified60 = true;
        }
      });

      localStorage.setItem('zenith_tasks', JSON.stringify(tasks));
    } catch { /* ignore */ }
  }, [addToast]);

  React.useEffect(() => {
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30000);
    return () => clearInterval(interval);
  }, [checkDeadlines]);
}
