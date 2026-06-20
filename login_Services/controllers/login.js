const express = require('express');
const loginSchema = require('../schemas/customer_Schema.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

require('dotenv').config();

const jwt_S = process.env.JWT;

// --------------------
// OTP Store (in-memory)
const otpStore = new Map(); // key: email, value: otp

// --------------------
// Helper function to generate OTP
function generateOTP(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}

// --------------------
// Brevo Mail Sender (FIXED)
async function sendEmail(receiveremail, otp) {
    console.log("comes in that ")
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            sender: {
                name: "My App",
                email: process.env.SENDGRID_VERIFIED_EMAIL // must be verified in Brevo
            },
            to: [
                {
                    email: receiveremail
                }
            ],
            subject: "OTP VERIFICATION",
            htmlContent: `<h2>Here is your OTP for email verification</h2><h1>${otp}</h1>`
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Brevo mail error:", data);
        throw new Error("Email sending failed");
    }
    console.log("Brevo mail sent:", data);
}

const login = async (req, res) => {
    console.log("login");
    try {
        const { email, password } = req.body;

        const data = await findUserDetails(email)
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const isPasswordValid = bcrypt.compareSync(password, data.password);
        if (!isPasswordValid) {
            return res.status(400).json("Invalid password");
        }
        updateverification(email);

        const token = genrerateToken(data._id, email, data.role);
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        })
        return res.status(200).json({ ...data.toObject(), token });

    } catch (err) {
        console.log(`Login error: ${err.message}`);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

// --------------------
// Create User Controller
const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, role, and password are required" });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const otp = generateOTP();
        otpStore.set(email, otp);

        const role = "USER";//make it dynamic **
        const user = await loginSchema.create({
            name,
            email,
            password: hashedPassword,
            role,
            last_verified: Date.now()
        });

        if (process.env.OTP_ENABLED === 'false') {
            const token = genrerateToken(user._id, user.email, user.role);
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({ ...user.toObject(), token });
        }

        await sendEmail(user.email, otp); 
        return res.status(200).json({ message: "OTP sent to email", email: user.email });

    } catch (err) {
        console.log(`Error in creating user: ${err.message}`);
        if (err.code === 11000) {
            return res.status(400).json({ message: "User already exists with this email" });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
};

// --------------------
// OAUTH Create User Controller
function generatePassword(length = 8) {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let password = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }

    return password;
}

const OauthCreation = async (req, res) => {
    console.log("request comes in backend");

    const authHeader = req.headers['authorization'] || req.get('authorization');
    console.log(authHeader);
    const token = authHeader.split(" ")[1];

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const userInfo = await response.json();
        const email = userInfo.email;
        const name = userInfo.name;
        const role = "USER";

        const loggedin_user = await loginSchema.findOne({ email });
        if (loggedin_user) {
            const token = jwt.sign(
                { id: loggedin_user._id, email: loggedin_user.email, role: loggedin_user.role },
                jwt_S,
                { expiresIn: '1h' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'LAX',
                maxAge: 24 * 60 * 60 * 1000,
            });

            return res.json({
                _id: loggedin_user._id,
                token,
                name: loggedin_user.name,
                email: loggedin_user.email,
            });
        }

        const user = await loginSchema.create({
            name,
            email,
            password: generatePassword(),
            role
        });

        const tokenn = jwt.sign(
            { id: user._id },
            jwt_S,
            { expiresIn: '12h' }
        );

        return res.status(201).json({
            token: tokenn,
            id: user._id,
            success: true,
            message: "User created successfully",
        });

    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(401).json({ error: "Invalid token" });
    }
};

// --------------------
// OTP Verification
//create a seprate method to check for token expiration every time through cookies;
//if i require role here then i will get it from backend directly because user is login and role must allready preesnt on backend for token
const otpVerification = async (req, res) => {
    console.log("comes in otp verification");
    try {
        const { otp: userotp, email } = req.body

        // Toggle for OTP verification
        if (process.env.OTP_ENABLED === 'false') {
            const data = await findUserDetails(email);
            if (data) {
                const token = genrerateToken(data._id, email, data.role);
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000,
                });
                return res.status(200).json({
                    msg: "OTP Verification Successfull",
                    data
                });
            }
        }



        const systemotp = otpStore.get(email);
        const data = await findUserDetails(email)
        if (!data) {
            return res.status(401).json("user not found");
        }
        if (checkVerified(data.last_verified)) {
            updateverification(email);
            const response = {
                msg: "OTP Verification Successfull",
                data
            }
            const token = genrerateToken(data._id, email, data.role);
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            })
            return res.status(200).json(response);
        }
        else if (!checkVerified(data.last_verified)) {
            if (systemotp == userotp) {
                updateverification(email);
                const token = genrerateToken(data._id, email, data.role);
                const response = {
                    msg: "OTP Verification Successfull",
                    data
                }
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000,
                })
                return res.status(200).json(response);
            }
        }
    }
    catch (err) {
        return res.status(401).json("OTP Verification Failed");
    }
}
const genrerateToken = (id, email, role) => {
    const token = jwt.sign(
        { id: id, email: email, role: role },
        jwt_S,
        { expiresIn: '1h' }
    );
    return token;
}
async function findUserDetails(email) {
    return await loginSchema.findOne({ email });
}
function checkVerified(date) {
    if (!date) return true; // treat missing date as expired

    const now = Date.now();
    const lastVerified = new Date(date).getTime();

    const ONE_DAY = 24 * 60 * 60 * 1000;

    return (now - lastVerified) > ONE_DAY;
}

async function updateverification(email) {
    return await loginSchema.findOneAndUpdate(
        { email },
        { $set: { last_verified: Date.now() } },
        { new: true }
    );
}

const getAllUsersAdmin = async (req, res) => {
    try {
        const users = await loginSchema.find({}).select('-password');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const deleteUserAdmin = async (req, res) => {
    try {
        const user = await loginSchema.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        await loginSchema.findByIdAndDelete(req.params.id);
        res.status(200).json({ msg: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Internal server error", error: err.message });
    }
};


module.exports = {
    login,
    createUser,
    OauthCreation,
    otpVerification,
    getAllUsersAdmin,
    deleteUserAdmin
};
