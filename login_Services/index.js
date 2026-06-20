const express = require('express');
const connectdb = require('./database/connect_DB.js');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const jwt_S = process.env.JWT;
const port = process.env.PORT || 5000;
const router = require('./routers/routes.js');

const app = express();

// CORS origins from environment variable (comma-separated)
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use('/api/v1/', router);

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(400).json({ message: "token is not present" });
    }
    jwt.verify(token, jwt_S, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
}

app.get('/protected', verifyToken, (req, res) => {
    res.json({ message: `Hello ${req.user.username || 'user'}, you accessed protected data!` });
});

const start = async () => {
    try {
        await connectdb(process.env.MONGO_URI);
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (err) {
        console.log(err);
    }
};
start();
