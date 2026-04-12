import { v4 as uuidv4 } from 'uuid';
import { getLocalISODate } from './utils';

// ═══════════════════════════════════════════════════════
// ZENITH OS — Type Definitions
// ═══════════════════════════════════════════════════════

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string; // ISO date string
  deadlineTime?: string; // HH:MM
  deadlineAmPm?: 'AM' | 'PM';
  location?: string;
  imageUrl?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  notified15?: boolean;
  notified30?: boolean;
  notified60?: boolean;
}

export interface FocusSession {
  id: string;
  type: 'work' | 'break' | 'longBreak';
  duration: number; // seconds
  completedAt: string;
  date: string; // YYYY-MM-DD
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  targetDays?: number;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  checkins: string[]; // array of date strings YYYY-MM-DD
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  category: string;
  color: string;
  taskId?: string;
}

export interface UserProfile {
  xp: number;
  level: number;
  badges: string[];
  totalFocusMinutes: number;
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export const CATEGORIES = [
  { name: 'Work', color: '#00F0FF', icon: 'Briefcase' },
  { name: 'Personal', color: '#8B5CF6', icon: 'User' },
  { name: 'Health', color: '#34D399', icon: 'Heart' },
  { name: 'Learning', color: '#FBBF24', icon: 'BookOpen' },
  { name: 'Finance', color: '#F472B6', icon: 'DollarSign' },
  { name: 'Creative', color: '#FB923C', icon: 'Palette' },
];

export const XP_PER_LEVEL = 500;
export const XP_TASK_COMPLETE = 25;
export const XP_FOCUS_SESSION = 50;
export const XP_HABIT_CHECKIN = 15;
export const XP_STREAK_BONUS = 10;

// ═══════════════════════════════════════════════════════
// LocalStorage Helpers
// ═══════════════════════════════════════════════════════

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(`zenith_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`zenith_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
}

// ═══════════════════════════════════════════════════════
// Task Store
// ═══════════════════════════════════════════════════════

export function getTasks(): Task[] {
  return getStorage<Task[]>('tasks', []);
}

export function saveTasks(tasks: Task[]): void {
  setStorage('tasks', tasks);
}

export function addTask(task: Omit<Task, 'id' | 'createdAt' | 'completed'>): Task {
  const newTask: Task = {
    ...task,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    completed: false,
  };
  const tasks = getTasks();
  tasks.unshift(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks(tasks);
  return tasks[idx];
}

export function deleteTask(id: string): void {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
}

export function completeTask(id: string): Task | null {
  const profile = getProfile();
  profile.xp += XP_TASK_COMPLETE;
  profile.totalTasksCompleted += 1;
  profile.level = Math.floor(profile.xp / XP_PER_LEVEL) + 1;
  saveProfile(profile);
  return updateTask(id, { completed: true, completedAt: new Date().toISOString() });
}

export function uncompleteTask(id: string): Task | null {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (!task || !task.completed) return null;
  const profile = getProfile();
  profile.xp = Math.max(0, profile.xp - XP_TASK_COMPLETE);
  profile.totalTasksCompleted = Math.max(0, profile.totalTasksCompleted - 1);
  profile.level = Math.floor(profile.xp / XP_PER_LEVEL) + 1;
  saveProfile(profile);
  return updateTask(id, { completed: false, completedAt: undefined });
}

// ═══════════════════════════════════════════════════════
// Focus Store
// ═══════════════════════════════════════════════════════

export function getFocusSessions(): FocusSession[] {
  return getStorage<FocusSession[]>('focus_sessions', []);
}

export function addFocusSession(session: Omit<FocusSession, 'id'>): FocusSession {
  const newSession: FocusSession = { ...session, id: uuidv4() };
  const sessions = getFocusSessions();
  sessions.unshift(newSession);
  setStorage('focus_sessions', sessions);

  const profile = getProfile();
  const minutes = Math.round(session.duration / 60);
  const earnedXp = Math.max(5, minutes * 2); // 2 XP per minute, min 5 XP
  profile.xp += earnedXp;
  profile.totalFocusMinutes += minutes;
  profile.level = Math.floor(profile.xp / XP_PER_LEVEL) + 1;
  saveProfile(profile);

  return newSession;
}

export function clearFocusSessions(): void {
  setStorage('focus_sessions', []);
  const profile = getProfile();
  profile.totalFocusMinutes = 0;
  saveProfile(profile);
}

// ═══════════════════════════════════════════════════════
// Habit Store
// ═══════════════════════════════════════════════════════

export function getHabits(): Habit[] {
  return getStorage<Habit[]>('habits', []);
}

export function saveHabits(habits: Habit[]): void {
  setStorage('habits', habits);
}

export function addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'checkins'>): Habit {
  const newHabit: Habit = {
    ...habit,
    targetDays: habit.targetDays || 30,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    checkins: [],
  };
  const habits = getHabits();
  habits.unshift(newHabit);
  saveHabits(habits);
  return newHabit;
}

export function checkinHabit(id: string, date: string): void {
  const habits = getHabits();
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  if (!habit.checkins.includes(date)) {
    habit.checkins.push(date);
    saveHabits(habits);
    const profile = getProfile();
    profile.xp += XP_HABIT_CHECKIN;
    profile.level = Math.floor(profile.xp / XP_PER_LEVEL) + 1;
    saveProfile(profile);
  }
}

export function uncheckHabit(id: string, date: string): void {
  // Hack prevention: Unchecking is permanently disabled as per user request to lock check-ins.
  // We keep the signature so existing components don't crash before UI updates.
  return;
}

export function updateHabit(id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'checkins'>>): void {
  const habits = getHabits();
  const idx = habits.findIndex(h => h.id === id);
  if (idx !== -1) {
    habits[idx] = { ...habits[idx], ...updates };
    saveHabits(habits);
  }
}

export function deleteHabit(id: string): void {
  const habits = getHabits().filter(h => h.id !== id);
  saveHabits(habits);
}

// ═══════════════════════════════════════════════════════
// Calendar Store
// ═══════════════════════════════════════════════════════

export function getCalendarEvents(): CalendarEvent[] {
  return getStorage<CalendarEvent[]>('calendar_events', []);
}

export function saveCalendarEvents(events: CalendarEvent[]): void {
  setStorage('calendar_events', events);
}

export function addCalendarEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
  const newEvent: CalendarEvent = { ...event, id: uuidv4() };
  const events = getCalendarEvents();
  events.push(newEvent);
  saveCalendarEvents(events);
  return newEvent;
}

export function updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): void {
  const events = getCalendarEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx !== -1) {
    events[idx] = { ...events[idx], ...updates };
    saveCalendarEvents(events);
  }
}

export function deleteCalendarEvent(id: string): void {
  const events = getCalendarEvents().filter(e => e.id !== id);
  saveCalendarEvents(events);
}

// ═══════════════════════════════════════════════════════
// User Profile & XP Store
// ═══════════════════════════════════════════════════════

const DEFAULT_PROFILE: UserProfile = {
  xp: 0,
  level: 1,
  badges: [],
  totalFocusMinutes: 0,
  totalTasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
};

export function getProfile(): UserProfile {
  return getStorage<UserProfile>('profile', { ...DEFAULT_PROFILE });
}

export function saveProfile(profile: UserProfile): void {
  setStorage('profile', profile);
}

export function updateStreak(): void {
  const profile = getProfile();
  const today = getLocalISODate();
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterday = getLocalISODate(yd);


  if (profile.lastActiveDate === today) return;

  if (profile.lastActiveDate === yesterday) {
    profile.currentStreak += 1;
  } else if (profile.lastActiveDate !== today) {
    profile.currentStreak = 1;
  }

  if (profile.currentStreak > profile.longestStreak) {
    profile.longestStreak = profile.currentStreak;
  }

  profile.lastActiveDate = today;
  profile.xp += XP_STREAK_BONUS;
  profile.level = Math.floor(profile.xp / XP_PER_LEVEL) + 1;
  saveProfile(profile);
}

// ═══════════════════════════════════════════════════════
// Pomodoro Settings
// ═══════════════════════════════════════════════════════

export interface PomodoroSettings {
  workDuration: number; // minutes
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

const DEFAULT_POMODORO: PomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export function getPomodoroSettings(): PomodoroSettings {
  return getStorage<PomodoroSettings>('pomodoro_settings', { ...DEFAULT_POMODORO });
}

export function savePomodoroSettings(settings: PomodoroSettings): void {
  setStorage('pomodoro_settings', settings);
}
