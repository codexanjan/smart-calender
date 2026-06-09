import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Bell, Palette, Settings, Eye, Sun, Moon } from 'lucide-react';
import type { UserPreferences } from '../types';
import { uploadFile } from '../firebase/db';

interface SettingsPanelProps {
  userId: string;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  isOpen: boolean;
  onClose: () => void;
  onTestNotification: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  userId,
  preferences,
  onUpdatePreferences,
  isOpen,
  onClose,
  onTestNotification,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleThemeToggle = () => {
    const newTheme = preferences.theme === 'light' ? 'dark' : 'light';
    onUpdatePreferences({ ...preferences, theme: newTheme });
  };

  const handleAccentChange = (accent: UserPreferences['accentColor']) => {
    onUpdatePreferences({ ...preferences, accentColor: accent });
  };

  const handleRangeChange = (key: 'bgBlur' | 'bgOpacity', value: number) => {
    onUpdatePreferences({ ...preferences, [key]: value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile(userId, 'backgrounds', file);
      onUpdatePreferences({ ...preferences, bgPhotoUrl: url });
    } catch (error) {
      console.error('Failed to upload background photo:', error);
      alert('Failed to upload background photo. Please try a smaller file.');
    }
  };

  const handleRemoveBackground = () => {
    onUpdatePreferences({ ...preferences, bgPhotoUrl: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const accents: { name: string; value: UserPreferences['accentColor']; colorClass: string }[] = [
    { name: 'Indigo', value: 'indigo', colorClass: 'bg-indigo-500' },
    { name: 'Emerald', value: 'emerald', colorClass: 'bg-emerald-500' },
    { name: 'Rose', value: 'rose', colorClass: 'bg-rose-500' },
    { name: 'Amber', value: 'amber', colorClass: 'bg-amber-500' },
    { name: 'Sky', value: 'sky', colorClass: 'bg-sky-500' },
    { name: 'Teal', value: 'teal', colorClass: 'bg-teal-500' },
    { name: 'Violet', value: 'violet', colorClass: 'bg-violet-500' },
    { name: 'Orange', value: 'orange', colorClass: 'bg-orange-500' },
  ];

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      {/* Slide-over panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm h-full dark-glass-card border-l border-white/10 p-6 overflow-y-auto flex flex-col text-white rounded-none"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold">Preferences</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 flex-1">
          {/* Theme Mode Option */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              Interface Theme
            </h3>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-sm font-medium text-slate-200">
                {preferences.theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </span>
              <button
                onClick={handleThemeToggle}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 shadow-sm text-accent cursor-pointer transition-colors"
              >
                {preferences.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Accent Color Palette */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              Accent Theme
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {accents.map((accent) => (
                <button
                  key={accent.value}
                  onClick={() => handleAccentChange(accent.value)}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    preferences.accentColor === accent.value
                      ? 'border-accent bg-accent/15'
                      : 'border-white/5 hover:border-white/20 bg-slate-900/50'
                  }`}
                  title={accent.name}
                >
                  <span className={`w-6 h-6 rounded-full ${accent.colorClass} shadow-sm`} />
                  <span className="text-[10px] font-medium mt-1 text-slate-300">
                    {accent.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Customizer */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Dashboard Wallpaper
            </h3>
            <div className="space-y-4">
              {preferences.bgPhotoUrl ? (
                <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/20">
                  <img 
                    src={preferences.bgPhotoUrl} 
                    alt="Background preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={handleRemoveBackground}
                      className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 animate-none"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-accent cursor-pointer bg-white/2 transition-colors"
                >
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-300">
                    Upload Wallpaper Photo
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Supports JPG, PNG, WEBP
                  </span>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {preferences.bgPhotoUrl && (
                <div className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Eye className="w-3 h-3 text-slate-400" /> Glass opacity
                      </span>
                      <span className="text-slate-300">{preferences.bgOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={preferences.bgOpacity}
                      onChange={(e) => handleRangeChange('bgOpacity', parseInt(e.target.value))}
                      className="w-full accent-accent h-1.5 rounded-lg appearance-none bg-slate-700 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>Background blur</span>
                      <span>{preferences.bgBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={preferences.bgBlur}
                      onChange={(e) => handleRangeChange('bgBlur', parseInt(e.target.value))}
                      className="w-full accent-accent h-1.5 rounded-lg appearance-none bg-slate-700 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Reminders Option */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Desktop Reminders
            </h3>
            <button
              onClick={onTestNotification}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-sm transition-all cursor-pointer text-white"
            >
              <Bell className="w-4 h-4 text-accent" />
              Trigger Test Notification
            </button>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Requires permission. Click to prompt your browser.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 mt-6 text-center text-xs text-slate-500">
          Smart Calendar v1.0.0
        </div>
      </motion.div>
    </>
  );
};
