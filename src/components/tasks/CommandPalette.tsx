'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Command, LayoutDashboard, Timer, BarChart3, Flame, Calendar,
  FileDown, Plus, Tag, ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getTasks, CATEGORIES, Task } from '@/lib/store';

interface CommandPaletteProps {
  onAddTask?: () => void;
  onExport?: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

export default function CommandPalette({ onAddTask, onExport }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // CMD+K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    { id: 'add-task', label: 'New Task', description: 'Create a new task', icon: Plus, action: () => { onAddTask?.(); setIsOpen(false); }, category: 'Actions' },
    { id: 'export', label: 'Export Tasks', description: 'Export to Excel, JSON, PDF, TXT', icon: FileDown, action: () => { onExport?.(); setIsOpen(false); }, category: 'Actions' },
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to dashboard', icon: LayoutDashboard, action: () => { router.push('/'); setIsOpen(false); }, category: 'Navigation' },
    { id: 'nav-focus', label: 'Focus Mode', description: 'Start a focus session', icon: Timer, action: () => { router.push('/focus'); setIsOpen(false); }, category: 'Navigation' },
    { id: 'nav-analytics', label: 'Analytics', description: 'View productivity insights', icon: BarChart3, action: () => { router.push('/analytics'); setIsOpen(false); }, category: 'Navigation' },
    { id: 'nav-habits', label: 'Habits', description: 'Manage your habits', icon: Flame, action: () => { router.push('/habits'); setIsOpen(false); }, category: 'Navigation' },
    { id: 'nav-calendar', label: 'Calendar', description: 'View calendar timeline', icon: Calendar, action: () => { router.push('/calendar'); setIsOpen(false); }, category: 'Navigation' },
  ];

  // Add tasks to searchable items
  const tasks = typeof window !== 'undefined' ? getTasks() : [];
  const taskItems: CommandItem[] = tasks.slice(0, 10).map(task => ({
    id: `task-${task.id}`,
    label: task.title,
    description: `${task.category} · ${task.completed ? 'Completed' : 'Pending'}`,
    icon: Tag,
    action: () => { setIsOpen(false); },
    category: 'Tasks',
  }));

  const allItems = [...commands, ...taskItems];

  const filtered = query
    ? allItems.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    )
    : allItems;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    }
  };

  // Group by category
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-start justify-center pt-[20vh] px-4 cmd-backdrop"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ boxShadow: 'var(--shadow-elevated), 0 0 40px rgba(0,240,255,0.05)' }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, tasks..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <kbd
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-5 py-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                      {category}
                    </span>
                  </div>
                  {items.map(item => {
                    flatIndex++;
                    const idx = flatIndex;
                    return (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors"
                        style={{
                          background: selectedIndex === idx ? 'rgba(0,240,255,0.06)' : 'transparent',
                          color: selectedIndex === idx ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <item.icon size={16} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate" style={{ color: selectedIndex === idx ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="text-[10px] block truncate" style={{ color: 'var(--text-tertiary)' }}>
                              {item.description}
                            </span>
                          )}
                        </div>
                        {selectedIndex === idx && (
                          <ArrowRight size={12} style={{ color: 'var(--neon-cyan)' }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No results found</p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                ↑↓ Navigate
              </span>
              <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                ↵ Select
              </span>
              <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                ESC Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
