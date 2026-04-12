'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Clock, Target, Zap, Brain,
  ArrowUpRight, ArrowDownRight, Lightbulb, Trash2, Flame,
  CheckCircle2, Briefcase, User, Heart, BookOpen, DollarSign, Palette,
} from 'lucide-react';
import { getTasks, getFocusSessions, getProfile, getHabits, clearFocusSessions, CATEGORIES, Task, FocusSession, Habit, UserProfile } from '@/lib/store';
import { useToast } from '@/components/notifications/ToastProvider';
import { getLocalISODate } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

type TimeRange = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_year: 'This Year',
  last_year: 'Last Year',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Work: Briefcase,
  Personal: User,
  Health: Heart,
  Learning: BookOpen,
  Finance: DollarSign,
  Creative: Palette,
};

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

function getDateRange(range: TimeRange): { start: Date; end: Date; days: number } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today': return { start: today, end: today, days: 1 };
    case 'yesterday': {
      const yd = new Date(today); yd.setDate(yd.getDate() - 1);
      return { start: yd, end: yd, days: 1 };
    }
    case 'this_week': {
      const dow = today.getDay();
      const s = new Date(today); s.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      return { start: s, end: today, days: Math.ceil((today.getTime() - s.getTime()) / 86400000) + 1 };
    }
    case 'last_week': {
      const dow = today.getDay();
      const s0 = new Date(today); s0.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      const e = new Date(s0); e.setDate(e.getDate() - 1);
      const s = new Date(e); s.setDate(e.getDate() - 6);
      return { start: s, end: e, days: 7 };
    }
    case 'this_month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: s, end: today, days: today.getDate() };
    }
    case 'last_month': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: s, end: e, days: e.getDate() };
    }
    case 'this_year': {
      const s = new Date(today.getFullYear(), 0, 1);
      return { start: s, end: today, days: Math.ceil((today.getTime() - s.getTime()) / 86400000) + 1 };
    }
    case 'last_year': {
      const s = new Date(today.getFullYear() - 1, 0, 1);
      const e = new Date(today.getFullYear() - 1, 11, 31);
      return { start: s, end: e, days: Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1 };
    }
  }
}

// ═══════════════════════════════════════════════════════
// Skeleton Loader — Shown while charts mount
// ═══════════════════════════════════════════════════════
function ChartSkeleton() {
  const SKELETON_HEIGHTS = [35, 72, 45, 80, 25, 60, 50, 40];

  return (
    <div className="w-full h-52 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="w-full h-full animate-pulse flex items-end gap-1 p-4">
        {SKELETON_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md"
            style={{
              background: 'rgba(255,255,255,0.04)',
              height: `${h}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DoughnutSkeleton() {
  return (
    <div className="w-36 h-36 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '3px solid rgba(255,255,255,0.06)' }} />
  );
}

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [timeRange, setTimeRange] = useState<TimeRange>('this_week');
  const [mounted, setMounted] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setTasks(getTasks());
    setSessions(getFocusSessions());
    setHabits(getHabits());
    setProfile(getProfile());
    setMounted(true);
  }, []);

  const { start, end, days } = getDateRange(timeRange);
  const startStr = getLocalISODate(start);
  const endStr = getLocalISODate(end);

  // ─── Filtered data ───
  const rangeTasks = tasks.filter(t => {
    if (!t.completedAt) return false;
    const d = getLocalISODate(new Date(t.completedAt));
    return d >= startStr && d <= endStr;
  });

  const rangeAllTasks = tasks.filter(t => {
    const d = getLocalISODate(new Date(t.createdAt));
    return d >= startStr && d <= endStr;
  });

  const rangeSessions = sessions.filter(s => s.date >= startStr && s.date <= endStr);

  // ─── Daily buckets ───
  const useGroupByMonth = days > 60;
  type DayBucket = { date: string; label: string; tasksCompleted: number; focusMinutes: number; focusHours: number };
  let dailyData: DayBucket[];

  if (useGroupByMonth) {
    const months: Record<string, { tasks: number; focus: number }> = {};
    const d = new Date(start);
    while (d <= end) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { tasks: 0, focus: 0 };
      d.setDate(d.getDate() + 1);
    }
    rangeTasks.forEach(t => { if (!t.completedAt) return; const k = getLocalISODate(new Date(t.completedAt)).slice(0, 7); if (months[k]) months[k].tasks++; });
    rangeSessions.forEach(s => { const k = s.date.slice(0, 7); if (months[k]) months[k].focus += Math.round(s.duration / 60); });
    dailyData = Object.entries(months).map(([key, val]) => ({
      date: key, label: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short' }),
      tasksCompleted: val.tasks, focusMinutes: val.focus, focusHours: +(val.focus / 60).toFixed(1),
    }));
  } else {
    dailyData = [];
    const d = new Date(start);
    while (d <= end) {
      const ds = getLocalISODate(d);
      const dayLabel = days <= 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.getDate().toString();
      const dt = rangeTasks.filter(t => t.completedAt && getLocalISODate(new Date(t.completedAt)) === ds);
      const ds2 = rangeSessions.filter(s => s.date === ds);
      const fm = ds2.reduce((a, s) => a + Math.round(s.duration / 60), 0);
      dailyData.push({ date: ds, label: dayLabel, tasksCompleted: dt.length, focusMinutes: fm, focusHours: +(fm / 60).toFixed(1) });
      d.setDate(d.getDate() + 1);
    }
  }

  // ─── Summary stats ───
  const totalTasksInRange = rangeTasks.length;
  const totalFocusInRange = rangeSessions.reduce((a, s) => a + Math.round(s.duration / 60), 0);
  const allCompleted = tasks.filter(t => t.completed).length;
  const allActive = tasks.filter(t => !t.completed).length;

  // ─── Category breakdown ───
  const categoryData = CATEGORIES.map(cat => {
    const done = rangeTasks.filter(t => t.category === cat.name).length;
    const total = rangeAllTasks.filter(t => t.category === cat.name).length;
    return { ...cat, done, total };
  }).filter(c => c.total > 0 || c.done > 0);

  // ─── Streak ───
  const streakDays = (() => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = getLocalISODate(d);
      const hasTasks = tasks.some(t => t.completedAt && getLocalISODate(new Date(t.completedAt)) === ds);
      const hasFocus = sessions.some(s => s.date === ds);
      const hasHabit = habits.some(h => h.checkins.includes(ds));
      if (hasTasks || hasFocus || hasHabit) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  })();

  // ─── Habits in range ───
  const habitCheckinsInRange = habits.reduce((sum, h) => {
    return sum + h.checkins.filter(c => c >= startStr && c <= endStr).length;
  }, 0);

  // ─── AI Insights ───
  const peakHours = rangeSessions.reduce((acc, s) => {
    const hour = new Date(s.completedAt).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  const peakHour = Object.entries(peakHours).sort(([, a], [, b]) => b - a)[0];
  const peakHourLabel = peakHour ? `${parseInt(peakHour[0])}:00 - ${parseInt(peakHour[0]) + 2}:00` : 'No data yet';

  const avgTasks = days > 0 ? totalTasksInRange / days : 0;
  const recentSlice = dailyData.slice(-3);
  const recentAvg = recentSlice.length > 0 ? recentSlice.reduce((a, d) => a + d.tasksCompleted, 0) / recentSlice.length : 0;
  const trend = recentAvg > avgTasks ? 'up' : recentAvg < avgTasks ? 'down' : 'stable';

  // ─── Charts ───
  const chartLabels = dailyData.map(d => d.label);

  const tasksChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Tasks Completed',
      data: dailyData.map(d => d.tasksCompleted),
      borderColor: '#00F0FF', backgroundColor: 'rgba(0, 240, 255, 0.1)',
      borderWidth: 2, tension: 0.4, fill: true,
      pointBackgroundColor: '#06060B', pointBorderColor: '#00F0FF',
      pointRadius: days <= 14 ? 4 : 2, pointHoverRadius: 6,
    }],
  };

  const focusChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Focus Hours',
      data: dailyData.map(d => d.focusHours),
      backgroundColor: 'rgba(139, 92, 246, 0.8)', hoverBackgroundColor: '#A78BFA',
      borderRadius: 4, borderWidth: 0, barPercentage: days <= 14 ? 0.6 : 0.8,
    }],
  };

  const categoryChartData = {
    labels: categoryData.map(c => c.name),
    datasets: [{
      data: categoryData.map(c => c.done),
      backgroundColor: categoryData.map(c => c.color + '80'),
      borderColor: categoryData.map(c => c.color),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(6,6,11,0.9)', titleColor: 'rgba(255,255,255,0.7)', bodyColor: '#fff',
        bodyFont: { family: 'var(--font-jetbrains)' }, borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1, padding: 12, displayColors: false,
        callbacks: { label: (ctx: any) => `${ctx.parsed.y} ${ctx.dataset.label}` }
      },
    },
    scales: {
      y: {
        beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false },
        ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'var(--font-jetbrains)', size: 10 }, padding: 10 }
      },
      x: {
        grid: { display: false }, border: { display: false },
        ticks: {
          color: 'rgba(255,255,255,0.5)', font: { family: 'var(--font-jetbrains)', size: 10 }, padding: 10,
          maxTicksLimit: days > 30 ? 12 : undefined
        }
      }
    },
    interaction: { mode: 'index' as const, intersect: false },
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(6,6,11,0.9)', bodyColor: '#fff', padding: 10, displayColors: true,
        callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed} tasks` }
      },
    },
  };

  const handleClearAnalytics = () => {
    clearFocusSessions();
    setSessions([]);
    setProfile(getProfile());
    addToast({ type: 'info', title: 'Focus data cleared' });
  };

  const insights = [
    {
      icon: Zap, title: 'Peak Productivity', value: peakHourLabel, color: '#00F0FF',
      description: rangeSessions.length > 0 ? 'Your most focused hours' : 'Complete sessions to see'
    },
    {
      icon: trend === 'up' ? ArrowUpRight : ArrowDownRight, title: 'Task Trend',
      value: trend === 'up' ? 'Rising ↑' : trend === 'down' ? 'Declining ↓' : 'Stable →',
      color: trend === 'up' ? '#34D399' : trend === 'down' ? '#EF4444' : '#FBBF24',
      description: `${recentAvg.toFixed(1)} tasks/day avg`
    },
    {
      icon: Target, title: 'Due Soon', value: tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date(Date.now() + 86400000)).length,
      color: '#EF4444', description: 'Tasks due within 24h'
    },
    {
      icon: Flame, title: 'Activity Streak', value: `${streakDays} day${streakDays !== 1 ? 's' : ''}`,
      color: '#FB923C', description: 'Consecutive active days'
    },
  ];

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
          <div className="inline-flex items-center justify-center p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <BarChart3 size={18} style={{ color: 'var(--neon-violet)' }} />
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] px-3 py-1.5 rounded-md" style={{ background: 'rgba(139,92,246,0.05)', color: 'var(--neon-violet)', border: '1px solid rgba(139,92,246,0.15)' }}>
            Data Matrix
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase mb-6" style={{ textShadow: '0 0 40px rgba(139, 92, 246, 0.2)' }}>
          Analytics <span style={{ color: 'var(--text-tertiary)', fontWeight: 300 }}>&amp; Insights</span>
        </h1>

        <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>
          All Activity // Connected Data
        </p>
      </motion.div>

      {/* Time Range + Clear */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center gap-2 mb-4">
        {(Object.entries(TIME_RANGE_LABELS) as [TimeRange, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTimeRange(key)}
            className="px-3 py-2 rounded-xl text-[10px] font-medium transition-all whitespace-nowrap"
            style={{
              background: timeRange === key ? 'rgba(0,240,255,0.1)' : 'transparent',
              border: `1px solid ${timeRange === key ? 'rgba(0,240,255,0.3)' : 'var(--border-subtle)'}`,
              color: timeRange === key ? 'var(--neon-cyan)' : 'var(--text-tertiary)',
            }}
          >{label}</button>
        ))}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClearAnalytics}
          className="px-3 py-2 rounded-xl text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ml-auto"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
        ><Trash2 size={10} />Clear Focus Data</motion.button>
      </motion.div>

      {/* Date Tag */}
      <p className="text-[10px] font-mono tracking-widest uppercase mb-6" style={{ color: 'var(--text-tertiary)' }}>
        📅 {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>

      {/* ═══ Summary Cards ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Tasks Done', value: totalTasksInRange, color: '#00F0FF', icon: CheckCircle2 },
          { label: 'Active', value: allActive, color: '#FBBF24', icon: Target },
          { label: 'Focus', value: `${Math.round(totalFocusInRange / 60)}h ${totalFocusInRange % 60}m`, color: '#8B5CF6', icon: Clock },
          { label: 'Sessions', value: rangeSessions.length, color: '#F472B6', icon: Brain },
          { label: 'Habits', value: habitCheckinsInRange, color: '#34D399', icon: Flame },
          { label: 'Streak', value: `${streakDays}d`, color: '#FB923C', icon: TrendingUp },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.04 }} className="glass-card !rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <stat.icon size={12} style={{ color: stat.color }} />
              <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</span>
            </div>
            <p className="text-xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ Charts Row 1: Tasks + Focus ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: '#00F0FF', boxShadow: '0 0 10px #00F0FF' }} />
            Tasks Completed
            <span className="ml-auto text-[9px] font-mono" style={{ color: 'var(--neon-cyan)' }}>{totalTasksInRange} total</span>
          </h3>
          <div className="w-full h-52">
            {mounted ? <Line data={tasksChartData} options={chartOptions} /> : <ChartSkeleton />}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: '#8B5CF6', boxShadow: '0 0 10px #8B5CF6' }} />
            Focus Hours
            <span className="ml-auto text-[9px] font-mono" style={{ color: '#8B5CF6' }}>{(totalFocusInRange / 60).toFixed(1)}h</span>
          </h3>
          <div className="w-full h-52">
            {mounted ? <Bar data={focusChartData} options={chartOptions} /> : <ChartSkeleton />}
          </div>
        </motion.div>
      </div>

      {/* ═══ Charts Row 2: Category Breakdown + Activity Log ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <Briefcase size={12} style={{ color: 'var(--neon-cyan)' }} />
            Tasks by Category
          </h3>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-36 h-36 shrink-0">
                {mounted ? <Doughnut data={categoryChartData} options={doughnutOptions} /> : <DoughnutSkeleton />}
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                {categoryData.map(cat => {
                  const Icon = CATEGORY_ICONS[cat.name] || Target;
                  return (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                      <Icon size={11} style={{ color: cat.color }} className="shrink-0" />
                      <span className="text-[10px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                      <span className="text-[10px] font-mono ml-auto shrink-0" style={{ color: cat.color }}>{cat.done}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Complete tasks to see breakdown</p>
          )}
        </motion.div>

        {/* All-Time Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <TrendingUp size={12} style={{ color: 'var(--neon-amber)' }} />
            All-Time Stats
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Total Tasks Completed', value: allCompleted, color: '#00F0FF' },
              { label: 'Total Focus Minutes', value: `${profile.totalFocusMinutes}m`, color: '#8B5CF6' },
              { label: 'Total XP', value: profile.xp, color: '#FBBF24' },
              { label: 'Level', value: profile.level, color: '#34D399' },
              { label: 'Longest Streak', value: `${profile.longestStreak} days`, color: '#FB923C' },
              { label: 'Active Habits', value: `${habits.filter(h => h.checkins.length > 0).length}/${habits.length}`, color: '#F472B6' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ═══ AI Insights ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
          <Lightbulb size={14} style={{ color: 'var(--neon-amber)' }} />
          AI Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <motion.div key={ins.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }} className="glass-card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${ins.color}15`, border: `1px solid ${ins.color}25` }}>
                <ins.icon size={16} style={{ color: ins.color }} />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{ins.title}</p>
                <p className="text-lg font-bold font-mono mt-0.5" style={{ color: ins.color }}>{ins.value}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{ins.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
