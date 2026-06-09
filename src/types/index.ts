export type EventCategory = 'Personal' | 'Work' | 'Study' | 'Health' | 'Other';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type RecurrenceType = 'None' | 'Daily' | 'Weekly' | 'Monthly';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO string or YYYY-MM-DD
  end: string;   // ISO string or YYYY-MM-DD
  isAllDay: boolean;
  category: EventCategory;
  recurrence: RecurrenceType;
  photoUrl?: string; // Firebase Storage URL or base64 Data URL (for local mode)
  photoName?: string;
  reminderMinutesBefore?: number; // 10, 30, 60, 1440 (0 for none)
  
  // Important Date Tracking
  isBirthday?: boolean;
  isAnniversary?: boolean;
  celebrantAge?: number; // Calculated dynamically, or baseline year stored
  referenceYear?: number; // Year of birth or year of marriage
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string; // YYYY-MM-DD
  priority: TaskPriority;
  category?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  accentColor: 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky' | 'teal' | 'violet' | 'orange' | 'fuchsia' | 'cyan' | 'lime' | 'crimson';
  bgPhotoUrl?: string; // Dashboard wallpaper
  bgBlur: number;      // Blur level in px (0 - 40)
  bgOpacity: number;   // Opacity level in % (0 - 100)
}
