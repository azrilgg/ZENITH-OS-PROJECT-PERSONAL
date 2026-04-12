import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

export function getRelativeTime(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function getDeadlineUrgency(deadline: string): 'overdue' | 'urgent' | 'soon' | 'normal' | 'none' {
  if (!deadline) return 'none';
  const now = new Date();
  const d = new Date(deadline);
  const diff = d.getTime() - now.getTime();
  const hours = diff / 3600000;

  if (hours < 0) return 'overdue';
  if (hours < 1) return 'urgent';
  if (hours < 24) return 'soon';
  return 'normal';
}

export function getLocalISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateStreak(checkins: string[]): number {
  if (checkins.length === 0) return 0;
  const sorted = [...checkins].sort().reverse();
  const today = getLocalISODate();
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterday = getLocalISODate(yd);

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i - 1]);
    const prev = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

export function randomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ═══════════════════════════════════════════════════════
// The Architect — Habit Intelligence System
// ═══════════════════════════════════════════════════════

export type HabitPhase = 'foundation' | 'architecture' | 'mastery' | 'godmode';
export type MomentumStatus = 'inactive' | 'active' | 'on_fire' | 'at_risk' | 'unstoppable';
export type StreakGlow = 'none' | 'blue' | 'purple';
export type MissedDayStatus = 'healthy' | 'life_support' | 'reset';

/**
 * Determines the habit's Expansion Phase based on total streak length.
 * Foundation (1-7) → Architecture (8-21) → Mastery (22-66) → God-Mode (66+)
 */
export function getHabitPhase(streak: number): HabitPhase {
  if (streak >= 66) return 'godmode';
  if (streak >= 22) return 'mastery';
  if (streak >= 8) return 'architecture';
  return 'foundation';
}

export const PHASE_CONFIG: Record<HabitPhase, { label: string; badge: string; color: string; description: string }> = {
  foundation: {
    label: 'The Foundation',
    badge: 'Aspiring Builder',
    color: '#34D399',
    description: 'Focus on showing up. Consistency beats intensity.',
  },
  architecture: {
    label: 'The Architecture',
    badge: 'System Architect',
    color: '#00F0FF',
    description: 'Form and consistency. Your neural pathways are building.',
  },
  mastery: {
    label: 'The Mastery',
    badge: 'Master Operator',
    color: '#8B5CF6',
    description: 'Optimization phase. This habit is becoming part of your identity.',
  },
  godmode: {
    label: 'God-Mode Integration',
    badge: 'God-Mode Unlocked',
    color: '#FBBF24',
    description: 'This habit has become your operating system.',
  },
};

/**
 * Determines the momentum status of a habit based on streak & missed days.
 */
export function getHabitMomentumStatus(streak: number, missedStatus: MissedDayStatus): MomentumStatus {
  if (streak === 0 && missedStatus === 'reset') return 'inactive';
  if (missedStatus === 'life_support') return 'at_risk';
  if (streak >= 30) return 'unstoppable';
  if (streak >= 7) return 'on_fire';
  if (streak >= 1) return 'active';
  return 'inactive';
}

export const MOMENTUM_CONFIG: Record<MomentumStatus, { label: string; emoji: string; color: string }> = {
  inactive: { label: 'Inactive', emoji: '⊘', color: '#555570' },
  active: { label: 'Active', emoji: '●', color: '#34D399' },
  on_fire: { label: 'On Fire', emoji: '🔥', color: '#FB923C' },
  at_risk: { label: 'At Risk', emoji: '⚠️', color: '#FBBF24' },
  unstoppable: { label: 'Unstoppable', emoji: '⚡', color: '#8B5CF6' },
};

/**
 * Determines the streak glow level.
 * 7+ days → Blue glow. 30+ days → Purple/Neon glow.
 */
export function getStreakGlowLevel(streak: number): StreakGlow {
  if (streak >= 30) return 'purple';
  if (streak >= 7) return 'blue';
  return 'none';
}

/**
 * Determines if the user has missed days using "Never Miss Twice" logic.
 */
export function getMissedDayStatus(checkins: string[]): MissedDayStatus {
  const today = getLocalISODate();
  const d1 = new Date();
  d1.setDate(d1.getDate() - 1);
  const yesterday = getLocalISODate(d1);
  const d2 = new Date();
  d2.setDate(d2.getDate() - 2);
  const twoDaysAgo = getLocalISODate(d2);

  const checkedToday = checkins.includes(today);
  const checkedYesterday = checkins.includes(yesterday);
  const checkedTwoDaysAgo = checkins.includes(twoDaysAgo);

  if (checkedToday || checkedYesterday) return 'healthy';
  if (checkedTwoDaysAgo) return 'life_support';
  if (checkins.length > 0) return 'reset';
  return 'healthy';
}

/**
 * Get the next milestone day count & label from current streak.
 */
export function getNextMilestone(streak: number): { target: number; label: string; daysLeft: number } {
  if (streak < 7) return { target: 7, label: 'Blue Streak', daysLeft: 7 - streak };
  if (streak < 21) return { target: 21, label: 'System Architect', daysLeft: 21 - streak };
  if (streak < 30) return { target: 30, label: 'Unstoppable Mode', daysLeft: 30 - streak };
  if (streak < 66) return { target: 66, label: 'God-Mode Integration', daysLeft: 66 - streak };
  if (streak < 100) return { target: 100, label: 'Century Legend', daysLeft: 100 - streak };
  if (streak < 365) return { target: 365, label: 'Year-One Master', daysLeft: 365 - streak };
  return { target: streak + 100, label: 'Beyond Infinity', daysLeft: 100 };
}

/**
 * Get a contextual insight based on the current phase & streak.
 */
export function getArchitectInsight(phase: HabitPhase, streak: number, missedStatus: MissedDayStatus): string {
  if (missedStatus === 'life_support') {
    return 'Momentum disrupted, but your core system is intact. Execute the Quick Start protocol today to prevent a reset.';
  }
  if (missedStatus === 'reset') {
    return 'System offline. But every legend has a restart arc. Begin the rebuild now — day one is the hardest.';
  }

  switch (phase) {
    case 'foundation':
      if (streak <= 2) return 'The first 3 days are about defeating inertia. Just show up — quality comes later.';
      if (streak <= 5) return 'Your brain is forming new neural pathways. Each day strengthens the circuit.';
      return 'One day from your first milestone. Finish the foundation — momentum compounds from here.';
    case 'architecture':
      if (streak <= 14) return "Week 2 is where most people quit. You're building the architecture that outlasts motivation.";
      return "You're past the danger zone. Your subconscious is adopting this as identity, not just action.";
    case 'mastery':
      if (streak <= 30) return 'Welcome to the mastery phase. Optimize, don\'t just maintain. Push for 1% better.';
      if (streak <= 45) return 'At this point, missing feels wrong. That\'s identity-level change. You are this habit.';
      return "You're approaching God-Mode. This habit has become as automatic as breathing.";
    case 'godmode':
      return "God-Mode achieved. You've transcended discipline — this is now your operating system.";
    default:
      return 'Show up. Build. Repeat.';
  }
}

