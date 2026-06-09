import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, CheckSquare, Clock, Gift, Heart, Bell, Sparkles 
} from 'lucide-react';
import type { CalendarEvent, Task, UserPreferences } from '../types';

interface MainDashboardProps {
  events: CalendarEvent[];
  tasks: Task[];
  preferences: UserPreferences;
  onOpenSettings: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onToggleTask: (taskId: string) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  events,
  tasks,
  preferences: _preferences,
  onOpenSettings,
  onSelectEvent,
  onToggleTask: _onToggleTask,
}) => {
  const [time, setTime] = useState(new Date());

  // Keep clock updated for countdowns
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10000); // Update every 10s
    return () => clearInterval(timer);
  }, []);

  // Task summary math
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter events for Today
  const todayStr = time.toISOString().split('T')[0];
  const todayEvents = events.filter((event) => {
    const eventDate = event.start.split('T')[0];
    return eventDate === todayStr;
  }).sort((a, b) => a.start.localeCompare(b.start));

  // Find next upcoming reminder/event


  // Find next closest reminder
  const nextReminderEvent = events
    .filter((event) => {
      if (!event.reminderMinutesBefore || event.reminderMinutesBefore <= 0) return false;
      const start = new Date(event.start);
      return start.getTime() > time.getTime();
    })
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  const getReminderCountdownText = () => {
    if (!nextReminderEvent) return 'No upcoming reminders scheduled.';
    const start = new Date(nextReminderEvent.start);
    const diffMs = start.getTime() - time.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const minsRemaining = diffMins % 60;
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `${nextReminderEvent.title} in ${days} day${days > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${nextReminderEvent.title} in ${diffHours}h ${minsRemaining}m`;
    } else {
      return `${nextReminderEvent.title} in ${diffMins}m`;
    }
  };

  // Birthday & Anniversary Calculations
  const getDaysUntil = (eventDateStr: string) => {
    const eventDate = new Date(eventDateStr);
    const target = new Date(time.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    if (target.getTime() < new Date(time.getFullYear(), time.getMonth(), time.getDate()).getTime()) {
      target.setFullYear(time.getFullYear() + 1);
    }
    
    const diffTime = target.getTime() - new Date(time.getFullYear(), time.getMonth(), time.getDate()).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getSpecialMilestoneText = (event: CalendarEvent) => {
    if (!event.referenceYear) return '';
    const eventDate = new Date(event.start);
    const target = new Date(time.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    if (target.getTime() < new Date(time.getFullYear(), time.getMonth(), time.getDate()).getTime()) {
      target.setFullYear(time.getFullYear() + 1);
    }
    
    const yearDiff = target.getFullYear() - event.referenceYear;
    return event.isBirthday ? `Turning ${yearDiff}` : `${yearDiff} Year Anniversary`;
  };

  const specialDates = events
    .filter((e) => e.isBirthday || e.isAnniversary)
    .map((e) => {
      const daysLeft = getDaysUntil(e.start);
      return {
        event: e,
        daysLeft,
        milestone: getSpecialMilestoneText(e),
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);

  // circular progress parameters
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (taskPct / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-800 dark:text-white">
      
      {/* 1. NEXT REMINDER WIDGET */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="glass-card p-5 flex flex-col justify-between border-white/10"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-accent animate-pulse" /> Next Reminder
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/25">
            Active Alarm
          </span>
        </div>
        <div className="my-auto">
          <p className="text-lg font-bold leading-snug">
            {nextReminderEvent ? nextReminderEvent.title : 'All Caught Up!'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {getReminderCountdownText()}
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/5 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400">Reminders active</span>
          {nextReminderEvent && (
            <button 
              onClick={() => onSelectEvent(nextReminderEvent)}
              className="text-accent hover:underline font-semibold cursor-pointer"
            >
              View event
            </button>
          )}
        </div>
      </motion.div>

      {/* 2. TASK COMPLETION GAUGE */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="glass-card p-5 flex items-center justify-between border-white/10"
      >
        <div className="flex flex-col justify-between h-full flex-1">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
              <CheckSquare className="w-4 h-4 text-accent" /> Tasks Done
            </span>
            <p className="text-2xl font-bold">{completedTasks} / {totalTasks}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {pendingTasks} tasks remaining
            </p>
          </div>
          
          <div className="mt-4 flex gap-3 text-[10px] text-slate-500 dark:text-slate-450 font-bold">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" /> Pending
            </span>
          </div>
        </div>

        {/* Circular Gauge */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-slate-200 dark:stroke-slate-700"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress ring */}
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-accent"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{taskPct}%</span>
          </div>
        </div>
      </motion.div>

      {/* 3. TODAY'S SCHEDULE LIST */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="glass-card p-5 flex flex-col justify-between border-white/10 lg:col-span-1"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
            <Calendar className="w-4 h-4 text-accent" /> Today's Schedule
          </span>

          <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
            {todayEvents.length > 0 ? (
              todayEvents.map((event) => (
                <div 
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors border-l-2 border-accent pl-2.5 gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {event.photoUrl && (
                      <img src={event.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10" />
                    )}
                    <span className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">{event.title}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 shrink-0">
                    {event.isAllDay 
                      ? 'All day' 
                      : new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-450 py-3 text-center">No meetings today.</p>
            )}
          </div>
        </div>
        
        <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2">
          <span>Active events: {todayEvents.length}</span>
          <span className="font-semibold text-slate-500">{new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* 4. BIRTHDAYS & ANNIVERSARIES COUNTDOWN */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="glass-card p-5 flex flex-col justify-between border-white/10"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4 h-4 text-accent" /> Important Dates
          </span>
          
          <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
            {specialDates.length > 0 ? (
              specialDates.map(({ event, daysLeft, milestone }) => (
                <div 
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {event.photoUrl ? (
                      <img src={event.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10" />
                    ) : event.isBirthday ? (
                      <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200 leading-tight">{event.title}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">{milestone}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                    daysLeft === 0 
                      ? 'bg-rose-500 text-white animate-bounce' 
                      : daysLeft <= 7 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                  }`}>
                    {daysLeft === 0 ? 'Today!' : `${daysLeft}d`}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-450 py-3 text-center">No dates tracked.</p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between items-center">
          <span>Tracked milestones</span>
          <button 
            onClick={onOpenSettings}
            className="hover:underline text-accent font-semibold cursor-pointer"
          >
            Configure
          </button>
        </div>
      </motion.div>
    </div>
  );
};
