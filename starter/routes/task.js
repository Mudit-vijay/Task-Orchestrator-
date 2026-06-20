import express from "express";
import {
    getAllTaskks,
    createtask,
    updatetask,
    deletetask,
    getAllTasksAdmin,
    deleteTaskAdmin
} from "../controlers_Task/tasks.js";
import checkAdmin from "../middlewares/checkAdmin.js";

const router = express.Router();

// ✅ Admin Routes
router.route('/admin/all')
    .get(checkAdmin, getAllTasksAdmin);

router.route('/admin/:taskId')
    .delete(checkAdmin, deleteTaskAdmin);

// ✅ Requires groupId param
router.route('/:groupId/tasks')
    .get(getAllTaskks)
    .post(createtask);

router.route('/:groupId/tasks/:taskId')
    .patch(updatetask)
    .delete(deletetask);

export default router;
