const mongoose = require('mongoose')
const customer_Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "USER",
        enum: ["CREATOR", "ADMIN", "USER"],
    },
    last_verified:{
        type:Date,
        required:true,
    }
}, { timestamps: true })
const customer = new mongoose.model('customer', customer_Schema);
module.exports = customer;
