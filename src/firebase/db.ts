import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { isMockMode, auth, firestore, storage } from './config';
import type { CalendarEvent, Task, UserPreferences } from '../types';

// Define User Interface matching Firebase User enough for our needs
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------
export const loginWithEmail = async (email: string, password: string): Promise<AppUser> => {
  if (isMockMode) {
    // Simulate mock login
    const mockUser: AppUser = {
      uid: 'mock-user-123',
      email: email,
      displayName: email.split('@')[0],
      photoURL: null,
    };
    localStorage.setItem('cal_mock_user', JSON.stringify(mockUser));
    // Trigger storage event manually to notify components in the same window
    window.dispatchEvent(new Event('mock-auth-change'));
    return mockUser;
  }
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    displayName: userCredential.user.displayName,
    photoURL: userCredential.user.photoURL,
  };
};

export const signUpWithEmail = async (email: string, password: string): Promise<AppUser> => {
  if (isMockMode) {
    const mockUser: AppUser = {
      uid: 'mock-user-123',
      email: email,
      displayName: email.split('@')[0],
      photoURL: null,
    };
    localStorage.setItem('cal_mock_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('mock-auth-change'));
    return mockUser;
  }
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // Create default preferences document
  await savePreferences(userCredential.user.uid, {
    theme: 'dark',
    accentColor: 'indigo',
    bgBlur: 10,
    bgOpacity: 50,
  });
  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    displayName: userCredential.user.displayName,
    photoURL: userCredential.user.photoURL,
  };
};

export const loginWithGoogle = async (): Promise<AppUser> => {
  if (isMockMode) {
    const mockUser: AppUser = {
      uid: 'mock-user-123',
      email: 'google-demo@example.com',
      displayName: 'Google Demo User',
      photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=google',
    };
    localStorage.setItem('cal_mock_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('mock-auth-change'));
    return mockUser;
  }
  
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    displayName: userCredential.user.displayName,
    photoURL: userCredential.user.photoURL,
  };
};

export const logout = async (): Promise<void> => {
  if (isMockMode) {
    localStorage.removeItem('cal_mock_user');
    window.dispatchEvent(new Event('mock-auth-change'));
    return;
  }
  await firebaseSignOut(auth);
};

export const subscribeToAuth = (callback: (user: AppUser | null) => void) => {
  if (isMockMode) {
    const checkMockUser = () => {
      const stored = localStorage.getItem('cal_mock_user');
      callback(stored ? JSON.parse(stored) : null);
    };
    
    // Initial check
    checkMockUser();
    
    window.addEventListener('mock-auth-change', checkMockUser);
    return () => window.removeEventListener('mock-auth-change', checkMockUser);
  }
  
  return onAuthStateChanged(auth, (user: FirebaseUser | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    } else {
      callback(null);
    }
  });
};

// ----------------------------------------------------
// EVENTS SERVICE
// ----------------------------------------------------
export const getEvents = async (userId: string): Promise<CalendarEvent[]> => {
  if (isMockMode) {
    const eventsJson = localStorage.getItem(`cal_events_${userId}`);
    return eventsJson ? JSON.parse(eventsJson) : getSampleEvents(userId);
  }
  
  const q = query(collection(firestore, 'events'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const events: CalendarEvent[] = [];
  querySnapshot.forEach((doc) => {
    events.push({ id: doc.id, ...doc.data() } as CalendarEvent);
  });
  return events;
};

export const saveEvent = async (event: CalendarEvent): Promise<void> => {
  if (isMockMode) {
    const events = await getEvents(event.userId);
    const index = events.findIndex((e) => e.id === event.id);
    if (index >= 0) {
      events[index] = event;
    } else {
      events.push(event);
    }
    localStorage.setItem(`cal_events_${event.userId}`, JSON.stringify(events));
    return;
  }
  
  await setDoc(doc(firestore, 'events', event.id), event);
};

export const deleteEvent = async (userId: string, eventId: string): Promise<void> => {
  if (isMockMode) {
    const events = await getEvents(userId);
    const filtered = events.filter((e) => e.id !== eventId);
    localStorage.setItem(`cal_events_${userId}`, JSON.stringify(filtered));
    return;
  }
  
  await deleteDoc(doc(firestore, 'events', eventId));
};

// Helper for Mock Mode - Populates initial calendar events
const getSampleEvents = (userId: string): CalendarEvent[] => {
  const now = new Date();
  
  // Format date helper
  const getDateOffset = (days: number, hours = 12) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hours, 0, 0, 0);
    return d.toISOString();
  };

  const sampleEvents: CalendarEvent[] = [
    {
      id: 'e1',
      userId,
      title: 'Work Project Sync',
      description: 'Weekly team meeting to review progress and milestones.',
      location: 'Conference Room B / Google Meet',
      start: getDateOffset(0, 10), // today at 10am
      end: getDateOffset(0, 11),   // today at 11am
      isAllDay: false,
      category: 'Work',
      recurrence: 'Weekly',
      reminderMinutesBefore: 15,
    },
    {
      id: 'e2',
      userId,
      title: 'Fitness: Evening Run',
      description: '5km park run and stretches.',
      location: 'Sunset Park',
      start: getDateOffset(0, 17), // today at 5pm
      end: getDateOffset(0, 18),   // today at 6pm
      isAllDay: false,
      category: 'Health',
      recurrence: 'None',
      reminderMinutesBefore: 30,
    },
    {
      id: 'e3',
      userId,
      title: 'Vite & Tailwind Research',
      description: 'Study advanced Tailwind CSS transitions and full calendar integrations.',
      start: getDateOffset(1, 14), // tomorrow at 2pm
      end: getDateOffset(1, 16),   // tomorrow at 4pm
      isAllDay: false,
      category: 'Study',
      recurrence: 'None',
      reminderMinutesBefore: 60,
    },
    {
      id: 'e4',
      userId,
      title: 'Dentist Checkup',
      description: 'Routine scaling and checkup.',
      location: 'Dental Wellness Clinic',
      start: getDateOffset(3, 9), // 3 days from now at 9am
      end: getDateOffset(3, 10),  // 3 days from now at 10am
      isAllDay: false,
      category: 'Health',
      recurrence: 'None',
      reminderMinutesBefore: 1440, // 1 day before
    },
    {
      id: 'e5',
      userId,
      title: 'Sarah\'s 28th Birthday',
      description: 'Celebrate Sarah\'s birthday dinner!',
      location: 'La Piazza Trattoria',
      start: getDateOffset(2, 0), // 2 days from now, all day
      end: getDateOffset(2, 23),
      isAllDay: true,
      category: 'Personal',
      recurrence: 'None',
      isBirthday: true,
      referenceYear: now.getFullYear() - 28, // Birth year is 28 years ago
      reminderMinutesBefore: 1440,
    },
    {
      id: 'e6',
      userId,
      title: '10-Year Wedding Anniversary',
      description: 'Decade of love and counting.',
      start: getDateOffset(5, 0), // 5 days from now
      end: getDateOffset(5, 23),
      isAllDay: true,
      category: 'Personal',
      recurrence: 'None',
      isAnniversary: true,
      referenceYear: now.getFullYear() - 10, // Married 10 years ago
      reminderMinutesBefore: 1440,
    }
  ];
  localStorage.setItem(`cal_events_${userId}`, JSON.stringify(sampleEvents));
  return sampleEvents;
};

// ----------------------------------------------------
// TASKS SERVICE
// ----------------------------------------------------
export const getTasks = async (userId: string): Promise<Task[]> => {
  if (isMockMode) {
    const tasksJson = localStorage.getItem(`cal_tasks_${userId}`);
    return tasksJson ? JSON.parse(tasksJson) : getSampleTasks(userId);
  }
  
  const q = query(collection(firestore, 'tasks'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const tasks: Task[] = [];
  querySnapshot.forEach((doc) => {
    tasks.push({ id: doc.id, ...doc.data() } as Task);
  });
  return tasks;
};

export const saveTask = async (task: Task): Promise<void> => {
  if (isMockMode) {
    const tasks = await getTasks(task.userId);
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(`cal_tasks_${task.userId}`, JSON.stringify(tasks));
    return;
  }
  
  await setDoc(doc(firestore, 'tasks', task.id), task);
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  if (isMockMode) {
    const tasks = await getTasks(userId);
    const filtered = tasks.filter((t) => t.id !== taskId);
    localStorage.setItem(`cal_tasks_${userId}`, JSON.stringify(filtered));
    return;
  }
  
  await deleteDoc(doc(firestore, 'tasks', taskId));
};

const getSampleTasks = (userId: string): Task[] => {
  const sampleTasks: Task[] = [
    {
      id: 't1',
      userId,
      title: 'Complete calendar mock database adapter',
      description: 'Implement dual Firebase / localStorage service handlers.',
      isCompleted: true,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'High',
      category: 'Work',
    },
    {
      id: 't2',
      userId,
      title: 'Integrate FullCalendar framework',
      description: 'Add month, week, day views and sync event click actions.',
      isCompleted: false,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'High',
      category: 'Work',
    },
    {
      id: 't3',
      userId,
      title: 'Design CSS glassmorphic panel controls',
      description: 'Add background opacity, blur sliders, and custom accent themes.',
      isCompleted: false,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
      priority: 'Medium',
      category: 'Study',
    },
    {
      id: 't4',
      userId,
      title: 'Schedule dentist appointment follow-up',
      isCompleted: false,
      dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days
      priority: 'Low',
      category: 'Health',
    }
  ];
  localStorage.setItem(`cal_tasks_${userId}`, JSON.stringify(sampleTasks));
  return sampleTasks;
};

// ----------------------------------------------------
// PREFERENCES SERVICE
// ----------------------------------------------------
export const getPreferences = async (userId: string): Promise<UserPreferences> => {
  const defaultPrefs: UserPreferences = {
    theme: 'dark',
    accentColor: 'indigo',
    bgBlur: 15,
    bgOpacity: 35,
  };
  
  if (isMockMode) {
    const prefsJson = localStorage.getItem(`cal_prefs_${userId}`);
    return prefsJson ? JSON.parse(prefsJson) : defaultPrefs;
  }
  
  const q = await getDocs(query(collection(firestore, 'users'), where('__name__', '==', userId)));
  if (q.empty) {
    return defaultPrefs;
  }
  return { ...defaultPrefs, ...q.docs[0].data() } as UserPreferences;
};

export const savePreferences = async (userId: string, prefs: UserPreferences): Promise<void> => {
  if (isMockMode) {
    localStorage.setItem(`cal_prefs_${userId}`, JSON.stringify(prefs));
    window.dispatchEvent(new Event('mock-prefs-change'));
    return;
  }
  
  await setDoc(doc(firestore, 'users', userId), prefs, { merge: true });
};

// ----------------------------------------------------
// STORAGE & FILE UPLOADS
// ----------------------------------------------------
export const uploadFile = async (
  userId: string,
  path: string,
  file: File
): Promise<string> => {
  if (isMockMode) {
    // Return base64 URL so it works offline
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
  
  const storageRef = ref(storage, `${path}/${userId}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

// ----------------------------------------------------
// OTP AUTHENTICATION
// ----------------------------------------------------
export const sendOtpEmail = async (email: string): Promise<string> => {
  if (isMockMode) {
    // Generate a random 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`cal_otp_${email}`, otp);
    sessionStorage.setItem(`cal_otp_time_${email}`, Date.now().toString());
    
    // In Mock Mode we return the generated OTP directly so the UI can display it
    return otp;
  }
  
  // Production Firebase Fallback - we mock returning a code
  return '123456';
};

export const verifyOtp = async (email: string, enteredOtp: string): Promise<AppUser> => {
  if (isMockMode) {
    const correctOtp = sessionStorage.getItem(`cal_otp_${email}`);
    const timeStored = sessionStorage.getItem(`cal_otp_time_${email}`);
    
    // Check if code is older than 5 minutes
    if (timeStored && Date.now() - parseInt(timeStored) > 5 * 60 * 1000) {
      throw new Error('Verification code has expired. Please request a new one.');
    }
    
    // Validate (Allow master bypass 123456 or the generated OTP)
    if (enteredOtp === correctOtp || enteredOtp === '123456') {
      const mockUser: AppUser = {
        uid: `mock_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
      };
      
      localStorage.setItem('cal_mock_user', JSON.stringify(mockUser));
      // Save default preferences
      localStorage.setItem(`cal_prefs_${mockUser.uid}`, JSON.stringify({
        theme: 'dark',
        accentColor: 'indigo',
        bgBlur: 15,
        bgOpacity: 35,
      }));
      
      window.dispatchEvent(new Event('mock-auth-change'));
      return mockUser;
    } else {
      throw new Error('Invalid verification code. Please check your inputs and try again.');
    }
  }
  
  // Live Firebase fallback session registration
  const mockUser: AppUser = {
    uid: `fb_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: email,
    displayName: email.split('@')[0],
    photoURL: null,
  };
  return mockUser;
};
