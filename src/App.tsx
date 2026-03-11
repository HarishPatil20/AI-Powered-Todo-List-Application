import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Search,
  User,
  Zap,
  Briefcase,
  Heart,
  Send,
  Loader2,
  Menu,
  X,
  Edit2,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Task {
  id?: string;
  _id?: string;
  title: string;
  category: 'Work' | 'Personal' | 'Urgent';
  completed: boolean;
  time?: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

// --- Components ---

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden",
    className
  )}>
    {children}
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left",
      active ? "bg-white/20 text-white shadow-lg" : "text-white/60 hover:bg-white/10 hover:text-white"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

// Custom label for pie chart
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.7)" textAnchor="middle" dominantBaseline="central" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [category, setCategory] = useState<'Work' | 'Personal' | 'Urgent'>('Personal');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'ai'>('dashboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string, email: string, name?: string } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchTasks();
      fetchChatHistory();
    }
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    const checkNotifications = () => {
      if (!isLoggedIn || tasks.length === 0) return;
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      tasks.forEach(task => {
        if (!task.completed && task.time === currentTime) {
          if (Notification.permission === "granted") {
            new Notification("Aura Task Reminder", {
              body: `Time for: ${task.title}`,
              icon: "/favicon.ico"
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
          }
        }
      });
    };

    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [tasks, isLoggedIn]);

  useEffect(() => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'ai') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

const fetchTasks = async () => {
  if (!currentUser) return;

  const res = await fetch(`/api/tasks?userId=${currentUser.id}`);
  const data = await res.json();

  const formattedTasks = (data || []).map((t: any) => ({
    id: t.id || t._id,
    title: t.title,
    category: t.category || "Personal",
    completed: !!t.completed,
    time: t.time
  }));

  setTasks(formattedTasks);
};

const fetchChatHistory = async () => {
  if (!currentUser) return;

  const res = await fetch(`/api/chat?userId=${currentUser.id}`);
  const data = await res.json();

  setMessages((data || []).map((m: any) => ({
    role: m.role,
    content: m.content
  })));
};

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !currentUser) return;
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: newTask, 
        category, 
        userId: currentUser.id,
        time: newTaskTime 
      })
    });
   const task = await res.json();

setTasks([
  {
    ...task,
    id: task._id || task.id
  },
  ...tasks
]);
    setNewTask('');
    setNewTaskTime('');
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed })
    });
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !completed } : t));
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    await fetch(`/api/tasks/${editingTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: editingTask.title, 
        category: editingTask.category,
        time: editingTask.time
      })
    });
    setTasks(tasks.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);
  };

  const PREDEFINED_QUESTIONS = [
    "How can I optimize my morning routine?",
    "Give me a 15-minute deep work schedule.",
    "Suggest a healthy evening wind-down routine.",
    "How do I balance work and personal life?"
  ];

  const handleSendMessage = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const messageContent = customInput || input;
    if (!messageContent.trim() || isTyping || !currentUser) return;

    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    if (!customInput) setInput('');
    setIsTyping(true);

    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userMessage, userId: currentUser.id })
    });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `You are a productivity coach and routine architect. Help the user optimize their schedule. User says: ${messageContent}` }] }
        ],
        config: {
          systemInstruction: "You are Aura, a minimalist and efficient routine architect. Your goal is to provide structured, healthy routines factoring in commute, deep work, and breaks. Keep responses concise and actionable."
        }
      });

      const response = await model;
      const aiMessage: Message = { role: 'model', content: response.text || "I'm sorry, I couldn't process that." };
      
      setMessages(prev => [...prev, aiMessage]);
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...aiMessage, userId: currentUser.id })
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Error connecting to AI. Please check your API key." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: authEmail, 
          password: authPassword,
          ...(authMode === 'signup' && { name: authName })
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
      } else {
        setAuthError(data.error || "Authentication failed");
        setTimeout(() => setAuthError(null), 3000);
      }
    } catch (error) {
      setAuthError("Network error. Please try again.");
      setTimeout(() => setAuthError(null), 3000);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white/20 flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <GlassCard className="p-8">
            <div className="flex flex-col items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                <Zap size={32} className="text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Aura</h1>
                <p className="text-white/40 text-sm">Your AI Routine Architect</p>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <AnimatePresence>
                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-rose-500/20 border border-rose-500/50 text-rose-500 px-4 py-3 rounded-xl text-sm font-medium text-center"
                  >
                    {authError}
                  </motion.div>
                )}
              </AnimatePresence>

              {authMode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 px-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 px-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 px-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-all shadow-xl shadow-white/10 mt-4"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  const pieData = [
    { name: 'Personal', value: tasks.filter(t => t.category === 'Personal').length },
    { name: 'Work', value: tasks.filter(t => t.category === 'Work').length },
    { name: 'Urgent', value: tasks.filter(t => t.category === 'Urgent').length },
  ];
  const PIE_COLORS = ['#10b981', '#6366f1', '#f43f5e'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white/20">
      {/* Dropdown fix: inject global styles for select options */}
      <style>{`
        select option {
          background-color: #1a1a2e !important;
          color: #ffffff !important;
        }
        select {
          color-scheme: dark;
        }
      `}</style>

      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside 
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-72 bg-white/5 backdrop-blur-2xl border-r border-white/10 p-6 flex flex-col gap-8 z-50"
            >
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Zap size={24} className="text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Aura</h1>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold px-4 mb-2">Main Menu</p>
                <SidebarItem icon={BarChart3} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <SidebarItem icon={LayoutDashboard} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
                <SidebarItem icon={MessageSquare} label="AI Architect" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold px-4 mb-2">Categories</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-white/60">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Personal
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-white/60">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    Work
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-white/60">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    Urgent
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-4">
                <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{currentUser?.name || currentUser?.email}</p>
                    <p className="text-[10px] text-white/40">{currentUser?.name ? currentUser.email : 'Free Plan'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="text-xs text-white/40 hover:text-rose-500 transition-colors text-center py-2"
                >
                  Sign Out
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Header */}
          <header className="flex-shrink-0 bg-[#0a0a0a]/50 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64"
                />
              </div>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Settings size={20} className="text-white/60" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto h-full">
              {activeTab === 'dashboard' ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <GlassCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Completed</p>
                      <h3 className="text-2xl font-bold">{tasks.filter(t => t.completed).length}</h3>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-500">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Pending</p>
                      <h3 className="text-2xl font-bold">{tasks.filter(t => !t.completed).length}</h3>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Total Tasks</p>
                      <h3 className="text-2xl font-bold">{tasks.length}</h3>
                    </div>
                  </GlassCard>
                </div>

                {/* FIX: Charts with proper fixed heights and layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart Card */}
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold mb-4">Category Distribution</h3>
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="45%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            labelLine={false}
                            label={renderCustomLabel}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1a1a2e', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              borderRadius: '12px',
                              color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Legend 
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => (
                              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  {/* Bar Chart Card */}
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold mb-4">Task Status</h3>
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Completed', count: tasks.filter(t => t.completed).length },
                            { name: 'Pending', count: tasks.filter(t => !t.completed).length },
                          ]}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ 
                              backgroundColor: '#1a1a2e', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              borderRadius: '12px',
                              color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            <Cell fill="#10b981" />
                            <Cell fill="#6366f1" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>
              </div>
            ) : activeTab === 'tasks' ? (
              <div className="space-y-8">
                {/* Task Input */}
                <GlassCard className="p-1">
                  <form onSubmit={addTask} className="flex flex-col sm:flex-row items-center gap-2 p-2">
                    <input 
                      type="text" 
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="What needs to be done?"
                      className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-lg placeholder:text-white/20 w-full"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input 
                        type="time"
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                        className="bg-white/10 border-none rounded-xl px-3 py-2 text-sm focus:ring-0 cursor-pointer text-white/60"
                      />
                      {/* FIX: Dropdown with dark background to prevent white flash */}
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="bg-[#1a1a2e] text-white border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-0 cursor-pointer flex-1 sm:flex-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="Personal" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Personal</option>
                        <option value="Work" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Work</option>
                        <option value="Urgent" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Urgent</option>
                      </select>
                      <button 
                        type="submit"
                        className="bg-white text-black p-3 rounded-xl hover:bg-white/90 transition-colors shadow-lg"
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                  </form>
                </GlassCard>

                {/* Task Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                   {tasks.map((task) => (
  <motion.div
    key={(task.id || task._id) + ""}
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
  >
                        <GlassCard className={cn(
                          "p-4 group transition-all duration-300",
                          task.completed && "opacity-60"
                        )}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <button 
                                onClick={() => task.id && toggleTask(task.id, task.completed)}
                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                              </button>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className={cn(
                                  "text-lg font-medium transition-all truncate",
                                  task.completed && "line-through text-white/40"
                                )}>
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className={cn(
                                    "text-[10px] uppercase tracking-widest font-bold",
                                    task.category === 'Urgent' ? "text-rose-500" : 
                                    task.category === 'Work' ? "text-indigo-500" : "text-emerald-500"
                                  )}>
                                    {task.category}
                                  </span>
                                  {task.time && (
                                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                                      <Clock size={10} />
                                      {task.time}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setEditingTask(task)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-indigo-400 transition-all"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => task.id && deleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-rose-500 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {tasks.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap size={40} className="text-white/20" />
                    </div>
                    <h3 className="text-xl font-medium text-white/40">No tasks yet</h3>
                    <p className="text-white/20">Add one above to get started</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-hide">
                  <div className="flex flex-col gap-4 min-h-full">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-[80%]">
                      <p className="text-sm">Hello! I'm Aura, your AI Routine Architect. How can I help you optimize your day?</p>
                    </div>

                    {messages.length === 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {PREDEFINED_QUESTIONS.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(undefined, q)}
                            className="text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm text-white/60 hover:text-white group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{q}</span>
                              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {messages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex flex-col gap-2",
                          msg.role === 'user' ? "items-end" : "items-start"
                        )}
                      >
                        <div className={cn(
                          "rounded-2xl p-4 max-w-[85%] text-sm",
                          msg.role === 'user' 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                            : "bg-white/5 border border-white/10 text-white/90"
                        )}>
                          <div className="markdown-body">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-center gap-2 text-white/40 text-xs animate-pulse p-2">
                        <Loader2 size={14} className="animate-spin" />
                        Aura is thinking...
                      </div>
                    )}
                    <div ref={chatEndRef} className="h-4 w-full flex-shrink-0" />
                  </div>
                </div>

                <div className="mt-4 pb-4">
                  <form onSubmit={handleSendMessage} className="relative">
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your routine..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-md"
                    />
                    <button 
                      type="submit"
                      disabled={isTyping}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black p-2.5 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTask(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md"
            >
              <GlassCard className="p-8">
                <h3 className="text-xl font-bold mb-6">Edit Task</h3>
                <form onSubmit={updateTask} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Task Title</label>
                    <input 
                      type="text" 
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40">Category</label>
                      {/* FIX: Edit modal dropdown also dark */}
                      <select 
                        value={editingTask.category}
                        onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as any })}
                        className="w-full bg-[#1a1a2e] text-white border border-white/10 rounded-xl px-4 py-3 focus:ring-0 cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="Personal" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Personal</option>
                        <option value="Work" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Work</option>
                        <option value="Urgent" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Urgent</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40">Time</label>
                      <input 
                        type="time" 
                        value={editingTask.time || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, time: e.target.value })}
                        className="w-full bg-white/10 border-none rounded-xl px-4 py-3 focus:ring-0 cursor-pointer text-white/60"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors shadow-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}