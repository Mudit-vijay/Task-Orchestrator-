import Group from "../models/Group.js";
import Task from "../models/tasks.js";
import jwt from "jsonwebtoken";

const getAllTaskks = async (req, res) => {
    const { groupId } = req.params;
    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: `Group not found with id: ${groupId}` });
        }

        // Fetch tasks and resolve dependency references into usable objects
        const tasks = await Task.find({ groupId: groupId })
            .populate('dependency', '_id name priority estimated_duration deadline completed');

        res.status(200).json({ tasks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};

const createtask = async (req, res) => {
    const { groupId } = req.params;
    const taskData = req.body;

    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ msg: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT);
        const user_id = decoded.id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: `Group not found with id: ${groupId}` });
        }

        // Validate that every dependency ID actually exists within this group
        if (taskData.dependency && Array.isArray(taskData.dependency) && taskData.dependency.length > 0) {
            const depTasks = await Task.find({
                _id: { $in: taskData.dependency },
                groupId: groupId
            });
            if (depTasks.length !== taskData.dependency.length) {
                return res.status(400).json({ msg: "One or more dependency tasks not found in this group." });
            }
        }

        // Create the task with relations
        const newTask = await Task.create({
            ...taskData,
            groupId: groupId,
            userId: user_id,
            userName: taskData.userName || "Unknown User" // Fallback if frontend misses it
        });

        res.status(201).json({ msg: "Task created successfully", task: newTask });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};

const updatetask = async (req, res) => {
    const { taskId, groupId } = req.params;
    const updatedData = req.body;

    try {
        // If updating dependencies, validate them against the same group
        if (updatedData.dependency && Array.isArray(updatedData.dependency) && updatedData.dependency.length > 0) {
            // Prevent self-dependency
            if (updatedData.dependency.includes(taskId)) {
                return res.status(400).json({ msg: "A task cannot depend on itself." });
            }

            const currentTask = await Task.findById(taskId);
            if (!currentTask) {
                return res.status(404).json({ msg: `Task not found with id: ${taskId}` });
            }

            const depTasks = await Task.find({
                _id: { $in: updatedData.dependency },
                groupId: currentTask.groupId
            });
            if (depTasks.length !== updatedData.dependency.length) {
                return res.status(400).json({ msg: "One or more dependency tasks not found in this group." });
            }
        }

        const updated = await Task.findByIdAndUpdate(taskId, updatedData, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({ msg: `Task not found with id: ${taskId}` });
        }

        res.status(200).json({ msg: "Task updated", task: updated });
    } catch (err) {
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};

const deletetask = async (req, res) => {
    const { groupId, taskId } = req.params;
    
    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: "Group not found" });
        }

        const task = await Task.findByIdAndDelete(taskId);
        if (!task) {
             return res.status(404).json({ msg: "Task not found" });
        }

        // Cascade: remove this task from the dependency array of every other task in the group
        await Task.updateMany(
            { groupId: groupId, dependency: taskId },
            { $pull: { dependency: taskId } }
        );

        res.status(200).json({ msg: "Task deleted" });
    } catch (err) {
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};

const getAllTasksAdmin = async (req, res) => {
    try {
        const tasks = await Task.find({}).populate('groupId', 'name');
        res.status(200).json({ tasks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};

const deleteTaskAdmin = async (req, res) => {
    const { taskId } = req.params;
    try {
        const task = await Task.findByIdAndDelete(taskId);
        if (!task) {
            return res.status(404).json({ msg: "Task not found" });
        }

        // Cascade: remove deleted task from all dependency arrays globally
        await Task.updateMany(
            { dependency: taskId },
            { $pull: { dependency: taskId } }
        );

        res.status(200).json({ msg: "Task deleted by Admin" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};

export {
    getAllTaskks,
    createtask,
    updatetask,
    deletetask,
    getAllTasksAdmin,
    deleteTaskAdmin
};
