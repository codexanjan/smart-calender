import type { CalendarEvent } from '../types';

// Keep track of reminders sent during the session to avoid duplicate alerts
const sentReminders = new Set<string>();

/**
 * Request browser notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

/**
 * Display a desktop notification
 */
export const triggerBrowserNotification = (title: string, body: string, iconUrl?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  try {
    new Notification(title, {
      body,
      icon: iconUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=calendar',
    });
  } catch (error) {
    console.error('Failed to trigger notification:', error);
  }
};

/**
 * Checks all events for upcoming reminders and sends notifications if necessary.
 * Designed to run in a short interval (e.g. every 15-30 seconds).
 */
export const checkUpcomingReminders = (events: CalendarEvent[]) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  const now = new Date();
  
  events.forEach((event) => {
    if (!event.reminderMinutesBefore || event.reminderMinutesBefore <= 0) {
      return;
    }
    
    const startTime = new Date(event.start);
    // Ignore all-day events starting in the past or invalid dates
    if (isNaN(startTime.getTime())) {
      return;
    }
    
    // Calculate difference in milliseconds
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    // Check if we are inside the window for a notification:
    // e.g. if the event starts in 10 minutes, and the user requested a 10-minute warning.
    // We trigger if diffMins is exactly equal or slightly less than reminderMinutesBefore, up to 1 minute margin.
    const reminderTime = event.reminderMinutesBefore;
    const cacheKey = `${event.id}_${reminderTime}`;
    
    if (diffMins >= 0 && diffMins <= reminderTime && diffMins > reminderTime - 2) {
      if (!sentReminders.has(cacheKey)) {
        sentReminders.add(cacheKey);
        
        let message = `Starts in ${diffMins} minutes!`;
        if (event.location) {
          message += ` Location: ${event.location}`;
        }
        
        triggerBrowserNotification(
          `Reminder: ${event.title}`,
          message,
          event.photoUrl
        );
      }
    }
  });
};

/**
 * Simple background runner that polls events and triggers reminders.
 * Returns a function to stop the service.
 */
export const startReminderService = (
  getEventsCallback: () => CalendarEvent[],
  intervalMs = 30000
): (() => void) => {
  // Try requesting permission upfront (won't prompt if already granted/denied)
  requestNotificationPermission();
  
  const intervalId = setInterval(() => {
    const events = getEventsCallback();
    checkUpcomingReminders(events);
  }, intervalMs);
  
  return () => clearInterval(intervalId);
};
