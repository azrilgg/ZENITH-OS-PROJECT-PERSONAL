'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, MapPin, Clock, Tag, Image as ImageIcon, Trash2, GripVertical,
} from 'lucide-react';
import { Task, CATEGORIES } from '@/lib/store';
import { getDeadlineUrgency, getRelativeTime } from '@/lib/utils';

const urgencyColors = {
  overdue: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#EF4444' },
  urgent: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#EF4444' },
  soon: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: '#FBBF24' },
  normal: { bg: 'transparent', border: 'var(--border-glass)', text: 'var(--text-secondary)' },
  none: { bg: 'transparent', border: 'var(--border-glass)', text: 'var(--text-secondary)' },
};

const priorityDots: Record<string, string> = {
  urgent: '#EF4444',
  high: '#FB923C',
  medium: '#FBBF24',
  low: '#34D399',
};

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, onToggle, onDelete, onClick }: TaskCardProps) {
  const urgency = getDeadlineUrgency(task.deadline || '');
  const uColors = urgencyColors[urgency];
  const catColor = CATEGORIES.find(c => c.name === task.category)?.color || 'var(--neon-cyan)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      whileHover={{ y: -2 }}
      className="group relative glass-card p-4 cursor-pointer last:mb-32"
      style={{
        borderColor: urgency === 'overdue' || urgency === 'urgent' ? uColors.border : undefined,
        background: urgency === 'overdue' || urgency === 'urgent' ? uColors.bg : undefined,
      }}
      onClick={() => onClick(task)}
    >
      {/* Priority indicator line */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ background: priorityDots[task.priority] }}
      />

      <div className="flex items-start gap-3 pl-2">
        {/* Checkbox */}
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className="flex-shrink-0 mt-0.5"
          style={{ color: task.completed ? 'var(--neon-green)' : 'var(--text-tertiary)' }}
        >
          {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`text-sm font-medium truncate ${task.completed ? 'line-through opacity-50' : ''}`}
              style={{ color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
            >
              {task.title}
            </h3>
            {task.imageUrl && (
              <ImageIcon size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {/* Category */}
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: `${catColor}15`,
                color: catColor,
                border: `1px solid ${catColor}30`,
              }}
            >
              <Tag size={8} />
              {task.category}
            </span>

            {/* Deadline */}
            {task.deadline && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-mono"
                style={{ color: uColors.text }}
              >
                <Clock size={10} />
                {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {task.deadlineTime && ` ${task.deadlineTime} ${task.deadlineAmPm || ''}`}
              </span>
            )}

            {/* Location */}
            {task.location && (
              <span
                className="inline-flex items-center gap-1 text-[10px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <MapPin size={10} />
                {task.location}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      </div>

      {/* Image preview */}
      {task.imageUrl && (
        <div className="mt-3 pl-9">
          <div className="relative w-full h-32 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <img src={task.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Created time */}
      <div className="mt-2 pl-9">
        <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}>
          {getRelativeTime(task.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
