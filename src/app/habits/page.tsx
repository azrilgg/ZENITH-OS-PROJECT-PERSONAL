'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Plus, Check, X, Trash2, Award, Star, Trophy, Sparkles,
  Heart, BookOpen, Dumbbell, Droplets, Brain, Moon,
  ChevronLeft, ChevronRight, Edit2, Lock, Zap, Shield,
  Target, AlertTriangle, TrendingUp, Crown, Calendar,
} from 'lucide-react';
import { useToast } from '@/components/notifications/ToastProvider';
import { useSound } from '@/components/sound/SoundProvider';
import {
  getHabits, addHabit, checkinHabit, deleteHabit, updateHabit,
  getProfile, Habit, XP_HABIT_CHECKIN,
} from '@/lib/store';
import HabitModal from '@/components/habits/HabitModal';
import {
  calculateStreak, getLocalISODate, getHabitPhase, getHabitMomentumStatus,
  getStreakGlowLevel, getMissedDayStatus, getNextMilestone, getArchitectInsight,
  PHASE_CONFIG, MOMENTUM_CONFIG,
} from '@/lib/utils';

// ═══════════════════════════════════════════════════════
// The Architect — Habit Tracker Interface
// ═══════════════════════════════════════════════════════

const HABIT_ICONS: { [key: string]: React.ElementType } = {
  '🏋️': Dumbbell, '📚': BookOpen, '💧': Droplets, '🧠': Brain,
  '❤️': Heart, '🌙': Moon, '⭐': Star,
};

const ARCHITECT_BADGES = [
  { name: 'First Check-in', desc: 'Your first habit check-in', xpReq: 15, icon: Star, color: '#34D399' },
  { name: 'Spark Ignited', desc: 'Reach Level 2', xpReq: 500, icon: Sparkles, color: '#00F0FF' },
  { name: 'System Online', desc: '7-day streak on any habit', streakReq: 7, icon: Flame, color: '#FB923C' },
  { name: 'Architect', desc: '21-day streak — System Architect', streakReq: 21, icon: Shield, color: '#8B5CF6' },
  { name: 'God-Mode', desc: '66-day streak — Full Integration', streakReq: 66, icon: Crown, color: '#FBBF24' },
];

const DAYS_PER_PAGE = 14;

// ═══════════════════════════════════════════════════════
// Helper: Build the day-number grid for a habit
// ═══════════════════════════════════════════════════════

function getHabitDayGrid(habit: Habit, page: number) {
  const targetDays = habit.targetDays || 30;
  const startDate = new Date(habit.createdAt);
  // Normalize start to midnight local
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const today = new Date();
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const totalPages = Math.ceil(targetDays / DAYS_PER_PAGE);
  const safePage = Math.max(0, Math.min(page, totalPages - 1));

  const firstDay = safePage * DAYS_PER_PAGE + 1; // 1-indexed day number
  const lastDay = Math.min(firstDay + DAYS_PER_PAGE - 1, targetDays);

  const days: {
    dayNum: number;
    dateStr: string; // YYYY-MM-DD
    isFuture: boolean;
    isToday: boolean;
    checked: boolean;
  }[] = [];

  for (let dayNum = firstDay; dayNum <= lastDay; dayNum++) {
    const d = new Date(start);
    d.setDate(d.getDate() + (dayNum - 1));
    const dateStr = getLocalISODate(d);
    const isFuture = d > todayNorm;
    const isToday = dateStr === getLocalISODate(todayNorm);
    const checked = habit.checkins.includes(dateStr);
    days.push({ dayNum, dateStr, isFuture, isToday, checked });
  }

  // Date range for this page
  const pageStartDate = new Date(start);
  pageStartDate.setDate(pageStartDate.getDate() + (firstDay - 1));
  const pageEndDate = new Date(start);
  pageEndDate.setDate(pageEndDate.getDate() + (lastDay - 1));

  return {
    days,
    totalPages,
    safePage,
    firstDay,
    lastDay,
    targetDays,
    pageStartDate,
    pageEndDate,
    habitStartDate: start,
  };
}

function formatDateCompact(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ═══════════════════════════════════════════════════════
// Streak Bar Visual Component
// ═══════════════════════════════════════════════════════

function StreakBar({ streak, target }: { streak: number; target: number }) {
  const percentage = Math.min((streak / target) * 100, 100);

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          className="h-full rounded-full"
          style={{
            background: streak >= 30
              ? 'linear-gradient(90deg, #8B5CF6, #F472B6, #FBBF24)'
              : streak >= 7
                ? 'linear-gradient(90deg, #00F0FF, #8B5CF6)'
                : 'linear-gradient(90deg, #34D399, #00F0FF)',
            boxShadow: streak >= 7 ? '0 0 12px rgba(0,240,255,0.4)' : 'none',
          }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold shrink-0" style={{
        color: streak >= 30 ? '#FBBF24' : streak >= 7 ? '#00F0FF' : '#34D399'
      }}>
        {streak}d
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Main Habits Page
// ═══════════════════════════════════════════════════════

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile] = useState(getProfile());
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [editingHabitObj, setEditingHabitObj] = useState<Habit | null>(null);
  const [milestoneAnim, setMilestoneAnim] = useState<string | null>(null);
  // Per-habit page state: habitId -> pageIndex
  const [habitPages, setHabitPages] = useState<Record<string, number>>({});
  const { addToast } = useToast();
  const { playChime } = useSound();

  const refreshData = () => {
    setHabits(getHabits());
    setProfile(getProfile());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const [today, setToday] = useState(() => getLocalISODate());
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getLocalISODate();
      if (now !== today) setToday(now);
    }, 10000);
    return () => clearInterval(interval);
  }, [today]);

  const getPage = (habitId: string) => habitPages[habitId] || 0;
  const setPage = (habitId: string, page: number) => {
    setHabitPages(prev => ({ ...prev, [habitId]: page }));
  };

  const handleCheckin = (id: string, targetDate: string = today) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    const prevLevel = profile.level;
    const prevStreak = calculateStreak(habit.checkins);

    if (habit.checkins.includes(targetDate)) {
      addToast({ type: 'error', title: 'Check-in Locked', message: 'You cannot un-check a logged habit!' });
      return;
    }

    checkinHabit(id, targetDate);
    playChime(0.5);

    const updatedHabits = getHabits();
    const updatedHabit = updatedHabits.find(h => h.id === id);
    const newStreak = updatedHabit ? calculateStreak(updatedHabit.checkins) : prevStreak + 1;

    const prevPhase = getHabitPhase(prevStreak);
    const newPhase = getHabitPhase(newStreak);

    if (newPhase !== prevPhase && newStreak > prevStreak) {
      const phaseConfig = PHASE_CONFIG[newPhase];
      setMilestoneAnim(phaseConfig.label);
      addToast({
        type: 'success',
        title: `🏆 Milestone: ${phaseConfig.label}`,
        message: `New trait unlocked: ${phaseConfig.badge}`,
      });
      setTimeout(() => setMilestoneAnim(null), 4000);
    }

    if ((prevStreak < 7 && newStreak >= 7) || (prevStreak < 30 && newStreak >= 30)) {
      const glowType = newStreak >= 30 ? 'Unstoppable Mode' : 'Blue Streak';
      addToast({
        type: 'success',
        title: `⚡ ${glowType} Activated!`,
        message: `${newStreak}-day streak on ${habit.name}!`,
      });
    }

    addToast({ type: 'success', title: `+${XP_HABIT_CHECKIN} XP`, message: `${habit.name} ${targetDate === today ? 'checked in' : 'past check-in'}!` });
    refreshData();

    const newProfile = getProfile();
    if (newProfile.level > prevLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  };

  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'checkins'>) => {
    if (editingHabitObj) {
      updateHabit(editingHabitObj.id, habitData);
      addToast({ type: 'success', title: 'Habit updated' });
    } else {
      addHabit(habitData);
      addToast({ type: 'success', title: 'System Log: New habit initialized!' });
    }
    setEditingHabitObj(null);
    setShowModal(false);
    refreshData();
  };

  const handleDelete = (id: string) => {
    deleteHabit(id);
    refreshData();
    addToast({ type: 'info', title: 'Habit terminated' });
  };

  const maxStreak = habits.reduce((max, h) => Math.max(max, calculateStreak(h.checkins)), 0);
  const totalCheckins = habits.reduce((sum, h) => sum + h.checkins.length, 0);
  const activeHabits = habits.filter(h => {
    const ms = getMissedDayStatus(h.checkins);
    return ms !== 'reset' && ms !== 'life_support';
  }).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
      <HabitModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingHabitObj(null); }}
        onSave={handleSaveHabit}
        onDelete={() => editingHabitObj && handleDelete(editingHabitObj.id)}
        habitToEdit={editingHabitObj}
      />

      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <motion.div animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.3, 1] }} transition={{ duration: 0.8 }}>
                <Trophy size={64} style={{ color: 'var(--neon-amber)' }} />
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold mt-4 text-gradient-warm">
                Level Up!
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-lg font-mono mt-2" style={{ color: 'var(--neon-amber)' }}>
                Level {profile.level}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone Animation */}
      <AnimatePresence>
        {milestoneAnim && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] pointer-events-none"
          >
            <div className="glass-card px-6 py-3 !rounded-full flex items-center gap-3" style={{ border: '1px solid rgba(251,191,36,0.4)', boxShadow: '0 0 40px rgba(251,191,36,0.2)' }}>
              <Crown size={18} style={{ color: '#FBBF24' }} />
              <span className="text-sm font-bold font-mono uppercase tracking-widest" style={{ color: '#FBBF24' }}>{milestoneAnim}</span>
              <Crown size={18} style={{ color: '#FBBF24' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Header — The Architect ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        className="mb-14 mt-4 flex flex-col items-center justify-center text-center relative"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="inline-flex items-center justify-center p-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Flame size={18} style={{ color: 'var(--neon-amber)' }} />
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] px-3 py-1.5 rounded-md" style={{ background: 'rgba(0,240,255,0.06)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,0.15)' }}>
            The Architect
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase mb-6" style={{ textShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}>
          Habits <span style={{ color: 'var(--text-tertiary)', fontWeight: 300 }}>&amp; Momentum</span>
        </h1>

        <div className="flex items-center justify-center w-full max-w-xs mb-5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditingHabitObj(null); setShowModal(true); }}
            className="btn-neon text-xs w-full flex items-center justify-center gap-2 !py-3"
            style={{ boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)' }}
          >
            <Plus size={14} />
            <span className="inline text-[11px] font-bold uppercase tracking-wider">New Challenge</span>
          </motion.button>
        </div>

        <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>
          Consistency Engine // Never Miss Twice
        </p>
      </motion.div>

      {/* ═══ Overview Stats ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
      >
        {[
          { label: 'Active Habits', value: `${activeHabits}/${habits.length}`, icon: Target, color: '#00F0FF' },
          { label: 'Max Streak', value: `${maxStreak}d`, icon: Flame, color: '#FB923C' },
          { label: 'Total Check-ins', value: totalCheckins, icon: Check, color: '#34D399' },
          { label: 'Level', value: profile.level, icon: TrendingUp, color: '#FBBF24' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className="glass-card !rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon size={12} style={{ color: stat.color }} />
              <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</span>
            </div>
            <p className="text-xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ Habit Cards ═══ */}
      <div className="space-y-5 mb-8">
        <AnimatePresence>
          {habits.map((habit, idx) => {
            const streak = calculateStreak(habit.checkins);
            const phase = getHabitPhase(streak);
            const phaseConfig = PHASE_CONFIG[phase];
            const missedStatus = getMissedDayStatus(habit.checkins);
            const momentum = getHabitMomentumStatus(streak, missedStatus);
            const momentumConfig = MOMENTUM_CONFIG[momentum];
            const glowLevel = getStreakGlowLevel(streak);
            const nextMilestone = getNextMilestone(streak);
            const insight = getArchitectInsight(phase, streak, missedStatus);
            const checkedToday = habit.checkins.includes(today);
            const targetDays = habit.targetDays || 30;
            const progress = habit.checkins.length;
            const completedTarget = progress >= targetDays;

            // Per-habit day grid
            const currentPage = getPage(habit.id);
            const grid = getHabitDayGrid(habit, currentPage);

            const glowStyle = glowLevel === 'purple'
              ? { border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 25px rgba(139,92,246,0.15), 0 0 60px rgba(139,92,246,0.05)' }
              : glowLevel === 'blue'
                ? { border: '1px solid rgba(0,240,255,0.3)', boxShadow: '0 0 20px rgba(0,240,255,0.12), 0 0 50px rgba(0,240,255,0.04)' }
                : missedStatus === 'life_support'
                  ? { border: '1px solid rgba(251,191,36,0.35)', boxShadow: '0 0 15px rgba(251,191,36,0.1)' }
                  : missedStatus === 'reset'
                    ? { border: '1px solid rgba(85,85,112,0.3)' }
                    : {};

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: idx * 0.05 }}
                className="group glass-card p-4 sm:p-5"
                style={glowStyle}
              >
                {/* ── Row 1: Status + Name + Actions ── */}
                <div className="flex items-center gap-3 mb-3">
                  <motion.button
                    whileHover={{ scale: checkedToday ? 1 : 1.15 }}
                    whileTap={{ scale: checkedToday ? 1 : 0.85 }}
                    onClick={() => !checkedToday && handleCheckin(habit.id)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${checkedToday ? 'cursor-default' : 'cursor-pointer'}`}
                    style={{
                      background: checkedToday ? `${habit.color}20` : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${checkedToday ? habit.color : 'var(--border-subtle)'}`,
                      color: checkedToday ? habit.color : 'var(--text-tertiary)',
                      boxShadow: checkedToday ? `0 0 15px ${habit.color}30` : 'none',
                    }}
                  >
                    {checkedToday ? <Lock size={16} /> : <span className="text-lg">{habit.icon}</span>}
                  </motion.button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {habit.name}
                      </h3>
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: `${momentumConfig.color}15`,
                          color: momentumConfig.color,
                          border: `1px solid ${momentumConfig.color}30`,
                        }}
                      >
                        <span>{momentumConfig.emoji}</span>
                        {momentumConfig.label}
                      </span>
                      {completedTarget && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
                          <Award size={10} />
                          MASTERED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: phaseConfig.color }}>
                        ▸ {phaseConfig.label}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                        — {progress}/{targetDays} days
                      </span>
                    </div>
                  </div>

                  <div className="flex opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => { setEditingHabitObj(habit); setShowModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-all mr-1"
                      style={{ color: 'var(--text-tertiary)' }}>
                      <Edit2 size={14} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(habit.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                      style={{ color: 'var(--text-tertiary)' }}>
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* ── Row 2: Streak Bar + Milestone ── */}
                <div className="mb-3 ml-0 sm:ml-[56px] mt-4 sm:mt-0">
                  <StreakBar streak={streak} target={nextMilestone.target} />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      Streak: {streak} day{streak !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: phaseConfig.color }}>
                      Next: {nextMilestone.label} in {nextMilestone.daysLeft}d
                    </span>
                  </div>
                </div>

                {/* ── Row 3: Architect's Insight ── */}
                <div className="mb-4 ml-0 sm:ml-[56px]">
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <Brain size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--neon-cyan)' }} />
                    <p className="text-[10px] leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                      {insight}
                    </p>
                  </div>
                </div>

                {/* ── Row 4: Per-Habit Day Grid with Navigation ── */}
                <div className="ml-0 sm:ml-[56px]">
                  {/* Grid header: start date + navigation + page info */}
                  <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={10} style={{ color: 'var(--text-tertiary)' }} />
                      <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                        Started {formatDateCompact(grid.habitStartDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setPage(habit.id, grid.safePage - 1)}
                        disabled={grid.safePage <= 0}
                        className="p-1 rounded-md transition-colors hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <ChevronLeft size={12} />
                      </motion.button>
                      <span className="text-[9px] font-mono tracking-wider" style={{ color: 'var(--neon-cyan)' }}>
                        Day {grid.firstDay}–{grid.lastDay}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setPage(habit.id, grid.safePage + 1)}
                        disabled={grid.safePage >= grid.totalPages - 1}
                        className="p-1 rounded-md transition-colors hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <ChevronRight size={12} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Date range label */}
                  <div className="mb-2">
                    <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDateCompact(grid.pageStartDate)} — {formatDateCompact(grid.pageEndDate)}
                    </span>
                  </div>

                  {/* Day number grid */}
                  <div className="grid grid-cols-7 lg:grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5 sm:gap-2">
                    {grid.days.map((day) => (
                      <motion.div
                        key={day.dayNum}
                        whileHover={{ scale: day.isFuture ? 1 : 1.15 }}
                        whileTap={{ scale: day.isFuture ? 1 : 0.9 }}
                        onClick={() => !day.checked && !day.isFuture && handleCheckin(habit.id, day.dateStr)}
                        className={`aspect-square sm:aspect-auto sm:h-12 lg:h-auto lg:aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative
                          ${day.isFuture ? 'opacity-25 cursor-not-allowed' : day.checked ? 'cursor-default' : 'cursor-pointer hover:bg-white/10'}`}
                        style={{
                          background: day.checked
                            ? `${habit.color}20`
                            : day.isToday
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(255,255,255,0.02)',
                          border: day.isToday
                            ? `2px solid ${habit.color}70`
                            : day.checked
                              ? `1px solid ${habit.color}40`
                              : '1px solid rgba(255,255,255,0.04)',
                          color: day.checked ? habit.color : 'var(--text-tertiary)',
                          boxShadow: day.checked && glowLevel !== 'none'
                            ? `0 0 8px ${glowLevel === 'purple' ? 'rgba(139,92,246,0.3)' : 'rgba(0,240,255,0.25)'}`
                            : day.checked ? `0 0 4px ${habit.color}15` : 'none',
                        }}
                        title={`Day ${day.dayNum} — ${day.dateStr}`}
                      >
                        {/* Day number */}
                        <span className="text-[9px] font-mono font-bold leading-none">
                          {day.dayNum}
                        </span>
                        {/* Checked indicator */}
                        {day.checked && (
                          <Check size={8} className="mt-0.5" style={{ color: habit.color }} />
                        )}
                        {/* Today dot */}
                        {day.isToday && !day.checked && (
                          <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: habit.color }} />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Page dots indicator */}
                  {grid.totalPages > 1 && (
                    <div className="flex justify-center gap-1 mt-2">
                      {Array.from({ length: grid.totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(habit.id, i)}
                          className="transition-all"
                          style={{
                            width: i === grid.safePage ? 12 : 4,
                            height: 4,
                            borderRadius: 2,
                            background: i === grid.safePage ? habit.color : 'rgba(255,255,255,0.1)',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Missed day warning ── */}
                {missedStatus === 'life_support' && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 ml-0 sm:ml-[56px]">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <AlertTriangle size={14} className="shrink-0" style={{ color: '#FBBF24' }} />
                      <span className="text-[10px] sm:text-[9px] font-mono leading-tight uppercase tracking-wider" style={{ color: '#FBBF24' }}>
                        Never Miss Twice — check in today to save your streak!
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {habits.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
              <Flame size={28} className="mx-auto" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>No habits initialized.</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>The Architect awaits your first challenge.</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setEditingHabitObj(null); setShowModal(true); }}
              className="btn-neon text-xs mt-4">
              <Plus size={14} className="inline mr-1" /> Initialize Habit
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* ═══ Badges & Milestones ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
          <Award size={14} style={{ color: 'var(--neon-amber)' }} />
          System Achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {ARCHITECT_BADGES.map((badge, i) => {
            const unlocked = badge.streakReq
              ? maxStreak >= badge.streakReq
              : profile.xp >= (badge.xpReq || 0);
            return (
              <motion.div key={badge.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="glass-card p-4 text-center relative overflow-hidden"
                style={{
                  opacity: unlocked ? 1 : 0.4,
                  borderColor: unlocked ? `${badge.color}40` : undefined,
                  boxShadow: unlocked ? `0 0 20px ${badge.color}15` : undefined,
                }}>
                {unlocked && (
                  <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 50% 30%, ${badge.color}, transparent 70%)` }} />
                )}
                <badge.icon size={24} className="mx-auto mb-2 relative z-10"
                  style={{ color: unlocked ? badge.color : 'var(--text-tertiary)' }} />
                <p className="text-xs font-semibold relative z-10" style={{ color: unlocked ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {badge.name}
                </p>
                <p className="text-[9px] mt-0.5 relative z-10" style={{ color: 'var(--text-tertiary)' }}>
                  {badge.desc}
                </p>
                {unlocked && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2 relative z-10">
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${badge.color}20`, color: badge.color }}>
                      UNLOCKED
                    </span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
