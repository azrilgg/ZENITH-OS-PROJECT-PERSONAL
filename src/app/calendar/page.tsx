'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock,
  GripVertical, Download, Upload,
} from 'lucide-react';
import { useToast } from '@/components/notifications/ToastProvider';
import {
  getCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  CalendarEvent, CATEGORIES, getTasks,
} from '@/lib/store';
import { exportFullBackup, importFullBackup } from '@/lib/export';
import { getLocalISODate } from '@/lib/utils';

type ViewMode = 'month' | 'week';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0].name);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null);
  const { addToast } = useToast();

  const refreshEvents = useCallback(() => {
    setEvents(getCalendarEvents());
  }, []);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = getLocalISODate(new Date());

  // Calendar grid — correct local timezone handling
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay(); // 0=Sun, 6=Sat
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const navigateMonth = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  const navigateWeek = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigate = (dir: number) => {
    if (view === 'week') navigateWeek(dir);
    else navigateMonth(dir);
  };

  const getDateStr = (day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  const handleAddEvent = () => {
    if (!newTitle.trim() || !selectedDate) return;
    const catColor = CATEGORIES.find(c => c.name === newCategory)?.color || '#00F0FF';
    addCalendarEvent({
      title: newTitle.trim(),
      date: selectedDate,
      startTime: newStartTime,
      endTime: newEndTime,
      category: newCategory,
      color: catColor,
    });
    refreshEvents();
    setNewTitle('');
    setShowEventForm(false);
    addToast({ type: 'success', title: 'Event added' });
  };

  const handleDeleteEvent = (id: string) => {
    deleteCalendarEvent(id);
    refreshEvents();
    addToast({ type: 'info', title: 'Event removed' });
  };

  // Drag and Drop
  const handleDragStart = (eventId: string) => {
    setDraggedEvent(eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dateStr: string) => {
    if (draggedEvent) {
      updateCalendarEvent(draggedEvent, { date: dateStr });
      refreshEvents();
      setDraggedEvent(null);
      addToast({ type: 'info', title: 'Event moved' });
    }
  };

  const handleDateClick = (day: number) => {
    const dateStr = getDateStr(day);
    setSelectedDate(dateStr);
    setShowEventForm(true);
  };

  // Week view — use local dates to avoid timezone day shifts
  const getWeekDays = () => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const dayOfWeek = d.getDay(); // 0=Sun
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const wd = new Date(startOfWeek);
      wd.setDate(startOfWeek.getDate() + i);
      return wd;
    });
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  const handleBackup = async () => {
    exportFullBackup();
    addToast({ type: 'success', title: 'System backup exported' });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await importFullBackup(file);
          refreshEvents();
          addToast({ type: 'success', title: 'Backup restored!' });
          window.location.reload();
        } catch {
          addToast({ type: 'error', title: 'Import failed' });
        }
      }
    };
    input.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        className="mb-14 mt-4 flex flex-col items-center justify-center text-center relative"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="inline-flex items-center justify-center p-2 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <CalendarIcon size={18} style={{ color: 'var(--neon-green)' }} />
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] px-3 py-1.5 rounded-md" style={{ background: 'rgba(0,240,255,0.06)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,0.15)' }}>
            Zenith Calendar
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase mb-6" style={{ textShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}>
          Calendar <span style={{ color: 'var(--text-tertiary)', fontWeight: 300 }}>Schedule</span>
        </h1>

        <div className="flex items-center justify-center gap-3 w-full max-w-sm mb-5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackup}
            className="btn-glass text-xs flex-1 flex items-center justify-center gap-2 !py-3"
          >
            <Download size={14} />
            <span className="inline text-[11px] font-bold uppercase tracking-wider">Backup</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleImport}
            className="btn-glass text-xs flex-1 flex items-center justify-center gap-2 !py-3"
          >
            <Upload size={14} />
            <span className="inline text-[11px] font-bold uppercase tracking-wider">Restore</span>
          </motion.button>
        </div>

        <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>
          Spatial Scheduling // Data Portability
        </p>
      </motion.div>

      {/* Nav + View Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6"
      >
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2 rounded-xl glass" style={{ color: 'var(--text-tertiary)' }}>
            <ChevronLeft size={16} />
          </motion.button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {view === 'week'
              ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }
          </h2>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(1)} className="p-2 rounded-xl glass" style={{ color: 'var(--text-tertiary)' }}>
            <ChevronRight size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-medium transition-all"
            style={{ background: 'rgba(0,240,255,0.08)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,0.2)' }}
          >
            Today
          </motion.button>
        </div>

        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
          {(['month', 'week'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-2 text-[10px] font-medium capitalize transition-all"
              style={{
                background: view === v ? 'rgba(0,240,255,0.1)' : 'transparent',
                color: view === v ? 'var(--neon-cyan)' : 'var(--text-tertiary)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Month View */}
      {view === 'month' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-widest py-2" style={{ color: 'var(--text-tertiary)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
              const dateStr = getDateStr(day);
              const dayEvents = getEventsForDate(dateStr);
              const isToday = dateStr === today;

              return (
                <motion.div
                  key={dateStr}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleDateClick(day)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(dateStr)}
                  className="aspect-square rounded-xl p-1.5 cursor-pointer transition-all relative overflow-hidden"
                  style={{
                    background: isToday ? 'rgba(0,240,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: isToday ? '1px solid rgba(0,240,255,0.3)' : '1px solid var(--border-subtle)',
                    boxShadow: isToday ? '0 0 15px rgba(0,240,255,0.1)' : 'none',
                  }}
                >
                  <span
                    className="text-base sm:text-lg md:text-xl font-black font-mono leading-none block mb-1"
                    style={{ color: isToday ? 'var(--neon-cyan)' : 'var(--text-secondary)' }}
                  >
                    {day}
                  </span>

                  <div className="flex-1 overflow-hidden space-y-0.5 mt-0.5 md:space-y-1">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={() => handleDragStart(ev.id)}
                        className="text-[8px] font-bold px-1.5 py-1 rounded truncate cursor-grab active:cursor-grabbing"
                        style={{
                          background: ev.color,
                          color: '#06060B', // Dark UI background for striking contrast
                          boxShadow: `0 0 8px ${ev.color}40`,
                        }}
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[7px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card overflow-hidden"
        >
          {/* Day headers — shows weekday name + correct date number */}
          <div className="grid grid-cols-8 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="p-2 flex items-center justify-center">
              <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Time</span>
            </div>
            {weekDays.map((d, idx) => {
              const dateStr = getLocalISODate(d);
              const isToday = dateStr === today;
              const dayOfMonthNum = d.getDate();
              const monthName = d.toLocaleDateString('en-US', { month: 'short' });
              return (
                <div
                  key={dateStr}
                  className="p-2 text-center border-l transition-colors"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    background: isToday ? 'rgba(0,240,255,0.04)' : 'transparent',
                  }}
                >
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider mb-2 block" style={{ color: isToday ? 'var(--neon-cyan)' : 'var(--text-tertiary)' }}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <div
                    className="aspect-square w-8 sm:w-10 md:w-12 mx-auto flex items-center justify-center rounded-md transition-all"
                    style={{
                      background: isToday ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.03)',
                      border: isToday ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: isToday ? '0 0 20px rgba(0,240,255,0.5)' : 'none',
                    }}
                  >
                    <span
                      className="text-base sm:text-xl md:text-2xl font-black font-mono leading-none"
                      style={{
                        color: isToday ? '#06060B' : 'var(--text-primary)',
                      }}
                    >
                      {dayOfMonthNum}
                    </span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-mono font-medium block uppercase tracking-widest mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    {monthName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="max-h-[500px] overflow-y-auto">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b" style={{ borderColor: 'var(--border-subtle)', minHeight: '48px' }}>
                <div className="p-1.5 text-right">
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
                {weekDays.map(d => {
                  const dateStr = getLocalISODate(d);
                  const dayEvents = getEventsForDate(dateStr).filter(e => {
                    if (!e.startTime) return false;
                    const eventHour = parseInt(e.startTime.split(':')[0]);
                    return eventHour === hour;
                  });
                  return (
                    <div
                      key={`${dateStr}-${hour}`}
                      className="border-l p-0.5 relative"
                      style={{ borderColor: 'var(--border-subtle)' }}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(dateStr)}
                      onClick={() => { setSelectedDate(dateStr); setShowEventForm(true); }}
                    >
                      {dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={() => handleDragStart(ev.id)}
                          className="text-[9px] font-bold p-1 rounded cursor-grab mb-0.5 truncate"
                          style={{
                            background: ev.color,
                            color: '#06060B',
                            boxShadow: `0 0 8px ${ev.color}40`,
                          }}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add Event Modal */}
      <AnimatePresence>
        {showEventForm && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center px-4 cmd-backdrop"
            onClick={() => setShowEventForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-md rounded-2xl overflow-hidden"
              style={{ boxShadow: 'var(--shadow-elevated)' }}
            >
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h2 className="text-base font-semibold">Add Event</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowEventForm(false)} style={{ color: 'var(--text-tertiary)' }}>
                  <X size={18} />
                </motion.button>
              </div>

              <div className="p-5 space-y-4">
                <input
                  type="text"
                  placeholder="Event title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium placeholder:text-white/20 focus:outline-none"
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Start</label>
                    <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>End</label>
                    <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <motion.button
                        key={cat.name}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setNewCategory(cat.name)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: newCategory === cat.name ? `${cat.color}20` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${newCategory === cat.name ? `${cat.color}40` : 'var(--border-subtle)'}`,
                          color: newCategory === cat.name ? cat.color : 'var(--text-tertiary)',
                        }}
                      >
                        {cat.name}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Existing events for this date */}
                {getEventsForDate(selectedDate).length > 0 && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
                      Events on this day
                    </label>
                    <div className="space-y-1">
                      {getEventsForDate(selectedDate).map(ev => (
                        <div key={ev.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: ev.color }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ev.title}</span>
                            {ev.startTime && (
                              <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                {ev.startTime}
                              </span>
                            )}
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteEvent(ev.id)}
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <X size={12} />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowEventForm(false)} className="btn-glass text-xs">Cancel</motion.button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleAddEvent} className="btn-neon text-xs" style={{ opacity: newTitle.trim() ? 1 : 0.4 }}>
                  Add Event
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
