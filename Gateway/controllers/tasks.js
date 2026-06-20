const express = require('express');
const axios = require('axios');
const api = require('../api.js'); // adjust as needed
const { proxy } = require('../utils/proxy.js');
const app = express.Router();  // <
app.use(express.json());  // To parse JSON body

app.patch('/task/:groupId/task/:taskId', async (req, res) => {
    // console.log(groupId, taskId, req.body)
    // console.log("comes in gateway of update task")
    const { groupId, taskId } = req.params;
    proxy(req, res, api.taskapi, `/${groupId}/tasks/${taskId}`)
});

app.post('/task/:groupId/task/create', async (req, res) => {
    console.log("comes here")
    const { groupId } = req.params;
    proxy(req, res, api.taskapi, `/${groupId}/tasks`)
});

app.get('/task/:groupId/tasks', async (req, res) => {
    console.log("request comes here")
    const { groupId } = req.params;
    proxy(req, res, api.taskapi, `/${groupId}/task`)
});

app.delete('/task/:groupId/task/:taskId', async (req, res) => {
    console.log("delete request comes here")
    const { groupId, taskId } = req.params;
    console.log(groupId, taskId)
    proxy(req, res, api.taskapi, `/${groupId}/tasks/${taskId}`)
});
module.exports = app
