const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(compression());

// CORS origins from environment variable (comma-separated)
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

// Proxy for Authentication Service
const authProxy = createProxyMiddleware({
    target: process.env.LOGIN_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/v1/login', '/api/v1/createUser', '/api/v1/oauthcreation', '/api/v1/otpverification', '/api/v1/admin/users'],
    on: {
        error: (err, req, res) => {
            console.error('Auth Proxy Error:', err.message);
            res.status(502).send('Auth Service is unreachable');
        }
    }
});

// Proxy for Task and Group Service
const taskGroupProxy = createProxyMiddleware({
    target: process.env.STARTER_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/v1/task', '/api/v1/group', '/api/v1/groups'],
});

// Proxy for Algorithm Scheduler Service
const schedulerProxy = createProxyMiddleware({
    target: process.env.SCHEDULER_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/v1/scheduler'],
});

// Proxy for OAuth Service
const oauthProxy = createProxyMiddleware({
    target: process.env.OAUTH_SERVICE_URL,
    changeOrigin: true,
    pathFilter: ['/api/v1/oauth'],
});

app.use(authProxy);
app.use(taskGroupProxy);
app.use(schedulerProxy);
app.use(oauthProxy);

// Basic health check route
app.get('/health', (req, res) => res.status(200).send('Gateway is healthy!'));

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`API Gateway is listening on port: ${port}`);
});
