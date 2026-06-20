import React, { useState } from 'react';
import { schedulerService } from '../../services/api';
import GanttChart from './GanttChart';

const SchedulerPanel = ({ tasks, groupName }) => {
  const [loading, setLoading] = useState(false);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [algorithm, setAlgorithm] = useState('branchAndBound');
  const [policy, setPolicy] = useState({
    priorityMultiplier: 1.0,
    deadlineMultiplier: 1.0,
    dependencyMultiplier: 1.0,
    optimizationGoal: 'BALANCED'
  });

  const handleGenerate = async () => {
    if (!tasks || tasks.length === 0) {
      alert("Please add some tasks to this group first.");
      return;
    }

    setLoading(true);
    try {
      // Map local task structure to TaskModel expected by Java Backend
      const formattedTasks = tasks.map(t => ({
        taskId: Math.floor(Math.random() * 1000000), // In a real app, this would be the actual DB ID
        name: t.name,
        priority: t.priority || "medium",
        estimated_duration: t.duration || t.estimated_duration || 2,
        deadline: t.deadline || 24,
        taskDependency: (t.dependency || []).map(dep => ({
            taskId: typeof dep === 'object' ? dep._id : dep,
            name: typeof dep === 'object' ? dep.name : 'Unknown',
            priority: typeof dep === 'object' ? dep.priority : 'Medium',
            estimated_duration: typeof dep === 'object' ? dep.estimated_duration : 30,
            deadline: 24, taskDependency: [], completed: false,
            userId: 1, userName: "User", groupId: ""
        }))
      }));

      const constraints = {
        startTime: 0,
        totalHours: 40
      };

      const result = await schedulerService.generateSchedule(formattedTasks, constraints, policy, algorithm);
      setScheduledTasks(result);
    } catch (error) {
      console.error("Scheduling failed:", error);
      alert("Failed to generate schedule. Check if the scheduler service is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Smart Optimizer: {groupName}
        </h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            loading 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20'
          }`}
        >
          {loading ? 'Optimizing...' : 'Generate Smart Schedule'}
        </button>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 bg-gray-900/50 p-4 rounded-lg">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Algorithm</label>
          <select 
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
          >
            <option value="branchAndBound">Branch & Bound (Optimal)</option>
            <option value="backtracking">Backtracking (Fast)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Priority Focus</label>
          <input 
            type="range" min="0.5" max="5" step="0.5"
            value={policy.priorityMultiplier}
            onChange={(e) => setPolicy({...policy, priorityMultiplier: parseFloat(e.target.value)})}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Low Importance</span>
            <span>Business Value: {policy.priorityMultiplier}x</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Deadline Focus</label>
          <input 
            type="range" min="0.5" max="5" step="0.5"
            value={policy.deadlineMultiplier}
            onChange={(e) => setPolicy({...policy, deadlineMultiplier: parseFloat(e.target.value)})}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Relaxed</span>
            <span>Urgency: {policy.deadlineMultiplier}x</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dependency Focus</label>
          <input 
            type="range" min="0.5" max="5" step="0.5"
            value={policy.dependencyMultiplier}
            onChange={(e) => setPolicy({...policy, dependencyMultiplier: parseFloat(e.target.value)})}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Flexible</span>
            <span>Chain Weight: {policy.dependencyMultiplier}x</span>
          </div>
        </div>
      </div>

      {/* Visualization Section */}
      <GanttChart scheduledTasks={scheduledTasks} />
    </div>
  );
};

export default SchedulerPanel;
