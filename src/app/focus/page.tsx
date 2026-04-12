'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Coffee, Brain, Zap, Volume2, VolumeX,
  SkipForward, Clock, ChevronDown,
} from 'lucide-react';
import { useToast } from '@/components/notifications/ToastProvider';
import { useSound, AMBIENT_SOUNDS } from '@/components/sound/SoundProvider';
import {
  addFocusSession, getFocusSessions, getPomodoroSettings, FocusSession, clearFocusSessions,
} from '@/lib/store';
import { formatTime, getLocalISODate } from '@/lib/utils';

type TimerMode = 'work' | 'break' | 'longBreak' | 'custom';

const MODE_CONFIG = {
  work: { label: 'Focus', color: '#00F0FF', icon: Brain, bg: 'rgba(0,240,255,0.06)' },
  break: { label: 'Break', color: '#34D399', icon: Coffee, bg: 'rgba(52,211,153,0.06)' },
  longBreak: { label: 'Long Break', color: '#8B5CF6', icon: Zap, bg: 'rgba(139,92,246,0.06)' },
  custom: { label: 'Custom', color: '#F472B6', icon: Clock, bg: 'rgba(244,114,182,0.06)' },
};



export default function FocusPage() {
  const settings = getPomodoroSettings();
  const [mode, setMode] = useState<TimerMode>('work');
  const [customMinutes, setCustomMinutes] = useState(20);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalSessions, setTotalSessions] = useState<FocusSession[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const { addToast } = useToast();
  const { activeSound, volume, isMuted, toggleSound, setVolume, setIsMuted, playChime } = useSound();

  // Initialize Web Worker and restore state
  useEffect(() => {
    workerRef.current = new Worker('/timerWorker.js');
    workerRef.current.onmessage = (e) => {
      const { type, remaining } = e.data;
      if (type === 'TICK') {
        setTimeLeft(remaining);
      } else if (type === 'COMPLETE') {
        handleTimerComplete();
      }
    };

    const isRunningStored = localStorage.getItem('zenith_timer_running');
    const targetStr = localStorage.getItem('zenith_timer_target');
    const modeStored = localStorage.getItem('zenith_timer_mode') as TimerMode | null;

    if (modeStored) setMode(modeStored);

    if (isRunningStored === 'true' && targetStr) {
      const targetTime = parseInt(targetStr, 10);
      const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsRunning(true);
        setTimeout(() => workerRef.current?.postMessage({ type: 'START', duration: remaining }), 100);
      } else {
        localStorage.removeItem('zenith_timer_running');
        localStorage.removeItem('zenith_timer_target');
      }
    } else {
      const remainingStored = localStorage.getItem('zenith_timer_remaining');
      if (remainingStored) setTimeLeft(parseInt(remainingStored, 10));
    }

    setTotalSessions(getFocusSessions());
    return () => {
      workerRef.current?.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDuration = useCallback((m: TimerMode) => {
    switch (m) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      case 'custom': return customMinutes * 60;
    }
  }, [settings, customMinutes]);

  const handleTimerComplete = useCallback((skipped: boolean = false) => {
    setIsRunning(false);
    localStorage.removeItem('zenith_timer_running');
    localStorage.removeItem('zenith_timer_target');
    localStorage.removeItem('zenith_timer_remaining');

    if (mode === 'work' || mode === 'custom') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      const dur = mode === 'custom' ? customMinutes * 60 : settings.workDuration * 60;

      if (!skipped) {
        addFocusSession({
          type: 'work',
          duration: dur,
          completedAt: new Date().toISOString(),
          date: getLocalISODate(),
        });
        setTotalSessions(getFocusSessions());
        const earnedXp = Math.max(5, Math.round(dur / 60) * 2);
        addToast({ type: 'success', title: `Focus session complete! +${earnedXp} XP`, duration: 5000 });
      } else {
        addToast({ type: 'info', title: `Session skipped. No XP awarded.` });
      }

      playChime();

      // Auto switch to break
      const nextMode = newSessions % settings.sessionsBeforeLongBreak === 0 ? 'longBreak' : 'break';
      setMode(nextMode);
      setTimeLeft(getDuration(nextMode));
    } else {
      addToast({ type: 'info', title: skipped ? 'Break skipped!' : 'Break over! Ready to focus?' });
      playChime();

      setMode('work');
      setTimeLeft(getDuration('work'));
    }

    // System notification
    if (!skipped && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(mode === 'work' ? '🎯 Focus Session Complete!' : '☕ Break Over!', {
        body: mode === 'work' ? 'Great job! Take a break.' : 'Ready for another session?',
      });
    }
  }, [mode, sessions, settings, addToast, getDuration, customMinutes, playChime]);

  // Update handleTimerComplete in worker
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.onmessage = (e) => {
        const { type, remaining } = e.data;
        if (type === 'TICK') {
          setTimeLeft(remaining);
        } else if (type === 'COMPLETE') {
          handleTimerComplete();
        }
      };
    }
  }, [handleTimerComplete]);

  const startTimer = () => {
    setIsRunning(true);
    localStorage.setItem('zenith_timer_running', 'true');
    localStorage.setItem('zenith_timer_target', (Date.now() + timeLeft * 1000).toString());
    localStorage.setItem('zenith_timer_mode', mode);
    localStorage.removeItem('zenith_timer_remaining');
    workerRef.current?.postMessage({ type: 'START', duration: timeLeft });
  };

  const pauseTimer = () => {
    setIsRunning(false);
    localStorage.removeItem('zenith_timer_running');
    localStorage.setItem('zenith_timer_remaining', timeLeft.toString());
    workerRef.current?.postMessage({ type: 'PAUSE' });
  };

  const resetTimer = () => {
    setIsRunning(false);
    localStorage.removeItem('zenith_timer_running');
    localStorage.removeItem('zenith_timer_target');
    localStorage.removeItem('zenith_timer_remaining');
    const duration = getDuration(mode);
    setTimeLeft(duration);
    workerRef.current?.postMessage({ type: 'RESET', duration });
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    localStorage.removeItem('zenith_timer_running');
    localStorage.removeItem('zenith_timer_target');
    localStorage.removeItem('zenith_timer_remaining');
    localStorage.setItem('zenith_timer_mode', newMode);
    const duration = getDuration(newMode);
    setTimeLeft(duration);
    workerRef.current?.postMessage({ type: 'RESET', duration });
  };

  const skipTimer = () => {
    workerRef.current?.postMessage({ type: 'RESET', duration: 0 });
    handleTimerComplete(true);
  };

  const handleClearHistory = () => {
    clearFocusSessions();
    setTotalSessions([]);
    addToast({ type: 'info', title: 'Focus history cleared' });
  };

  // Audio is managed by global SoundProvider — toggleSound, volume, isMuted come from useSound()

  // Circular progress
  const totalDuration = getDuration(mode);
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const config = MODE_CONFIG[mode];

  const todaySessions = totalSessions.filter(s => s.date === new Date().toISOString().split('T')[0]);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + Math.round(s.duration / 60), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        className="mb-14 mt-4 flex flex-col items-center justify-center text-center relative"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="inline-flex items-center justify-center p-2 rounded-lg" style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)' }}>
            <Brain size={18} style={{ color: 'var(--neon-cyan)' }} />
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] px-3 py-1.5 rounded-md" style={{ background: 'rgba(0,240,255,0.05)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,0.15)' }}>
            Active Flow
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase mb-6" style={{ textShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}>
          Focus <span style={{ color: 'var(--text-tertiary)', fontWeight: 300 }}>Mode</span>
        </h1>

        <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>
          Deep Work Engine • Session {sessions + 1}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Column */}
        <div className="lg:col-span-2">
          {/* Mode Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex rounded-2xl overflow-hidden mb-8"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            {(Object.entries(MODE_CONFIG) as [TimerMode, typeof MODE_CONFIG.work][]).map(([key, val]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all"
                style={{
                  background: mode === key ? val.bg : 'transparent',
                  color: mode === key ? val.color : 'var(--text-tertiary)',
                  borderBottom: mode === key ? `2px solid ${val.color}` : '2px solid transparent',
                }}
              >
                <val.icon size={14} />
                {val.label}
              </button>
            ))}
          </motion.div>

          <AnimatePresence>
            {mode === 'custom' && !isRunning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 flex items-center justify-center"
              >
                <div className="flex items-center glass px-4 py-2 rounded-xl" style={{ border: '1px solid rgba(244,114,182,0.3)' }}>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={customMinutes}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setCustomMinutes(val);
                      setTimeLeft(val * 60);
                      workerRef.current?.postMessage({ type: 'RESET', duration: val * 60 });
                    }}
                    className="bg-transparent text-center text-xl font-mono font-bold focus:outline-none w-20"
                    style={{ color: '#F472B6' }}
                  />
                  <span className="text-xs uppercase tracking-widest ml-2" style={{ color: '#F472B6' }}>minutes</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Circular Timer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center justify-center w-full"
          >
            <div className="relative mb-12 w-[340px] h-[340px] flex items-center justify-center">
              {/* Glow backdrop */}
              <div
                className="absolute inset-0 rounded-full blur-[80px] opacity-20"
                style={{ background: config.color, transform: 'scale(0.8)' }}
              />

              <svg width="340" height="340" viewBox="0 0 340 340" className="absolute -rotate-90">
                {/* Background track */}
                <circle
                  cx="170" cy="170" r={160}
                  fill="none"
                  stroke="rgba(255,255,255,0.02)"
                  strokeWidth="8"
                />
                {/* Progress arc */}
                <motion.circle
                  cx="170" cy="170" r={160}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 160}
                  animate={{ strokeDashoffset: (2 * Math.PI * 160) - (progress / 100) * (2 * Math.PI * 160) }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    filter: `drop-shadow(0 0 10px ${config.color}60)`,
                  }}
                />
                {/* Dot at progress position */}
                <motion.circle
                  cx="170"
                  cy="170"
                  r="6"
                  fill={config.color}
                  animate={{
                    cx: 170 + 160 * Math.cos(((progress / 100) * 360) * Math.PI / 180),
                    cy: 170 + 160 * Math.sin(((progress / 100) * 360) * Math.PI / 180),
                  }}
                  style={{ filter: `drop-shadow(0 0 8px ${config.color})` }}
                />
              </svg>

              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <span className="text-7xl font-mono font-bold tracking-tighter" style={{ color: config.color, textShadow: `0 0 40px ${config.color}40` }}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm font-medium mt-4 uppercase tracking-[0.3em]" style={{ color: 'var(--text-tertiary)' }}>
                  {config.label}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={resetTimer}
                className="p-3 rounded-xl glass"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <RotateCcw size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={isRunning ? pauseTimer : startTimer}
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${config.color}30, ${config.color}10)`,
                  border: `2px solid ${config.color}50`,
                  color: config.color,
                  boxShadow: `0 0 30px ${config.color}20`,
                }}
              >
                {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={skipTimer}
                className="p-3 rounded-xl glass"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <SkipForward size={18} />
              </motion.button>
            </div>

            {/* Session dots */}
            <div className="flex items-center justify-between mt-6 max-w-[280px]">
              <div className="flex items-center gap-2">
                {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      background: i < (sessions % settings.sessionsBeforeLongBreak) ? config.color : 'rgba(255,255,255,0.1)',
                      boxShadow: i < (sessions % settings.sessionsBeforeLongBreak) ? `0 0 8px ${config.color}60` : 'none',
                    }}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSessions(0)}
                className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg glass transition-colors hover:bg-white/5 flex items-center gap-1 opacity-60 hover:opacity-100"
                style={{ color: 'var(--text-tertiary)' }}
                title="Reset Session Cycle"
              >
                <RotateCcw size={10} /> Reset Cycle
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Today Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Today&apos;s Focus
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sessions</span>
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--neon-cyan)' }}>
                  {todaySessions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Focus Time</span>
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--neon-violet)' }}>
                  {todayMinutes}m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Streak</span>
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--neon-amber)' }}>
                  {sessions}
                </span>
              </div>
            </div>
          </motion.div>

          {/* ZenFlow Player */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                🎧 ZenFlow
              </h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMuted(!isMuted)}
                style={{ color: 'var(--text-tertiary)' }}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {AMBIENT_SOUNDS.map(sound => (
                <motion.button
                  key={sound.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggleSound(sound.id)}
                  className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: activeSound === sound.id ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${activeSound === sound.id ? 'rgba(0,240,255,0.3)' : 'var(--border-subtle)'}`,
                    color: activeSound === sound.id ? 'var(--neon-cyan)' : 'var(--text-tertiary)',
                  }}
                >
                  <span className="text-base">{sound.emoji}</span>
                  {sound.label}
                </motion.button>
              ))}
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-3 mt-4">
              <Volume2 size={12} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--neon-cyan), var(--neon-violet))`,
                  accentColor: 'var(--neon-cyan)',
                }}
              />
            </div>
          </motion.div>

          {/* Recent sessions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                <Clock size={12} className="inline mr-1" /> Recent Sessions
              </h3>
              {totalSessions.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded glass transition-colors hover:bg-red-500/10 hover:text-red-400"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {totalSessions.slice(0, 8).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-mono" style={{ color: MODE_CONFIG[s.type]?.color || 'var(--text-tertiary)' }}>
                    {Math.round(s.duration / 60)}m
                  </span>
                </div>
              ))}
              {totalSessions.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                  No sessions yet
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
