import mongoose from "mongoose";
import Group from "../models/Group.js";
import jwt from "jsonwebtoken";
import Task from "../models/tasks.js";
import axios from "axios";


export const getAllGroups = async (req, res) => {
    const token = req.headers["authorization"]; 

    try {
        const decoded = jwt.verify(token, process.env.JWT);
        const userID = decoded.id;
        const userEmail = decoded.email; // Assuming email is in the JWT
        
        // Find groups created by the user OR where the user is a member
        const groups = await Group.find({
            $or: [
                { user: userID },
                { members: userEmail }
            ]
        });
        
        res.status(200).json(groups);
    } catch (err) {
        console.error("Error in getAllGroups:", err.message);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

export const createGroups = async (req, res) => {
    const { name, description, workspaceType, members } = req.body;
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: "No token found" });

    try {
        const decoded = jwt.verify(token, process.env.JWT);
        const userId = decoded.id;
        const newGroup = await Group.create({ 
            name, 
            description, 
            user: userId,
            workspaceType: workspaceType || "Personal",
            members: members || []
        });
        res.status(201).json(newGroup);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const updateGroup = async (req, res) => {
    const groupId = req.params.groupId;
    const name = req.body.body || req.body.name; // Handling both structures
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ msg: "Invalid group ID format" });
    }

    const token = req.headers['authorization'];
    try {
        const decoded = jwt.verify(token, process.env.JWT);
        const user_id = decoded.id;
        
        const existingGroup = await Group.findOne({
            user: user_id,
            name: name,
            _id: { $ne: groupId } // Exclude current group
        });
        
        if (existingGroup) {
            return res.status(400).json({ message: "Group already exists with that name" });
        }

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: "Group not found" });

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            { name },
            { new: true }  // so it returns the updated document
        );
        res.status(200).json({ group: updatedGroup });
    } catch (err) {
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ msg: "Group not found" });

        await Group.findByIdAndDelete(req.params.groupId);
        // Note: You should ideally also delete all tasks associated with this group here,
        // or rely on a Mongoose pre-remove hook / event listener.
        res.status(200).json({ msg: "Group deleted successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};

export const getAllGroupsAdmin = async (req, res) => {
    try {
        const groups = await Group.find({}).populate('user', 'name email');
        res.status(200).json(groups);
    } catch (err) {
        console.error("Error in getAllGroupsAdmin:", err.message);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

export const deleteGroupAdmin = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ msg: "Group not found" });

        await Group.findByIdAndDelete(req.params.groupId);
        res.status(200).json({ msg: "Group deleted successfully by Admin" });
    } catch (err) {
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};

/**
 * Computes a relative deadline (in minutes from "now") for the scheduler.
 * Ensures a minimum of 100 minutes so the algorithm always has room to schedule.
 */
const computeRelativeDeadline = (deadlineDate, nowInMinutes) => {
    const taskDeadline = deadlineDate
        ? Math.floor(new Date(deadlineDate).getTime() / 60000)
        : (nowInMinutes + 1440); // Default: 24 hours from now
    return Math.max(100, taskDeadline - nowInMinutes);
};

/**
 * Maps a single populated Mongoose dependency document to the flat Java TaskModel
 * shape that the algorithm expects. Only 1 level deep — the algorithm only needs
 * `dependency.getTaskId()` to compare against its completedTaskIds set.
 */
const mapDependencyToJavaModel = (dep, groupId, relativeDeadline) => ({
    taskId: dep._id.toString(),
    name: dep.name,
    description: "",
    priority: dep.priority || "Medium",
    estimated_duration: dep.estimated_duration || 30,
    completed: dep.completed || false,
    deadline: relativeDeadline,
    taskDependency: [], // Algorithm only needs 1 level deep
    userId: 1,
    userName: "User",
    groupId: groupId.toString()
});

export const scheduleGroupTasks = async (req, res) => {
    const { groupId } = req.params;
    
    try {
        console.log(`[Scheduler] Fetching tasks for groupId: ${groupId}`);

        // Populate dependency so we have the full objects for the Java mapper
        const tasks = await Task.find({ groupId })
            .populate('dependency', '_id name priority estimated_duration deadline completed');
        
        if (!tasks || tasks.length === 0) {
            console.log(`[Scheduler] No tasks found for group: ${groupId}`);
            return res.status(404).json({ message: "No tasks found for this group" });
        }

        console.log(`[Scheduler] Found ${tasks.length} tasks. Mapping to Java format...`);

        const nowInMinutes = Math.floor(Date.now() / 60000);

        // Map MongoDB tasks to Java TaskModel format with populated dependencies
        const formattedTasks = tasks.map(t => {
            const relativeDeadline = computeRelativeDeadline(t.deadline, nowInMinutes);
            
            return {
                taskId: t._id.toString(),
                name: t.name,
                description: t.description || "",
                priority: t.priority || "Medium",
                estimated_duration: t.estimated_duration || 30,
                completed: t.completed || false,
                deadline: relativeDeadline,
                taskDependency: (t.dependency || []).map(dep =>
                    mapDependencyToJavaModel(dep, groupId, computeRelativeDeadline(dep.deadline, nowInMinutes))
                ),
                userId: 1, 
                userName: "User",
                groupId: groupId.toString()
            };
        });

        // Get custom constraints from request body
        const { startTime = 0, endTime = 1440, totalHours = 1440 } = req.body;

        console.log(`[Scheduler] Using Constraints - Start: ${startTime}, End: ${endTime}, Total: ${totalHours}`);
        console.log(`[Scheduler] Sample Task Deadline: ${formattedTasks[0].deadline}`);
        console.log(`[Scheduler] Dependencies mapped: ${formattedTasks.filter(t => t.taskDependency.length > 0).length} tasks have dependencies`);
        console.log(`[Scheduler] Sending request to Java Spring Boot (Live URL)...`);
        
        // Call Java Scheduler Service with correct structure
        const schedulerUrl = process.env.SCHEDULER_SERVICE_URL || 'http://localhost:9001';
        const response = await axios.post(`${schedulerUrl}/api/v1/scheduler/generate`, {
            tasks: formattedTasks,
            constraints: {
                startTime, 
                endTime, 
                totalDays: 7,
                totalWeeks: 1,
                totalHours 
            },
            policy: { 
                optimizationGoal: "EARLIEST_DEADLINE",
                priorityMultiplier: 1.0,
                deadlineMultiplier: 1.0,
                dependencyMultiplier: 1.0
            },
            algorithmType: "backtracking"
        });

        console.log(`[Scheduler] Received response from Java. Status: ${response.status}`);
        console.log(`[Scheduler] Schedule length: ${response.data ? (Array.isArray(response.data) ? response.data.length : 'object') : 0}`);

        res.status(200).json(response.data);
    } catch (err) {
        console.error("Scheduling error:", err.message);
        
        // Handle JWT errors specifically
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.message === 'jwt expired') {
            return res.status(401).json({ message: "Session expired", error: err.message });
        }

        res.status(500).json({ 
            message: "Failed to schedule tasks", 
            error: err.response?.data || err.message 
        });
    }
};
