import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Settings, LogOut, User, RefreshCw } from 'lucide-react';
import { subscribeToAuth, logout, getEvents, saveEvent, deleteEvent, getTasks, saveTask, deleteTask, getPreferences, savePreferences } from './firebase/db';
import type { AppUser } from './firebase/db';
import type { CalendarEvent, Task, UserPreferences } from './types';
import { AuthModal } from './components/AuthModal';
import { MainDashboard } from './components/MainDashboard';
import { CalendarView } from './components/CalendarView';
import { TaskManager } from './components/TaskManager';
import { EventModal } from './components/EventModal';
import { SettingsPanel } from './components/SettingsPanel';
import { IntroBanner } from './components/IntroBanner';
import { startReminderService, triggerBrowserNotification, requestNotificationPermission } from './firebase/notification';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Data State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    accentColor: 'indigo',
    bgBlur: 15,
    bgOpacity: 35,
  });

  // Modal / UI States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isIntroDismissed, setIsIntroDismissed] = useState(() => {
    return localStorage.getItem('cal_intro_dismissed') === 'true';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDates, setSelectedDates] = useState<{ start: string; end: string; allDay: boolean } | null>(null);

  // Sync ref to allow the background reminder service to access fresh events without re-binding the interval
  const eventsRef = useRef<CalendarEvent[]>([]);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // 1. Listen to Authentication
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch data upon successful Login
  useEffect(() => {
    if (!user) {
      setEvents([]);
      setTasks([]);
      return;
    }

    const loadData = async () => {
      try {
        const [userEvents, userTasks, userPrefs] = await Promise.all([
          getEvents(user.uid),
          getTasks(user.uid),
          getPreferences(user.uid),
        ]);
        setEvents(userEvents);
        setTasks(userTasks);
        setPreferences(userPrefs);
      } catch (err) {
        console.error('Failed to load user calendar data:', err);
      }
    };

    loadData();
  }, [user]);

  // 3. Force HTML document to remain in dark mode always
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // 4. Start Background Reminder Polling
  useEffect(() => {
    if (!user) return;
    // Polls events every 20s to trigger notifications
    const stopService = startReminderService(() => eventsRef.current, 20000);
    return () => stopService();
  }, [user]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    setUser(null);
    setShowLogoutConfirm(false);
  };

  // ----------------------------------------------------
  // CALENDAR EVENTS DISPATCHERS
  // ----------------------------------------------------
  const handleSaveEvent = async (eventToSave: CalendarEvent) => {
    if (!user) return;
    try {
      await saveEvent(eventToSave);
      const updatedEvents = await getEvents(user.uid);
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    try {
      await deleteEvent(user.uid, eventId);
      const updatedEvents = await getEvents(user.uid);
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // ----------------------------------------------------
  // TASKS DISPATCHERS
  // ----------------------------------------------------
  const handleAddTask = async (taskDetails: Omit<Task, 'id' | 'userId'>) => {
    if (!user) return;
    const newTask: Task = {
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: user.uid,
      ...taskDetails,
    };
    try {
      await saveTask(newTask);
      const updatedTasks = await getTasks(user.uid);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!user) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const updated = { ...targetTask, isCompleted: !targetTask.isCompleted };
    try {
      await saveTask(updated);
      const updatedTasks = await getTasks(user.uid);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      await deleteTask(user.uid, taskId);
      const updatedTasks = await getTasks(user.uid);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // ----------------------------------------------------
  // PREFERENCES DISPATCHERS
  // ----------------------------------------------------
  const handleUpdatePreferences = async (newPrefs: UserPreferences) => {
    if (!user) return;
    setPreferences(newPrefs);
    try {
      await savePreferences(user.uid, newPrefs);
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      triggerBrowserNotification(
        'Test Alert Successful! 🔔',
        'This is how schedules and tasks will send desktop notifications.',
        user?.photoURL || undefined
      );
    } else {
      alert('Notification permission was denied. Please allow notifications in your browser settings to test.');
    }
  };

  // Open creation modal
  const handleSelectDates = (dates: { start: string; end: string; allDay: boolean }) => {
    setSelectedEvent(null);
    setSelectedDates(dates);
    setIsEventModalOpen(true);
  };

  // Open edit modal
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedDates(null);
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-sm font-semibold tracking-wide text-slate-400">Loading your schedules...</span>
        </div>
      </div>
    );
  }

  // Not Logged In Screen
  if (!user) {
    return (
      <div className="theme-indigo">
        <AuthModal onSuccess={() => {}} />
      </div>
    );
  }

  const userId = user.uid;

  // Custom Wallpaper Style mapping
  const wallpaperStyle = preferences.bgPhotoUrl
    ? {
        backgroundImage: `url(${preferences.bgPhotoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};

  // Accent selector helper
  const accentClass = `theme-${preferences.accentColor}`;

  return (
    <div 
      style={wallpaperStyle}
      className={`min-h-screen relative flex flex-col font-sans transition-all duration-300 ${accentClass} overflow-x-hidden`}
    >
      {/* 1. Backdrop Tint & Blur Layer */}
      {preferences.bgPhotoUrl && (
        <div 
          style={{
            backdropFilter: `blur(${preferences.bgBlur}px)`,
            WebkitBackdropFilter: `blur(${preferences.bgBlur}px)`,
            backgroundColor: `rgba(15, 23, 42, ${preferences.bgOpacity / 100})`
          }}
          className="absolute inset-0 -z-10 transition-all duration-300"
        />
      )}

      {/* 2. Global Header */}
      <header className="w-full py-4 px-6 flex items-center justify-between border-b border-slate-200 dark:border-white/10 glass-card rounded-none select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent text-white shadow-md shadow-accent-glow glow-icon">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">Smart Calendar</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
              Dashboard Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 p-1.5 pr-3.5 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
            <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="text-left leading-none">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {user.displayName || 'Demo Guest'}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-300"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Workspace Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col gap-6">
        
        {/* Onboarding Introduction Banner */}
        <AnimatePresence>
          {!isIntroDismissed && (
            <IntroBanner
              onDismiss={() => {
                localStorage.setItem('cal_intro_dismissed', 'true');
                setIsIntroDismissed(true);
              }}
            />
          )}
        </AnimatePresence>

        {/* Top: Summary widgets */}
        <MainDashboard
          events={events}
          tasks={tasks}
          preferences={preferences}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSelectEvent={handleSelectEvent}
          onToggleTask={handleToggleTask}
        />

        {/* Bottom Grid: Calendar + Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Calendar View (left 3 columns) */}
          <div className="lg:col-span-3 h-full">
            <CalendarView
              events={events}
              onSelectDates={handleSelectDates}
              onSelectEvent={handleSelectEvent}
            />
          </div>

          {/* Tasks Manager (right 1 column) */}
          <div className="lg:col-span-1 h-full dark-glass-card p-4 border-white/10">
            <TaskManager
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </div>
      </main>

      {/* 4. Modals and Settings Panels */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel
            userId={userId}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onTestNotification={handleTestNotification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEventModalOpen && (
          <EventModal
            userId={userId}
            isOpen={isEventModalOpen}
            onClose={() => {
              setIsEventModalOpen(false);
              setSelectedEvent(null);
              setSelectedDates(null);
            }}
            event={selectedEvent}
            selectedDates={selectedDates}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 dark-glass-card border border-white/10 text-white text-center shadow-2xl"
            >
              <h3 className="text-lg font-bold">Sign Out</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Are you sure you want to end your scheduling session?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 font-bold text-xs cursor-pointer transition-colors border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer transition-colors shadow-lg shadow-rose-500/20"
                >
                  Confirm Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
