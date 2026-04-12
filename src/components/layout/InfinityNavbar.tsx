'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Timer,
  BarChart3,
  Flame,
  Calendar,
  Sparkles,
  VolumeX,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { getProfile, XP_PER_LEVEL } from '@/lib/store';
import { useSound, AMBIENT_SOUNDS } from '@/components/sound/SoundProvider';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Timer, label: 'Focus', path: '/focus' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Flame, label: 'Habits', path: '/habits' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
];

function RealTimeClock() {
  const [time, setTime] = useState('');
  const [showColon, setShowColon] = useState(true);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
      setShowColon(now.getMilliseconds() < 500);
    };
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1 font-mono text-xs tracking-widest" style={{ color: 'var(--neon-cyan)' }}>
      <span className="neon-text-cyan">{time.slice(0, 2)}</span>
      <motion.span animate={{ opacity: showColon ? 1 : 0.3 }} transition={{ duration: 0.1 }} className="neon-text-cyan">:</motion.span>
      <span className="neon-text-cyan">{time.slice(3, 5)}</span>
      <motion.span animate={{ opacity: showColon ? 1 : 0.3 }} transition={{ duration: 0.1 }} className="neon-text-cyan">:</motion.span>
      <span style={{ color: 'var(--neon-violet)', opacity: 0.8 }}>{time.slice(6, 8)}</span>
    </div>
  );
}

function XPBar() {
  const [profile, setProfile] = useState({ xp: 0, level: 1 });

  useEffect(() => {
    const update = () => setProfile(getProfile());
    update();
    const id = setInterval(update, 2000);
    return () => clearInterval(id);
  }, []);

  const xpInLevel = profile.xp % XP_PER_LEVEL;
  const progress = (xpInLevel / XP_PER_LEVEL) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Sparkles size={12} style={{ color: 'var(--neon-amber)' }} />
        <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--neon-amber)' }}>
          LV.{profile.level}
        </span>
      </div>
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-violet))',
            boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
      <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
        {xpInLevel}/{XP_PER_LEVEL}
      </span>
    </div>
  );
}

function SoundIndicator() {
  const { activeSound, stopAll } = useSound();
  if (!activeSound) return null;
  const sound = AMBIENT_SOUNDS.find(s => s.id === activeSound);
  if (!sound) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.9 }}
      onClick={stopAll}
      className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0 transition-colors hover:bg-white/10"
      style={{
        border: '1px solid rgba(0,240,255,0.15)',
        background: 'rgba(0,240,255,0.05)',
      }}
      title="Click to stop sound"
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-[10px]"
      >
        {sound.emoji}
      </motion.span>
      <span className="text-[7px] font-mono uppercase tracking-wider hidden sm:inline" style={{ color: 'var(--neon-cyan)' }}>
        {sound.label}
      </span>
      <VolumeX size={9} style={{ color: 'var(--text-tertiary)' }} />
    </motion.button>
  );
}

export default function InfinityNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-auto"
    >
      <div
        className="flex items-center justify-center px-1 pt-1.5 md:px-3 md:py-2 md:rounded-2xl border-t md:border md:border-white/5 w-full md:w-auto backdrop-blur-xl"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'rgba(6,6,11,0.85)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
          paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Clock — hidden on mobile */}
        <div className="px-2 py-1.5 border-r hidden lg:flex shrink-0 items-center" style={{ borderColor: 'var(--border-subtle)' }}>
          <RealTimeClock />
        </div>

        {/* Sound Indicator — shown everywhere when active */}
        <div className="hidden sm:flex shrink-0 px-1">
          <SoundIndicator />
        </div>

        {/* Nav Items — always visible, evenly spaced on mobile */}
        <div className="flex items-center justify-around flex-1 md:flex-none md:justify-center gap-0 sm:gap-0.5 md:gap-1 px-0.5 sm:px-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => router.push(item.path)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative flex flex-col items-center gap-0.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors min-w-0"
                style={{
                  color: isActive ? 'var(--neon-cyan)' : 'var(--text-tertiary)',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'rgba(0, 240, 255, 0.08)',
                      border: '1px solid rgba(0, 240, 255, 0.2)',
                      boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={18} className="relative z-10 shrink-0" />
                <span className="relative z-10 text-[8px] sm:text-[9px] font-medium tracking-wide truncate max-w-[52px]">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Mobile Sound Indicator — only on small screens */}
        <div className="flex sm:hidden shrink-0 px-0.5">
          <SoundIndicator />
        </div>

        {/* XP Bar — hidden on mobile */}
        <div className="px-2 py-1.5 border-l hidden lg:flex shrink-0 items-center" style={{ borderColor: 'var(--border-subtle)' }}>
          <XPBar />
        </div>
      </div>
    </motion.nav>
  );
}
