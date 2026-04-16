'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import InfinityNavbar from './InfinityNavbar';
import { ToastProvider, useDeadlineReminders } from '@/components/notifications/ToastProvider';
import { SoundProvider } from '@/components/sound/SoundProvider';
import { updateStreak } from '@/lib/store';

function DeadlineWatcher() {
  useDeadlineReminders();
  return null;
}

function StreakUpdater() {
  useEffect(() => {
    updateStreak();
  }, []);
  return null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <ToastProvider>
      <SoundProvider>
        <DeadlineWatcher />
        <StreakUpdater />
        <div className="relative min-h-screen grain-overlay bg-grid">
          {/* Ambient glow orbs */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div
              className="absolute -top-40 -left-40 w-96 h-96 opacity-20 transform-gpu"
              style={{ background: 'radial-gradient(circle, var(--neon-cyan) 0%, transparent 70%)' }}
            />
            <div
              className="absolute top-1/3 -right-32 w-80 h-80 opacity-15 transform-gpu"
              style={{ background: 'radial-gradient(circle, var(--neon-violet) 0%, transparent 70%)' }}
            />
            <div
              className="absolute -bottom-20 left-1/3 w-72 h-72 opacity-10 transform-gpu"
              style={{ background: 'radial-gradient(circle, var(--neon-pink) 0%, transparent 70%)' }}
            />
          </div>

          {/* Page content */}
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
              style={{ willChange: 'opacity, transform' }}
              className="relative z-10 pb-40"
            >
              {children}
            </motion.main>
          </AnimatePresence>

          {/* Navbar */}
          <InfinityNavbar />
        </div>
      </SoundProvider>
    </ToastProvider>
  );
}
