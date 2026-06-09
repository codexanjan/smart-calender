import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, CheckSquare, Image, Bell, X } from 'lucide-react';

interface IntroBannerProps {
  onDismiss: () => void;
}

export const IntroBanner: React.FC<IntroBannerProps> = ({ onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, margin: 0, padding: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full p-5 glass-card border border-white/10 text-slate-800 dark:text-white flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
    >
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent animate-bounce" />
          <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-indigo-200">
            Welcome to your Productivity Workspace!
          </h3>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
          This workspace is designed to keep your personal schedule organized, track task achievements, and store event memories. Here's how to get started:
        </p>

        {/* Short Guided Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-accent/10 text-accent shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Double-click calendar dates to schedule
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-accent/10 text-accent shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Add goals and track circular progress
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-accent/10 text-accent shrink-0">
              <Image className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Upload custom background wallpapers
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-accent/10 text-accent shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Set alarms for native notifications
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent-glow transition-all shrink-0 self-stretch md:self-auto justify-center"
      >
        <X className="w-3.5 h-3.5" /> Dismiss Tour
      </button>
    </motion.div>
  );
};
