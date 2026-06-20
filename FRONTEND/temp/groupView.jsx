/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Calendar,
  Users,
  Folder,
  Plus,
  ChevronRight,
  Clock,
  Video,
  X,
  LogOut,
  Edit,
  Trash2,
  Moon,
  Sun,
  CheckCircle2,
  Filter,
  Zap,
  Layout,
  AlertCircle,
  Lock,
  Settings,
  Activity,
  ArrowRight,
  Circle,
  MoreVertical,
  ShieldAlert,
  Link2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { groupService, taskSERVICES } from "../src/services/api.js";

const GroupsView = () => {
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null); // stores taskId
  const [showSettings, setShowSettings] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [success, setSuccess] = useState("");
  const [scheduledTasks, setScheduledTasks] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // Dependency picker state
  const [selectedDeps, setSelectedDeps] = useState([]);
  const [depSearchQuery, setDepSearchQuery] = useState('');
  const availableDeps = tasks
    .filter(t => !selectedDeps.includes(t._id))
    .filter(t => t.name.toLowerCase().includes(depSearchQuery.toLowerCase()));
  
  // Scheduling Settings
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");

  const navigate = useNavigate();

  useEffect(() => {
    const handleExpiry = () => setShowExpiryModal(true);
    window.addEventListener('session-expired', handleExpiry);
    return () => window.removeEventListener('session-expired', handleExpiry);
  }, []);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      description: "",
      priority: "Medium",
      estimated_duration: 30,
      deadline: "",
    }
  });

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    if (newMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskSERVICES.getALLTASKS(id);
      setTasks(response.tasks || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTasks();
  }, [id]);

  const timeToMinutes = (timeStr) => {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
  };

  const handleSchedule = async () => {
    setScheduling(true);
    setScheduledTasks(null);
    
    const startMins = timeToMinutes(workStart);
    const endMins = timeToMinutes(workEnd);
    const totalMins = endMins - startMins;

    try {
      const result = await groupService.scheduleTasks(id, {
        startTime: startMins,
        endTime: endMins,
        totalHours: totalMins > 0 ? totalMins : 1440
      });

      if (result && Array.isArray(result) && result.length > 0) {
        const adjustedResults = result.map(st => ({
          ...st,
          startTime: st.startTime + startMins,
          endTime: st.endTime + startMins
        }));
        setScheduledTasks(adjustedResults);
        setSuccess("AI Trajectory Optimized.");
      } else {
        setSuccess("AI could not find a full schedule.");
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Scheduling failed:", err);
    } finally {
      setScheduling(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours < 10 ? '0' : ''}${hours}:${mins < 10 ? '0' : ''}${mins}`;
  };

  /** BFS cycle detection — used when editing tasks with existing deps */
  const wouldCreateCycle = (taskId, newDepId) => {
    const visited = new Set();
    const queue = [newDepId];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === taskId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const t = tasks.find(x => x._id === current);
      if (t?.dependency) {
        for (const dep of t.dependency) {
          queue.push(typeof dep === 'object' ? dep._id : dep);
        }
      }
    }
    return false;
  };

  const addDepToSelection = (depId) => {
    setSelectedDeps(prev => [...prev, depId]);
    setDepSearchQuery('');
  };

  const removeDepFromSelection = (depId) => {
    setSelectedDeps(prev => prev.filter(id => id !== depId));
  };

  const onSubmit = async (data) => {
    try {
      await taskSERVICES.createTASK(id, {
        ...data,
        name: data.name.trim(),
        dependency: selectedDeps
      });
      setShowForm(false);
      reset();
      setSelectedDeps([]);
      setDepSearchQuery('');
      fetchTasks();
      setSuccess("Objective Successfully Created.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  const deleteTask = async () => {
    const taskId = showDeleteModal;
    if (!taskId) return;
    try {
      await taskSERVICES.deleteTASK(id, taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setSuccess("Task Successfully Deleted.");
      setShowDeleteModal(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const toggleStatus = async (taskId, currentStatus) => {
    try {
      await taskSERVICES.updateTASK(id, taskId, { completed: !currentStatus });
      fetchTasks();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 selection:bg-indigo-500 selection:text-white ${isDarkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-[1600px] mx-auto px-10 py-16 space-y-16 w-[95%]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-8 animate-in slide-in-from-left-8 duration-700">
            <button
              onClick={() => navigate(-1)}
              className={`p-5 rounded-[2rem] transition-all border ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500/30" : "bg-white border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm"
              }`}
            >
              <ChevronRight className="w-8 h-8 transform rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Circle className="w-2.5 h-2.5 fill-indigo-600 text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Workspace Alpha</span>
              </div>
              <h1 className={`text-5xl font-black tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>Mission Tasks</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 animate-in slide-in-from-right-8 duration-700">
            <div className="relative group">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-5 rounded-[2rem] transition-all border ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-white border-slate-100 text-slate-400"
                }`}
              >
                <Settings className={`w-7 h-7 ${showSettings ? "rotate-90" : ""} transition-transform duration-500`} />
              </button>
              
              {showSettings && (
                <div className={`absolute top-full mt-6 right-0 w-80 p-8 rounded-[3rem] border shadow-2xl z-50 animate-in zoom-in-95 duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-white"}`}>
                   <h4 className="text-[10px] font-black uppercase tracking-widest mb-8 text-indigo-500">Scheduler Core</h4>
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Window Start</label>
                         <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className={`w-full p-5 rounded-2xl border font-black text-lg ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Window End</label>
                         <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className={`w-full p-5 rounded-2xl border font-black text-lg ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} />
                      </div>
                      <button onClick={() => setShowSettings(false)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Save Matrix</button>
                   </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSchedule}
              disabled={scheduling}
              className={`px-8 py-5 rounded-[2rem] flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-xl ${
                scheduling ? "bg-slate-800 text-slate-500" : (isDarkMode ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white")
              }`}
            >
              {scheduling ? <Activity className="w-6 h-6 animate-spin" /> : <><Zap className="w-6 h-6 fill-current" /> AI Optimize</>}
            </button>

            <button onClick={toggleTheme} className={`p-5 rounded-[2rem] border transition-all ${isDarkMode ? "bg-slate-900 border-slate-800 text-yellow-400" : "bg-white border-slate-100 text-slate-400"}`}>
              {isDarkMode ? <Sun className="w-7 h-7" /> : <Moon className="w-7 h-7" />}
            </button>

            <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[2rem] flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-[0_15px_40px_-10px_rgba(79,70,229,0.4)] transition-all active:scale-95">
              <Plus className="w-6 h-6 stroke-[3px]" /> Add Task
            </button>
          </div>
        </div>

        {/* AI optimized Display */}
        {scheduledTasks && (
          <div className={`p-10 rounded-[4rem] border animate-in zoom-in-95 duration-500 relative overflow-hidden ${isDarkMode ? "bg-indigo-600/5 border-indigo-500/20 shadow-[0_0_80px_-20px_rgba(79,70,229,0.15)]" : "bg-white border-indigo-50 shadow-xl"}`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] -mr-48 -mt-48"></div>
            <div className="flex justify-between items-center mb-12 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl"><Layout className="w-8 h-8 text-white" /></div>
                <div>
                  <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Optimized Timeline</h2>
                  <p className="text-[10px] font-black uppercase text-indigo-500 mt-2 tracking-widest">Window Active: {workStart} - {workEnd}</p>
                </div>
              </div>
              <button onClick={() => setScheduledTasks(null)} className="p-4 hover:bg-black/5 rounded-2xl transition-all"><X className="w-8 h-8 text-slate-400" /></button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x relative z-10">
              {scheduledTasks.map((st, idx) => (
                <div key={idx} className={`min-w-[340px] p-8 rounded-[3rem] border transition-all snap-center ${isDarkMode ? "bg-slate-900/80 border-slate-800 hover:border-indigo-500/30" : "bg-white border-white shadow-xl"}`}>
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-4 py-1.5 bg-indigo-600/10 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest">Phase {idx + 1}</span>
                    <span className="text-[10px] font-mono text-slate-500">{st.duration} mins</span>
                  </div>
                  <h4 className={`text-xl font-black mb-8 line-clamp-2 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{st.text}</h4>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Start</p>
                        <p className={`text-lg font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>{formatTime(st.startTime)}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-700/30" />
                    <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">End</p>
                        <p className={`text-lg font-black ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>{formatTime(st.endTime)}</p>
                    </div>
                  </div>
                  {st.links && st.links.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">{st.links.length} Prerequisite(s)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {loading ? (
            <div className="col-span-full py-40 text-center"><div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : tasks.map((task) => (
              <div 
                key={task._id} 
                className={`p-10 rounded-[3.5rem] border transition-all duration-500 flex flex-col h-[22rem] group relative overflow-hidden ${
                    isDarkMode 
                        ? "bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-indigo-500/50 hover:shadow-[0_0_50px_-12px_rgba(79,70,229,0.2)]" 
                        : "bg-white border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.1)] hover:border-indigo-100"
                }`}
              >
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                    task.priority === "Crucial" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                  }`}>
                    {task.priority}
                  </div>
                  <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowDeleteModal(task._id); }} 
                        className={`p-3 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                            isDarkMode ? "bg-slate-950/50 text-slate-500 hover:bg-red-500/20 hover:text-red-400" : "bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        }`}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                      <button className={`p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}>
                        <MoreVertical className="w-5 h-5" />
                      </button>
                  </div>
                </div>

                <div className="flex-1 relative z-10">
                    <h3 className={`text-2xl font-black mb-4 leading-tight transition-all duration-300 group-hover:text-indigo-500 ${task.completed ? "line-through opacity-30" : (isDarkMode ? "text-white" : "text-slate-900")}`}>
                        {task.name}
                    </h3>
                    <p className={`text-xs line-clamp-3 leading-relaxed transition-opacity duration-300 group-hover:opacity-100 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                        {task.description || "No tactical details provided for this objective."}
                    </p>
                    {task.dependency && task.dependency.length > 0 && (
                      <div className="flex items-center gap-2 mt-4">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Blocked by {task.dependency.length} task(s)</span>
                      </div>
                    )}
                </div>

                <div className={`mt-auto pt-8 border-t relative z-10 flex justify-between items-center ${isDarkMode ? "border-slate-800" : "border-slate-50"}`}>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{task.estimated_duration}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-tighter">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{task.deadline ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "No Deadline"}</span>
                  </div>
                </div>
              </div>
          ))}
        </div>

        {/* Custom Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-300">
            <div className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-white"} border p-16 rounded-[4rem] w-full max-w-lg shadow-2xl text-center relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
              <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-10"><ShieldAlert className="w-12 h-12 text-red-600" /></div>
              <h2 className={`text-4xl font-black mb-6 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>Purge Objective?</h2>
              <p className="text-slate-500 mb-12 text-lg leading-relaxed">This will permanently remove this tactical objective from the workspace matrix. This action is irreversible.</p>
              <div className="flex gap-6">
                <button onClick={() => setShowDeleteModal(null)} className={`flex-1 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all ${isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>Abort</button>
                <button onClick={deleteTask} className="flex-1 py-6 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-600/20 transition-all active:scale-95">Purge</button>
              </div>
            </div>
          </div>
        )}

        {/* Expiry Modal */}
        {showExpiryModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-500">
            <div className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-white"} border p-16 rounded-[4rem] w-full max-w-lg shadow-2xl text-center relative overflow-hidden`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-500"></div>
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-10"><Lock className="w-12 h-12 text-red-500" /></div>
              <h2 className={`text-4xl font-black mb-4 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>Session Revoked</h2>
              <button onClick={handleLogout} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95">Re-Authenticate</button>
            </div>
          </div>
        )}

        {/* AI Optimization Loading Modal */}
        {scheduling && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-500">
            <div className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-white"} border p-16 rounded-[4rem] w-full max-w-lg shadow-2xl text-center relative overflow-hidden`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-indigo-500 animate-pulse"></div>
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-10">
                <Zap className="w-12 h-12 text-indigo-500 animate-bounce" />
              </div>
              <h2 className={`text-4xl font-black mb-4 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>Waking AI Engine</h2>
              <p className="text-slate-500 mb-8 text-lg leading-relaxed">
                Please wait 2 to 5 minutes while we allocate resources. The optimization engine is spinning up from sleep mode.
              </p>
              <div className="w-full flex justify-center">
                <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <div className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-white"} border p-12 rounded-[4rem] w-full max-w-3xl shadow-2xl overflow-hidden`}>
              <div className="flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter">New Objective</h2>
                    <p className="text-slate-500 mt-2 text-sm">Define the parameters for your next strategic goal.</p>
                </div>
                <button onClick={() => setShowForm(false)} className={`p-4 rounded-2xl transition-all ${isDarkMode ? "hover:bg-white/5 text-slate-500" : "hover:bg-black/5 text-slate-400"}`}><X className="w-8 h-8" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <input {...register("name", { required: true })} className={`w-full p-6 rounded-[2.5rem] border font-black text-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} placeholder="Objective Title" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Priority Protocol</label>
                     <select {...register("priority")} className={`w-full p-6 rounded-[2rem] border font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`}>
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Standard Priority</option>
                        <option value="High">High Priority</option>
                        <option value="Crucial">Crucial (Alert)</option>
                     </select>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Deadline Horizon</label>
                     <input type="datetime-local" {...register("deadline")} className={`w-full p-6 rounded-[2rem] border font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Estimated Span (min)</label>
                     <input type="number" {...register("estimated_duration")} className={`w-full p-6 rounded-[2rem] border font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} placeholder="30" />
                  </div>
                  <div className="flex items-end pb-1">
                      <p className="text-[10px] font-bold text-slate-500 leading-tight italic">Precision scheduling requires accurate time estimates.</p>
                  </div>
                </div>
                {/* Dependency Chain Picker */}
                <div className={`p-6 rounded-[2rem] border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-4 flex items-center gap-2"><Link2 className="w-4 h-4" /> Dependency Chain (Prerequisites)</label>
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[2.5rem]">
                    {selectedDeps.length === 0 && <span className="text-xs text-slate-500 italic mt-1">No prerequisites. This task can start immediately.</span>}
                    {selectedDeps.map(depId => {
                      const depTask = tasks.find(t => t._id === depId);
                      return (
                        <span key={depId} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-xl text-xs font-bold">
                          {depTask?.name}
                          <button type="button" onClick={() => removeDepFromSelection(depId)} className="hover:text-indigo-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <input type="text" placeholder="Search tasks to add as dependency..." value={depSearchQuery} onChange={(e) => setDepSearchQuery(e.target.value)} className={`w-full p-4 rounded-xl border font-bold text-xs outline-none focus:border-indigo-500 transition-all ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`} />
                    {depSearchQuery && (
                      <div className={`absolute left-0 right-0 top-full mt-2 rounded-xl border shadow-xl z-50 max-h-48 overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        {availableDeps.length === 0 ? (
                          <div className="p-4 text-xs text-slate-500 text-center font-bold">No matching tasks found.</div>
                        ) : availableDeps.map(t => (
                          <button type="button" key={t._id} onClick={() => addDepToSelection(t._id)} className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors flex items-center justify-between border-b last:border-b-0 ${isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-700'}`}>
                            <span>{t.name}</span>
                            <span className={`text-[9px] uppercase px-2 py-0.5 rounded-md ${t.priority === 'Crucial' ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-500'}`}>{t.priority}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-6 pt-6">
                  <button type="button" onClick={() => setShowForm(false)} className={`flex-1 py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all ${isDarkMode ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-500 hover:bg-red-100"}`}>Decline</button>
                  <button type="submit" className="flex-[2] py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-[0.98]">Authorize Objective</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-12 duration-500">
          <div className={`px-10 py-5 rounded-[2rem] shadow-2xl border backdrop-blur-xl flex items-center gap-5 font-black text-xs uppercase tracking-widest ${
              isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white border-green-100 text-green-600"
          }`}>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            {success}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsView;
