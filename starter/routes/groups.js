import express from "express";
import {
    getAllGroups,
    createGroups,
    updateGroup,
    deleteGroup,
    getAllGroupsAdmin,
    deleteGroupAdmin,
    scheduleGroupTasks
} from "../controlers_Task/groups.js";
import authMiddleware from "../middlewares/authmiddleware.js";
import checkAdmin from "../middlewares/checkAdmin.js";

const router = express.Router();

// ✅ Admin Routes
router.route('/admin/all')
    .get(checkAdmin, getAllGroupsAdmin);

router.route('/admin/:groupId')
    .delete(checkAdmin, deleteGroupAdmin);

router.route("/groups")
    .get(getAllGroups)
    .post(createGroups);

router.route("/groups/:groupId")
    .patch(updateGroup)
    .delete(deleteGroup);

router.route("/groups/:groupId/schedule")
    .post(scheduleGroupTasks);

export default router;
