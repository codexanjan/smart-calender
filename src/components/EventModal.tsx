import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Clock, MapPin, AlignLeft, Tag, Image as ImageIcon, Sparkles, Bell, Calendar } from 'lucide-react';
import type { CalendarEvent, EventCategory, RecurrenceType } from '../types';
import { uploadFile } from '../firebase/db';

interface EventModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null; // Null means creating new
  selectedDates: { start: string; end: string; allDay: boolean } | null;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  userId,
  isOpen,
  onClose,
  event,
  selectedDates,
  onSave,
  onDelete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>('Personal');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('None');
  const [reminder, setReminder] = useState<number>(0); // minutes before
  
  // Photo Attachment State
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  // Birthday / Anniversary Specific State
  const [isBirthday, setIsBirthday] = useState(false);
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [referenceYear, setReferenceYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit Mode
        setTitle(event.title);
        setDescription(event.description || '');
        setLocation(event.location || '');
        
        // Format ISO strings for datetime-local inputs
        setStart(formatDateForInput(event.start, event.isAllDay));
        setEnd(formatDateForInput(event.end, event.isAllDay));
        setIsAllDay(event.isAllDay);
        setCategory(event.category);
        setRecurrence(event.recurrence);
        setReminder(event.reminderMinutesBefore || 0);
        setPhotoUrl(event.photoUrl);
        setIsBirthday(event.isBirthday || false);
        setIsAnniversary(event.isAnniversary || false);
        setReferenceYear(event.referenceYear || new Date().getFullYear());
      } else if (selectedDates) {
        // Create Mode from selection
        setTitle('');
        setDescription('');
        setLocation('');
        setStart(formatDateForInput(selectedDates.start, selectedDates.allDay));
        setEnd(formatDateForInput(selectedDates.end, selectedDates.allDay));
        setIsAllDay(selectedDates.allDay);
        setCategory('Personal');
        setRecurrence('None');
        setReminder(0);
        setPhotoUrl(undefined);
        setIsBirthday(false);
        setIsAnniversary(false);
        setReferenceYear(new Date().getFullYear());
      }
    }
  }, [isOpen, event, selectedDates]);

  // Formatter: converts ISO to YYYY-MM-DDThh:mm or YYYY-MM-DD
  const formatDateForInput = (dateStr: string, allDay: boolean): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    
    // Adjust for local time zone offset
    const offset = d.getTimezoneOffset();
    const localD = new Date(d.getTime() - offset * 60 * 1000);
    const isoString = localD.toISOString();
    
    return allDay ? isoString.split('T')[0] : isoString.slice(0, 16);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadFile(userId, 'event_photos', file);
      setPhotoUrl(url);
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Build start/end ISO strings based on allDay setting
    let startIso = new Date(start).toISOString();
    let endIso = new Date(end).toISOString();

    if (isAllDay) {
      // Use date-only boundaries
      startIso = new Date(start + 'T00:00:00').toISOString();
      endIso = new Date(end + 'T23:59:59').toISOString();
    }

    const savedEvent: CalendarEvent = {
      id: event?.id || `e_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      start: startIso,
      end: endIso,
      isAllDay,
      category: isBirthday ? 'Personal' : isAnniversary ? 'Personal' : category,
      recurrence,
      reminderMinutesBefore: reminder,
      photoUrl,
      isBirthday,
      isAnniversary,
      referenceYear: (isBirthday || isAnniversary) ? Number(referenceYear) : undefined,
    };

    onSave(savedEvent);
    onClose();
  };

  if (!isOpen) return null;

  const categories: EventCategory[] = ['Personal', 'Work', 'Study', 'Health', 'Other'];
  const recurrences: { label: string; value: RecurrenceType }[] = [
    { label: 'Do not repeat', value: 'None' },
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Monthly', value: 'Monthly' },
  ];
  const reminders = [
    { label: 'No reminder', value: 0 },
    { label: '10 minutes before', value: 10 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before', value: 1440 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg p-6 dark-glass-card border border-white/10 text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {event ? <Sparkles className="w-5 h-5 text-accent" /> : <Calendar className="w-5 h-5 text-accent" />}
            {event ? 'Edit Schedule Event' : 'Create New Event'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event Title"
              className="w-full px-4 py-2.5 text-base font-semibold rounded-xl dark-glass-input border-none"
            />
          </div>

          {/* Time Picker */}
          <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Date & Time settings
              </span>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-4 h-4 bg-slate-900 border-slate-700"
                />
                All-day Event
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Starts</label>
                <input
                  type={isAllDay ? 'date' : 'datetime-local'}
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg dark-glass-input cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ends</label>
                <input
                  type={isAllDay ? 'date' : 'datetime-local'}
                  required
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg dark-glass-input cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Special Date Tracking (Birthdays & Anniversaries) */}
          <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              🎂 Important Date Tracker
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="specialDate"
                  checked={!isBirthday && !isAnniversary}
                  onChange={() => { setIsBirthday(false); setIsAnniversary(false); }}
                  className="text-accent focus:ring-accent bg-slate-900 border-slate-750"
                />
                Standard Event
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="specialDate"
                  checked={isBirthday}
                  onChange={() => { setIsBirthday(true); setIsAnniversary(false); }}
                  className="text-accent focus:ring-accent bg-slate-900 border-slate-750"
                />
                Birthday
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="specialDate"
                  checked={isAnniversary}
                  onChange={() => { setIsAnniversary(true); setIsBirthday(false); }}
                  className="text-accent focus:ring-accent bg-slate-900 border-slate-750"
                />
                Anniversary
              </label>
            </div>

            {(isBirthday || isAnniversary) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2 border-t border-white/5"
              >
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {isBirthday ? 'Birth Year' : 'Event Start Year'} (For countdown age/milestones)
                </label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={referenceYear}
                  onChange={(e) => setReferenceYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full max-w-[150px] px-3 py-1.5 text-xs rounded-lg dark-glass-input"
                />
              </motion.div>
            )}
          </div>

          {/* Details Grid (Location, Description) */}
          <div className="space-y-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add Location"
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg dark-glass-input"
              />
            </div>

            <div className="relative">
              <AlignLeft className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add Description"
                rows={2}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg dark-glass-input resize-none"
              />
            </div>
          </div>

          {/* Category, Recurrence & Reminder Controls */}
          <div className="grid grid-cols-3 gap-3">
            {!isBirthday && !isAnniversary && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg dark-glass-input cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={isBirthday || isAnniversary ? 'col-span-2' : ''}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg dark-glass-input cursor-pointer"
              >
                {recurrences.map((rec) => (
                  <option key={rec.value} value={rec.value}>{rec.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Bell className="w-3 h-3" /> Reminder
              </label>
              <select
                value={reminder}
                onChange={(e) => setReminder(parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg dark-glass-input cursor-pointer"
              >
                {reminders.map((rem) => (
                  <option key={rem.value} value={rem.value}>{rem.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo Memory Attachment */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Event Memory Photo
            </label>
            
            {photoUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video max-h-40 bg-black/20">
                <img 
                  src={photoUrl} 
                  alt="Memory preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center p-4 border border-dashed border-white/10 rounded-xl hover:border-accent cursor-pointer bg-white/2 transition-colors text-xs font-semibold text-slate-400"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading memory image...' : 'Attach Memory Photo'}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            {event && onDelete ? (
              <button
                type="button"
                onClick={() => { onDelete(event.id); onClose(); }}
                className="px-3 py-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Event
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 hover:bg-white/10 rounded-xl transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl transition-colors text-xs font-semibold shadow-md shadow-accent-glow cursor-pointer"
              >
                Save Event
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
