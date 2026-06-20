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
  Trash2,
  LogOut,
  Moon,
  Sun,
  Zap,
  Layout,
  AlertCircle,
  Lock,
  Settings,
  Mail,
  UserPlus,
  Share2,
  MoreVertical,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { groupService } from "../src/services/api.js";

const phase_ii_ui = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null); // stores workspaceId
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schedulingId, setSchedulingId] = useState(null);
  const [scheduledTasks, setScheduledTasks] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [currentUserEmail, setCurrentUserEmail] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email;
    } catch (e) { return null; }
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    const handleExpiry = () => setShowExpiryModal(true);
    window.addEventListener('session-expired', handleExpiry);
    return () => window.removeEventListener('session-expired', handleExpiry);
  }, []);

  const navigate = useNavigate();

  const { register, handleSubmit, control, reset, watch } = useForm({
    defaultValues: {
      name: "",
      description: "",
      workspaceType: "Personal",
      members: [{ email: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const workspaceType = watch("workspaceType");

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await groupService.getGroups();
      if (response.data) {
        setWorkspaces(response.data.map(ws => {
          const isShared = ws.members && ws.members.includes(currentUserEmail);
          return {
            ...ws,
            id: ws._id,
            isShared,
            memberCount: ws.members ? ws.members.length : 0,
            color: isShared ? "bg-amber-500" : (ws.workspaceType === "Personal" ? "bg-indigo-600" : ws.workspaceType === "Team" ? "bg-emerald-500" : "bg-purple-600"),
          };
        }));
      }
    } catch (err) {
      console.error("Error fetching workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  const timeToMinutes = (timeStr) => {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
  };

  const handleSchedule = async (e, groupId) => {
    e.stopPropagation();
    setSchedulingId(groupId);
    setScheduledTasks(null);
    const startMins = timeToMinutes(workStart);
    const endMins = timeToMinutes(workEnd);
    const totalMins = endMins - startMins;

    try {
      const result = await groupService.scheduleTasks(groupId, {
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
        setScheduledTasks({ groupId, tasks: adjustedResults });
        setSuccess("AI Optimization Complete!");
      } else {
        setError("AI could not find a valid schedule.");
        setTimeout(() => setError(null), 3000);
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Scheduling failed:", err);
    } finally {
      setSchedulingId(null);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours < 10 ? '0' : ''}${hours}:${mins < 10 ? '0' : ''}${mins}`;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const memberEmails = data.workspaceType === "Personal" ? [] : data.members.map(m => m.email).filter(Boolean);
      await groupService.createGroups(data.name.trim(), data.description.trim(), data.workspaceType, memberEmails);
      setSuccess("Workspace Ready for Deployment!");
      await fetchWorkspaces();
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccess("");
        reset();
      }, 1500);
    } catch (err) {
      console.error("Error creating workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkspace = async () => {
    const id = showDeleteModal;
    if (!id) return;
    try {
      await groupService.deleteGroup(id);
      setWorkspaces(prev => prev.filter(ws => ws.id !== id));
      setSuccess("Workspace Decommissioned Successfully.");
      setShowDeleteModal(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { console.error(err); }
  };

  const openGROUP = (id) => navigate(`/group/${id}`);

  const myWorkspaces = workspaces.filter(ws => !ws.isShared);
  const sharedWorkspaces = workspaces.filter(ws => ws.isShared);

  const WorkspaceCard = ({ ws }) => (
    <div 
        key={ws.id} 
        className={`p-8 rounded-[3rem] border transition-all duration-500 group h-[24rem] flex flex-col cursor-pointer overflow-hidden relative ${
            isDarkMode 
                ? "bg-slate-800/50 backdrop-blur-xl border-slate-700 hover:border-indigo-500/50 hover:shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)]" 
                : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]"
        }`} 
        onClick={() => openGROUP(ws.id)}
    >
      <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${ws.color}`}></div>

      <div className="mb-8 flex justify-between items-start relative z-10">
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${ws.color}`}>
            <Folder className="w-8 h-8" />
        </div>
        <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                    isDarkMode ? "bg-slate-900/50 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
                }`}>
                    {ws.workspaceType}
                </span>
                {!ws.isShared && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowDeleteModal(ws.id); }}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${
                            isDarkMode ? "bg-slate-900/50 text-slate-500 hover:bg-red-500/20 hover:text-red-400" : "bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        }`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
            {ws.isShared && (
                <span className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-tighter animate-pulse">
                    <Share2 className="w-3.5 h-3.5" /> Shared with me
                </span>
            )}
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <h3 className={`text-2xl font-black mb-4 truncate transition-colors duration-300 group-hover:text-indigo-500 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {ws.name}
        </h3>
        <p className={`text-sm line-clamp-3 leading-relaxed transition-opacity duration-300 group-hover:opacity-100 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            {ws.description || "No strategic summary provided for this high-performance environment."}
        </p>
      </div>

      <div className="mt-auto space-y-5 relative z-10">
        <div className={`flex justify-between items-center border-t pt-6 ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
             <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        isDarkMode ? "bg-slate-700 border-slate-800 text-slate-400" : "bg-slate-50 border-white text-slate-500"
                    }`}>
                        <Users className="w-3.5 h-3.5" />
                    </div>
                ))}
             </div>
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-tight">{ws.memberCount} Members</span>
          </div>
          
          <button 
             onClick={(e) => handleSchedule(e, ws.id)}
             className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest ${
                schedulingId === ws.id 
                    ? "bg-indigo-500 text-white animate-pulse" 
                    : (isDarkMode ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm")
             }`}
          >
             {schedulingId === ws.id ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
             Optimize
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-700 selection:bg-indigo-500 selection:text-white ${isDarkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-[1600px] mx-auto px-10 py-16 space-y-16 w-[95%]">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-8">
          <div className="animate-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-1 bg-indigo-600 rounded-full"></div>
                <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-500">Global Command</span>
            </div>
            <h1 className={`text-6xl font-black tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Orchestrator<span className="text-indigo-600">.</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 animate-in slide-in-from-right-8 duration-700">
            <div className="relative group">
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={`p-5 rounded-[2rem] border transition-all duration-300 ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30" : "bg-white border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm"
                }`}
              >
                <Settings className={`w-7 h-7 ${showSettings ? "rotate-90" : ""} transition-transform duration-500`} />
              </button>
              {showSettings && (
                <div className={`absolute top-full mt-6 right-0 w-80 p-8 rounded-[3rem] border shadow-2xl z-50 animate-in zoom-in-95 duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-white"}`}>
                   <div className="flex items-center gap-3 mb-8">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">Working Window</h4>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Day Start</label>
                         <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className={`w-full p-5 rounded-2xl border font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Day End</label>
                         <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className={`w-full p-5 rounded-2xl border font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} />
                      </div>
                      <button onClick={() => setShowSettings(false)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all active:scale-95">Update Engine</button>
                   </div>
                </div>
              )}
            </div>

            <button onClick={toggleTheme} className={`p-5 rounded-[2rem] border transition-all duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 text-yellow-400" : "bg-white border-slate-100 text-slate-400"}`}>
                {isDarkMode ? <Sun className="w-7 h-7" /> : <Moon className="w-7 h-7" />}
            </button>

            <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[2rem] flex items-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-[0_15px_40px_-10px_rgba(79,70,229,0.4)] active:scale-95">
              <Plus className="w-6 h-6 stroke-[3px]" />
              <span>Initialize Unit</span>
            </button>

            <button onClick={handleLogout} className={`p-5 rounded-[2rem] border transition-all duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/20" : "bg-white border-slate-100 text-slate-400 hover:text-red-600"}`}>
                <LogOut className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* AI Optimization Preview Overlay */}
        {scheduledTasks && (
          <div className={`p-10 rounded-[4rem] border animate-in zoom-in-95 duration-500 relative overflow-hidden ${isDarkMode ? "bg-indigo-600/5 border-indigo-500/20 shadow-[0_0_80px_-20px_rgba(79,70,229,0.15)]" : "bg-indigo-50/50 border-indigo-100 shadow-xl"}`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] -mr-48 -mt-48"></div>
            <div className="flex justify-between items-center mb-12 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl"><Layout className="w-8 h-8 text-white" /></div>
                <div>
                  <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Optimized Neural Path</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> {workStart} - {workEnd}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                        {scheduledTasks.tasks.length} Slots Assigned
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setScheduledTasks(null)} className={`p-4 rounded-2xl transition-all ${isDarkMode ? "hover:bg-white/5 text-slate-500" : "hover:bg-black/5 text-slate-400"}`}>
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x relative z-10">
              {scheduledTasks.tasks.map((st, idx) => (
                <div key={idx} className={`min-w-[340px] p-8 rounded-[3rem] border transition-all snap-center group/item ${isDarkMode ? "bg-slate-900/80 border-slate-800 hover:border-emerald-500/30" : "bg-white border-white shadow-xl hover:border-indigo-100"}`}>
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-4 py-1.5 bg-indigo-600/10 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest">Phase {idx + 1}</span>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                        <Activity className="w-3 h-3" /> {st.duration}m
                    </div>
                  </div>
                  <h4 className={`text-xl font-black mb-6 line-clamp-2 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>{st.text}</h4>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Initiation</p>
                        <p className={`text-lg font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>{formatTime(st.startTime)}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-700/30" />
                    <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Completion</p>
                        <p className={`text-lg font-black ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>{formatTime(st.endTime)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspace Sections */}
        <div className="space-y-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {myWorkspaces.length > 0 && (
            <div className="space-y-12">
                <div className="flex items-center gap-8">
                    <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Primary Assets</h2>
                    <div className={`h-px flex-1 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{myWorkspaces.length} Units</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {myWorkspaces.map(ws => <WorkspaceCard ws={ws} key={ws.id} />)}
                </div>
            </div>
            )}

            {sharedWorkspaces.length > 0 && (
            <div className="space-y-12">
                <div className="flex items-center gap-8">
                    <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>External Alliances</h2>
                    <div className={`h-px flex-1 ${isDarkMode ? "bg-amber-500/20" : "bg-amber-100"}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">{sharedWorkspaces.length} Shared</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {sharedWorkspaces.map(ws => <WorkspaceCard ws={ws} key={ws.id} />)}
                </div>
            </div>
            )}
        </div>

        {loading && workspaces.length === 0 && (
          <div className="py-40 text-center flex flex-col items-center gap-6 animate-pulse">
            <div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500">Syncing Matrix...</span>
          </div>
        )}
      </div>

      {/* Custom Decommission Modal */}
      {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-300">
            <div className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-white"} border p-16 rounded-[4rem] w-full max-w-lg shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] text-center relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-10"><ShieldAlert className="w-12 h-12 text-red-500" /></div>
              <h2 className={`text-4xl font-black mb-6 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>Confirm Decommission</h2>
              <p className="text-slate-500 mb-12 text-lg leading-relaxed">You are about to permanently decommission this workspace and all internal strategic data. This action is irreversible.</p>
              <div className="flex gap-6">
                <button onClick={() => setShowDeleteModal(null)} className={`flex-1 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all ${isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>Abort Protocol</button>
                <button onClick={deleteWorkspace} className="flex-1 py-6 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-500/20 transition-all active:scale-95">Authorize Delete</button>
              </div>
            </div>
          </div>
      )}

      {showExpiryModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-500">
            <div className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-white"} border p-16 rounded-[4rem] w-full max-w-lg shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] text-center relative overflow-hidden`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-500"></div>
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-10"><Lock className="w-12 h-12 text-red-500" /></div>
              <h2 className={`text-4xl font-black mb-4 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>Access Expired</h2>
              <p className="text-slate-500 mb-12 text-lg leading-relaxed">Your neural handshake has timed out. Please re-authenticate to maintain workspace integrity.</p>
              <button onClick={handleLogout} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95">Re-Authorize</button>
            </div>
          </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-white"} border rounded-[4rem] w-full max-w-3xl shadow-[0_50px_120px_-30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]`}>
            <div className={`p-12 border-b flex justify-between items-start ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                <div>
                    <h2 className="text-4xl font-black tracking-tighter">Initialize Unit</h2>
                    <p className="text-slate-500 mt-2 text-sm">Define the operational parameters for your new workspace.</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className={`p-4 rounded-2xl transition-all ${isDarkMode ? "hover:bg-white/5 text-slate-500" : "hover:bg-black/5 text-slate-400"}`}><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-12 space-y-10 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unit Designation</label>
                    <input {...register("name", { required: true })} className={`w-full p-6 rounded-[2rem] border font-black text-xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} placeholder="e.g. PROJECT_ZION" />
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Deployment Logic</label>
                    <select {...register("workspaceType")} className={`w-full p-6 rounded-[2rem] border font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`}>
                        <option value="Personal">Personal Core</option>
                        <option value="Team">Team Collaboration</option>
                        <option value="Project">Global Project</option>
                    </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Strategic Description</label>
                <textarea {...register("description", { required: true })} rows={3} className={`w-full p-6 rounded-[2.5rem] border font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} placeholder="What is the objective of this unit?" />
              </div>
              
              {workspaceType !== "Personal" && (
                <div className="space-y-8 animate-in slide-in-from-top-6 duration-500">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-black uppercase tracking-widest text-indigo-500">Member Manifest</label>
                        <button type="button" onClick={() => append({ email: "" })} className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-500 px-5 py-2 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> Append Member</button>
                    </div>
                    <div className="space-y-4">
                        {fields.map((field, idx) => (
                            <div key={field.id} className="flex gap-4 items-center group/member">
                                <div className="flex-1 relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input {...register(`members.${idx}.email`)} className={`w-full pl-14 pr-6 py-5 rounded-[1.5rem] border text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-100"}`} placeholder="teammate@company.com" />
                                </div>
                                <button type="button" onClick={() => remove(idx)} className="p-5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              <button type="submit" className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-[0_20px_50px_-15px_rgba(79,70,229,0.5)] transition-all active:scale-[0.98] mt-6">Deploy Protocol</button>
            </form>
          </div>
        </div>
      )}

      {/* Notifications */}
      {(success || error) && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-12 fade-in duration-500">
          <div className={`px-10 py-5 rounded-[2rem] shadow-2xl border backdrop-blur-xl flex items-center gap-5 font-black text-xs uppercase tracking-widest ${
              success ? (isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white border-green-100 text-green-600") : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${success ? "bg-emerald-500" : "bg-red-500"}`}></div>
            {success || error}
          </div>
        </div>
      )}
    </div>
  );
};

export default phase_ii_ui;
