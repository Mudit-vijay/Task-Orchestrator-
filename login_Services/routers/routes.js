const express = require('express');
const jwt = require('jsonwebtoken');
const { login, createUser, OauthCreation, otpVerification, getAllUsersAdmin, deleteUserAdmin } = require('../controllers/login');
const { google } = require('googleapis');
require('dotenv').config();

const router = express.Router();
router.use(express.json());
const URI = process.env.GOOGLE_REDIRECT_URI
// --- Existing routes ---
router.post('/login', login);
router.post('/createUser', createUser);
router.post('/oauthcreation', OauthCreation)
router.post('/otpVerification', otpVerification)

// --- Admin Middleware ---
const checkAdmin = (req, res, next) => {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: "No token found" });

    try {
        const decoded = jwt.verify(token, process.env.JWT);
        if (decoded.role !== 'ADMIN') {
            return res.status(403).json({ msg: "Access denied. Admin only." });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ msg: "Invalid token" });
    }
};

// --- Admin routes ---
router.get('/admin/users', checkAdmin, getAllUsersAdmin);
router.delete('/admin/users/:id', checkAdmin, deleteUserAdmin);

module.exports = router;
