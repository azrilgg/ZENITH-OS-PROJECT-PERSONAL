'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2 } from 'lucide-react';
import { Habit } from '@/lib/store';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'checkins'>) => void;
  onDelete?: () => void;
  habitToEdit?: Habit | null;
}

const ICONS = ['🏋️', '📚', '💧', '🧠', '❤️', '🌙', '⭐', '🏃', '🎨', '💻', '🧘'];
const COLORS = ['#34D399', '#00F0FF', '#FBBF24', '#EF4444', '#8B5CF6', '#F472B6'];

export default function HabitModal({ isOpen, onClose, onSave, onDelete, habitToEdit }: HabitModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDays, setTargetDays] = useState(30);
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState('#34D399');

  useEffect(() => {
    if (isOpen) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setDescription(habitToEdit.description || '');
        setTargetDays(habitToEdit.targetDays || 30);
        setIcon(habitToEdit.icon);
        setColor(habitToEdit.color);
      } else {
        setName('');
        setDescription('');
        setTargetDays(30);
        setIcon('⭐');
        setColor('#34D399');
      }
    }
  }, [isOpen, habitToEdit]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 pb-24 cmd-backdrop"
        >
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
            style={{ border: `1px solid ${color}40`, boxShadow: `0 0 30px ${color}10` }}
          >
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-primary)]">
              {habitToEdit ? 'Edit Habit' : 'New Habit Challenge'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 p-5 space-y-4 overflow-y-auto min-h-0">
            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Habit Title (e.g. Master React, Daily Run...)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-lg font-medium placeholder:text-white/20 focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <textarea
                  placeholder="Description / Motivation (Why are you building this habit?)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-transparent text-sm placeholder:text-white/15 focus:outline-none resize-none"
                  style={{ color: 'var(--text-secondary)' }}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                  Challenge Duration (Days)
                </label>
                <div className="flex items-center rounded-lg px-3 py-2 w-full focus-within:ring-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={targetDays}
                    onChange={(e) => setTargetDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-transparent text-sm font-mono font-bold focus:outline-none w-16"
                    style={{ color: color }}
                  />
                  <span className="text-xs uppercase tracking-widest ml-2" style={{ color: 'var(--text-tertiary)' }}>days</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              {/* Icon Selection */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: icon === i ? `${color}20` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${icon === i ? `${color}40` : 'var(--border-subtle)'}`,
                      }}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                  Theme Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        backgroundColor: c,
                        border: color === c ? '2px solid white' : '2px solid transparent',
                        transform: color === c ? 'scale(1.1)' : 'scale(1)',
                        opacity: color === c ? 1 : 0.5
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-between p-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              {habitToEdit && onDelete && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { onDelete(); onClose(); }}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center text-red-500"
                  title="Delete Habit"
                >
                  <Trash2 size={16} />
                </motion.button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="btn-glass text-sm"
              >
                Cancel
              </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!name.trim()) return;
                onSave({ name: name.trim(), description: description.trim(), targetDays, icon, color, frequency: 'daily' });
              }}
              className="btn-neon text-sm flex items-center gap-2"
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              {habitToEdit ? 'Save Changes' : 'Create Habit'}
            </motion.button>
            </div>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
