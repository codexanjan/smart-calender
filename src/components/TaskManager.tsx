import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, AlertTriangle, CheckCircle, Circle, Search, Filter } from 'lucide-react';
import type { Task, TaskPriority } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'userId'>) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  // Task Form State
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Search/Filter State
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      priority,
      category,
      dueDate: dueDate || undefined,
      isCompleted: false,
    });

    setTitle('');
    setDueDate('');
    setPriority('Medium');
    setShowForm(false);
  };

  const categories = ['Personal', 'Work', 'Study', 'Health', 'Other'];

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'All' || task.category === filterCategory;
    const matchesTab = activeTab === 'completed' ? task.isCompleted : !task.isCompleted;

    return matchesSearch && matchesPriority && matchesCategory && matchesTab;
  });

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'High': return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
      case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      case 'Low': return 'text-sky-400 bg-sky-500/10 border-sky-500/25';
    }
  };

  const getDueDateLabel = (dateStr?: string) => {
    if (!dateStr) return null;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dateStr);
    due.setHours(0,0,0,0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: `Overdue by ${Math.abs(diffDays)}d`, class: 'text-rose-400 bg-rose-500/10' };
    } else if (diffDays === 0) {
      return { label: 'Due Today', class: 'text-amber-400 bg-amber-500/10 font-bold' };
    } else if (diffDays === 1) {
      return { label: 'Due Tomorrow', class: 'text-slate-300 bg-slate-900' };
    } else {
      return { label: `Due in ${diffDays}d`, class: 'text-slate-400 bg-slate-900' };
    }
  };

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2 text-white">
          <CheckCircle className="w-5 h-5 text-accent" />
          Task Board
        </h3>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition-all shadow-sm shadow-accent-glow flex items-center gap-1 text-xs font-semibold cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Task Creation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mb-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 overflow-hidden"
          >
            <div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3.5 py-1.5 text-xs rounded-lg dark-glass-input placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-2 py-1 text-[10px] rounded-lg dark-glass-input bg-slate-900 cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2 py-1 text-[10px] rounded-lg dark-glass-input bg-slate-900 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2 py-1 text-[10px] rounded-lg dark-glass-input bg-slate-900 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer border-none"
              >
                Save Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filters Area */}
      <div className="space-y-2.5 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg dark-glass-input placeholder:text-slate-500"
          />
        </div>

        {/* Category & Priority Filters */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-2 pr-4 py-1.5 text-xs rounded-lg dark-glass-input bg-slate-900 cursor-pointer appearance-none"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Filter className="absolute right-2 top-3 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>

          <div className="flex-1 relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full pl-2 pr-4 py-1.5 text-xs rounded-lg dark-glass-input bg-slate-900 cursor-pointer appearance-none"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <AlertTriangle className="absolute right-2 top-3 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-3 text-xs">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-all cursor-pointer bg-transparent border-none ${
            activeTab === 'active'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Active ({tasks.filter(t => !t.isCompleted).length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-all cursor-pointer bg-transparent border-none ${
            activeTab === 'completed'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Completed ({tasks.filter(t => t.isCompleted).length})
        </button>
      </div>

      {/* Task List container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[350px]">
        <AnimatePresence initial={false}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const dueLabel = getDueDateLabel(task.dueDate);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="flex items-start justify-between p-3 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors gap-2 group"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 shrink-0 text-slate-500 hover:text-accent cursor-pointer transition-colors bg-transparent border-none p-0 flex items-center justify-center rounded-none shadow-none"
                    >
                      {task.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-accent" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}>
                        {task.title}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        
                        {task.category && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                            {task.category}
                          </span>
                        )}

                        {dueLabel && (
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 ${dueLabel.class}`}>
                            <Calendar className="w-2.5 h-2.5" />
                            {dueLabel.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-all shrink-0 bg-transparent border-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
              <CheckCircle className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs font-semibold">No tasks found</p>
              <p className="text-[10px] opacity-75 mt-0.5">Add a task or adjust filters</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
