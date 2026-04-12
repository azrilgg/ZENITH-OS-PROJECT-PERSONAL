'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Clock, Tag, Upload, Calendar, AlertCircle, Trash2,
} from 'lucide-react';
import { Task, CATEGORIES } from '@/lib/store';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: () => void;
  editTask?: Task | null;
}

export default function TaskModal({ isOpen, onClose, onSave, onDelete, editTask }: TaskModalProps) {
  const [title, setTitle] = useState(editTask?.title || '');
  const [description, setDescription] = useState(editTask?.description || '');
  const [category, setCategory] = useState(editTask?.category || CATEGORIES[0].name);
  const [priority, setPriority] = useState<Task['priority']>(editTask?.priority || 'medium');
  const [deadline, setDeadline] = useState(editTask?.deadline?.split('T')[0] || '');
  const [deadlineTime, setDeadlineTime] = useState(editTask?.deadlineTime || '');
  const [deadlineAmPm, setDeadlineAmPm] = useState<'AM' | 'PM'>(editTask?.deadlineAmPm || 'AM');
  const [location, setLocation] = useState(editTask?.location || '');
  const [imageUrl, setImageUrl] = useState(editTask?.imageUrl || '');
  const fileRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || '');
      setDescription(editTask.description || '');
      setCategory(editTask.category || CATEGORIES[0].name);
      setPriority(editTask.priority || 'medium');
      setDeadline(editTask.deadline?.split('T')[0] || '');
      setDeadlineTime(editTask.deadlineTime || '');
      setDeadlineAmPm(editTask.deadlineAmPm || 'AM');
      setLocation(editTask.location || '');
      setImageUrl(editTask.imageUrl || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0].name);
      setPriority('medium');
      setDeadline('');
      setDeadlineTime('');
      setDeadlineAmPm('AM');
      setLocation('');
      setImageUrl('');
    }
  }, [editTask, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const deadlineISO = deadline ? new Date(`${deadline}T00:00:00`).toISOString() : undefined;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      deadline: deadlineISO,
      deadlineTime: deadlineTime || undefined,
      deadlineAmPm,
      location: location.trim() || undefined,
      imageUrl: imageUrl || undefined,
    });
    onClose();
  };

  const priorities: { value: Task['priority']; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#34D399' },
    { value: 'medium', label: 'Med', color: '#FBBF24' },
    { value: 'high', label: 'High', color: '#FB923C' },
    { value: 'urgent', label: 'Urgent', color: '#EF4444' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 pb-24 cmd-backdrop"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
            style={{ boxShadow: 'var(--shadow-elevated)' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {editTask ? 'Edit Task' : 'New Task'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Body */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto min-h-0">
              {/* Title */}
              <div>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-lg font-medium placeholder:text-white/20 focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <textarea
                  placeholder="Description (optional)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-transparent text-sm placeholder:text-white/15 focus:outline-none resize-none"
                  style={{ color: 'var(--text-secondary)' }}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                  <Tag size={10} className="inline mr-1" /> Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <motion.button
                      key={cat.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCategory(cat.name)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: category === cat.name ? `${cat.color}20` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${category === cat.name ? `${cat.color}40` : 'var(--border-subtle)'}`,
                        color: category === cat.name ? cat.color : 'var(--text-tertiary)',
                      }}
                    >
                      {cat.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                  <AlertCircle size={10} className="inline mr-1" /> Priority
                </label>
                <div className="flex gap-2">
                  {priorities.map(p => (
                    <motion.button
                      key={p.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPriority(p.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: priority === p.value ? `${p.color}20` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${priority === p.value ? `${p.color}40` : 'var(--border-subtle)'}`,
                        color: priority === p.value ? p.color : 'var(--text-tertiary)',
                      }}
                    >
                      {p.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Deadline Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                    <Calendar size={10} className="inline mr-1" /> Date
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus-ring"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      colorScheme: 'dark',
                    }}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                    <Clock size={10} className="inline mr-1" /> Time
                  </label>
                  <input
                    type="text"
                    placeholder="HH:MM"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus-ring"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                    AM/PM
                  </label>
                  <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                    {(['AM', 'PM'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setDeadlineAmPm(v)}
                        className="flex-1 py-2 text-xs font-mono font-medium transition-all"
                        style={{
                          background: deadlineAmPm === v ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)',
                          color: deadlineAmPm === v ? 'var(--neon-cyan)' : 'var(--text-tertiary)',
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                  <MapPin size={10} className="inline mr-1" /> Location
                </label>
                <input
                  type="text"
                  placeholder="Add location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus-ring"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                  <Upload size={10} className="inline mr-1" /> Attachment
                </label>
                <input type="file" ref={fileRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                {imageUrl ? (
                  <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                    <img src={imageUrl} alt="" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full glass"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-6 rounded-lg border-2 border-dashed flex flex-col items-center gap-2 transition-colors hover:border-white/15"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}
                  >
                    <Upload size={20} />
                    <span className="text-xs">Drop image or click to upload</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                {editTask && onDelete && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { onDelete(); onClose(); }}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center text-red-500"
                    title="Delete Task"
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
                onClick={handleSave}
                className="btn-neon text-sm"
                style={{ opacity: title.trim() ? 1 : 0.4 }}
              >
                {editTask ? 'Update Task' : 'Create Task'}
              </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
