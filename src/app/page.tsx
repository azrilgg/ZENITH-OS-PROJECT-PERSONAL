'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, FileDown, CheckCircle2, Clock, Zap,
  TrendingUp, SlidersHorizontal, Download, FileJson, FileText,
  FileSpreadsheet, FileType, Sparkles,
} from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskModal from '@/components/tasks/TaskModal';
import CommandPalette from '@/components/tasks/CommandPalette';
import OwnersModal from '@/components/owners/OwnersModal';
import { useToast } from '@/components/notifications/ToastProvider';
import { useSound } from '@/components/sound/SoundProvider';
import {
  Task, getTasks, saveTasks, addTask, deleteTask, completeTask, updateTask, uncompleteTask,
  CATEGORIES, getProfile, getFocusSessions,
} from '@/lib/store';
import { getGreeting } from '@/lib/utils';
import { exportToJSON, exportToTXT, exportToExcel, exportToPDF } from '@/lib/export';

type FilterMode = 'all' | 'active' | 'completed';
type SortMode = 'newest' | 'deadline' | 'priority';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOwners, setShowOwners] = useState(false);
  const [profile, setProfile] = useState({ level: 1, totalTasksCompleted: 0, totalFocusMinutes: 0, currentStreak: 0 });
  const [todayFocusMins, setTodayFocusMins] = useState(0);
  const { addToast } = useToast();
  const { playChime } = useSound();

  const loadData = useCallback(() => {
    setTasks(getTasks());
    setProfile(getProfile());
    const sessions = getFocusSessions();
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date === today);
    const mins = todaySessions.reduce((acc, s) => acc + Math.round(s.duration / 60), 0);
    setTodayFocusMins(mins);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTask = (taskData: Partial<Task>) => {
    addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'completed'>);
    loadData();
    addToast({ type: 'success', title: 'Task created', message: taskData.title });
  };

  const handleUpdateTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      loadData();
      addToast({ type: 'info', title: 'Task updated' });
    }
    setEditingTask(null);
  };

  const handleToggle = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task?.completed) {
      uncompleteTask(id);
    } else {
      completeTask(id);
      playChime(0.7);
      addToast({ type: 'success', title: 'Task completed! +25 XP', message: task?.title });
    }
    loadData();
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    loadData();
    addToast({ type: 'info', title: 'Task deleted' });
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Filter & Sort
  let displayed = [...tasks];
  if (filter === 'active') displayed = displayed.filter(t => !t.completed);
  if (filter === 'completed') displayed = displayed.filter(t => t.completed);
  if (categoryFilter) displayed = displayed.filter(t => t.category === categoryFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayed = displayed.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.location?.toLowerCase().includes(q)
    );
  }

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  if (sortMode === 'deadline') {
    displayed.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  } else if (sortMode === 'priority') {
    displayed.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }
  const activeTasks = tasks.filter(t => !t.completed).length;
  const completedToday = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length;
  const allCompleted = tasks.filter(t => t.completed).length;

  const stats = [
    { label: 'Active Tasks', value: activeTasks, icon: Clock, color: 'var(--neon-cyan)' },
    { label: 'Done Today', value: completedToday, icon: CheckCircle2, color: 'var(--neon-green)' },
    { label: 'All Done', value: allCompleted, icon: CheckCircle2, color: 'var(--neon-pink)' },
    { label: 'Focus Mins', value: todayFocusMins, icon: Zap, color: 'var(--neon-violet)' },
    { label: 'Day Streak', value: profile.currentStreak, icon: TrendingUp, color: 'var(--neon-amber)' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
      {/* Command Palette */}
      <CommandPalette
        onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }}
        onExport={() => setShowExport(true)}
      />

      {/* Owners Modal */}
      <OwnersModal isOpen={showOwners} onClose={() => setShowOwners(false)} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        className="mb-14 mt-4 flex flex-col items-center justify-center text-center relative"
      >
        <p className="text-xs sm:text-sm font-medium tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--text-tertiary)' }}>
          {getGreeting()} ✦
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase mb-4" style={{ textShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}>
          <span className="text-gradient-cyan">ZENITH</span>{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 300 }}>OS</span>
        </h1>

        {/* Owners Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowOwners(true)}
          className="group relative overflow-hidden mb-6 inline-flex items-center justify-center rounded-full transition-all"
          style={{
            boxShadow: '0 0 25px rgba(139, 92, 246, 0.25)',
          }}
        >
          {/* Animated Spinner Background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00F0FF] via-[#8B5CF6] to-[#00F0FF] animate-[spin_3s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Inner Badge Mask */}
          <div className="relative m-[2px] flex flex-col items-center justify-center gap-0.5 px-8 py-2.5 rounded-full bg-[#06060B] z-10 transition-colors group-hover:bg-[#0a0a14]">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[rgba(139,92,246,0.15)] to-[rgba(0,240,255,0.08)] z-0 mix-blend-overlay" />
            
            <div className="relative z-10 flex items-center gap-2">
              <Sparkles size={14} className="animate-pulse" style={{ color: '#00F0FF' }} />
              <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em]" style={{ color: '#C4B5FD' }}>
                The Architect
              </span>
            </div>

            {/* Explicit Click Instruction */}
            <div className="relative z-10 mt-1 flex items-center justify-center">
              <span className="text-[7px] sm:text-[8px] font-mono uppercase tracking-[0.3em] opacity-80" style={{ color: '#00F0FF' }}>
                [Click To Initialize]
              </span>
            </div>
          </div>
        </motion.button>

        <div className="flex items-center justify-center gap-3 w-full max-w-sm">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExport(!showExport)}
            className="btn-glass text-xs flex-1 flex items-center justify-center gap-2 !py-3"
          >
            <Download size={14} />
            <span className="inline text-[11px] font-bold uppercase tracking-wider">Export</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="btn-neon text-xs flex-1 flex items-center justify-center gap-2 !py-3"
            style={{ boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)' }}
          >
            <Plus size={14} />
            <span className="inline text-[11px] font-bold uppercase tracking-wider">New Task</span>
          </motion.button>
        </div>

        {/* CMD+K hint */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <kbd className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}>
            ⌘K
          </kbd>
          <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-medium" style={{ color: 'var(--text-tertiary)' }}>Global Command</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8"
      >
        {stats.map((stat, i) => {
          const isStreak = stat.label === 'Day Streak';
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isStreak
                ? { opacity: 1, y: 0, boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 25px rgba(245,158,11,0.25)', '0 0 0px rgba(245,158,11,0)'] }
                : { opacity: 1, y: 0 }
              }
              transition={isStreak
                ? { delay: 0.15 + i * 0.05, boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                : { delay: 0.15 + i * 0.05 }
              }
              className={`glass-card !rounded-xl p-4 relative overflow-hidden ${i === 4 ? 'col-span-2 sm:col-span-2 md:col-span-1' : ''}`}
              style={{
                border: isStreak ? '1px solid rgba(245,158,11,0.3)' : undefined
              }}
            >
              {isStreak && (
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none"
                  animate={{ background: ['radial-gradient(circle at bottom right, rgba(245,158,11,0.15) 0%, transparent 70%)', 'radial-gradient(circle at bottom right, rgba(245,158,11,0.05) 0%, transparent 60%)', 'radial-gradient(circle at bottom right, rgba(245,158,11,0.15) 0%, transparent 70%)'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <stat.icon size={14} style={{ color: stat.color }} />
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: isStreak ? 'var(--neon-amber)' : 'var(--text-tertiary)' }}>
                      {stat.label}
                    </span>
                  </div>
                  {isStreak && (
                    <motion.span animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      🔥
                    </motion.span>
                  )}
                </div>
                <p className="text-2xl font-bold font-mono" style={{ color: stat.color, textShadow: isStreak ? '0 0 12px rgba(245,158,11,0.6)' : 'none' }}>
                  {stat.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Export Dropdown */}
      <AnimatePresence>
        {showExport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="glass-card !rounded-xl p-4">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Export Tasks</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Excel', icon: FileSpreadsheet, fn: () => exportToExcel(displayed) },
                  { label: 'JSON', icon: FileJson, fn: () => exportToJSON(displayed) },
                  { label: 'PDF', icon: FileType, fn: () => exportToPDF(displayed) },
                  { label: 'TXT', icon: FileText, fn: () => exportToTXT(displayed) },
                ].map(exp => (
                  <motion.button
                    key={exp.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { exp.fn(); addToast({ type: 'success', title: `Exported as ${exp.label}` }); setShowExport(false); }}
                    className="btn-glass text-xs flex items-center gap-2 !py-2 !px-3"
                  >
                    <exp.icon size={14} />
                    {exp.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6 w-full max-w-full"
      >
        {/* Search */}
        <div className="relative w-full md:flex-1 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus-ring"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          />
        </div>

        {/* Status filter */}
        <div className="flex w-full md:w-auto rounded-xl overflow-hidden overflow-x-auto no-scrollbar shrink-0" style={{ border: '1px solid var(--border-subtle)' }}>
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-2 text-[10px] font-medium capitalize transition-all whitespace-nowrap flex-1 md:flex-none text-center"
              style={{
                background: filter === f ? 'rgba(0,240,255,0.1)' : 'transparent',
                color: filter === f ? 'var(--neon-cyan)' : 'var(--text-tertiary)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <SlidersHorizontal size={12} style={{ color: 'var(--text-tertiary)' }} />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="bg-transparent text-[10px] font-medium focus:outline-none cursor-pointer"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <option value="newest">Newest</option>
            <option value="deadline">Deadline</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </motion.div>

      {/* Category pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2 w-full max-w-full snap-x"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCategoryFilter('')}
          className="px-3 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap snap-start shrink-0"
          style={{
            background: !categoryFilter ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${!categoryFilter ? 'rgba(0,240,255,0.3)' : 'var(--border-subtle)'}`,
            color: !categoryFilter ? 'var(--neon-cyan)' : 'var(--text-tertiary)',
          }}
        >
          All
        </motion.button>
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategoryFilter(categoryFilter === cat.name ? '' : cat.name)}
            className="px-3 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap snap-start shrink-0"
            style={{
              background: categoryFilter === cat.name ? `${cat.color}15` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${categoryFilter === cat.name ? `${cat.color}30` : 'var(--border-subtle)'}`,
              color: categoryFilter === cat.name ? cat.color : 'var(--text-tertiary)',
            }}
          >
            {cat.name}
          </motion.button>
        ))}
      </motion.div>

      {/* Task List */}
      <div className="space-y-3 mb-8">
        <AnimatePresence mode="popLayout">
          {displayed.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onClick={handleTaskClick}
            />
          ))}
        </AnimatePresence>

        {displayed.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {tasks.length === 0 ? 'No tasks yet. Create your first one!' : 'No tasks match your filters'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
              className="btn-neon text-xs mt-4"
            >
              <Plus size={14} className="inline mr-1" /> Create Task
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSave={editingTask ? handleUpdateTask : handleAddTask}
        onDelete={() => editingTask && handleDelete(editingTask.id)}
        editTask={editingTask}
      />
    </div>
  );
}
