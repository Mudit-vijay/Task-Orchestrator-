// controllers/login.js
const express = require('express');
const api = require('../api.js');
const app = express.Router();  // <-- use router, not app
const { proxy } = require('../utils/proxy.js')
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[HIT] ${req.method} ${req.originalUrl} at ${Date.now()}`);
    next();
});
app.post('/login', async (req, res) => {
    proxy(req, res, '/login', api.authapi);
});

app.post('/createUser', async (req, res) => {
    // console.log("request comes 1");
    // console.log(req.body);
    proxy(req, res, '/createUser', api.authapi);
});

app.post('/oauthcreation', async (req, res) => {
    // console.log("atleast request comes here");
    proxy(req, res, '/oauthcreation', api.authapi)

});
app.post('/otpverification', async (req, res) => {
    proxy(req, res, '/otpVerification', api.authapi);
});

module.exports = app;  // <-- export router
