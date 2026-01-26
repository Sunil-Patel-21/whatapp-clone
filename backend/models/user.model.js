const mongoose = require('mongoose');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
    phoneNumber:{
        type: String,
        sparse: true,
        unique: true
    },
    phoneSuffix:{
        type: String,
        unique: false
    },
    username: {
        type: String,
    },
    email: {
        type: String,
        lowercase: true,
        match: [emailRegex, 'Please provide a valid email address'],
         sparse: true  ,
        unique: true
    },
    emailOtp:{
        type: String
    },
    emailOtpExpireAt: {
        type: Date
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    profilePicture: {
        type: String
    },
    about:{
        type: String
    },
    lastSeen:{
        type: Date
    },
    isOnline:{
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    agreed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;