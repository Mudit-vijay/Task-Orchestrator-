const express = require('express');
const api = require('../api.js'); // adjust as needed
const { proxy } = require('../utils/proxy.js');
const app = express.Router();  // <

app.use(express.json());  // To parse JSON body

// ✅ Get all group
//you have to send the user id to access all the groups 
app.get("/groups", async (req, res) => {
    // const authHeader = req.headers["authorization"];  // OR req.get("Authorization")
    proxy(req,res,api.groupapi,'/groups');
});



// ✅ Create a group
app.post('/group/create', async (req, res) => {
    console.log("cerate a groups 1")
    const authHeader = req.headers['authorization'];
    console.log(authHeader)
    // const token = authHeader.split(" ")[1];
    // console.log("cerate a groups 2")
    proxy(req,res,api.groupapi,`/groups`);
    
});

// ✅ Update a group
app.put('/group/:groupId/update', async (req, res) => {
    // console.log("update a groups1");
    const { groupId } = req.params;
    // const authHeader = req.headers['Authorization']
    // const token = authHeader.split(" ")[1];
    proxy(req,res,api.groupapi,`/groups/${groupId}`)
});

// ✅ Delete a group
app.delete('/group/:groupId', async (req, res) => {
    // console.log("delete a group 1")
    const { groupId } = req.params;
    proxy(req,res,api.groupapi,`/groups/${groupId}`)
});
module.exports = app; // <-- export router





