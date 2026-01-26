const User = require('../models/user.model');
const sendOtpToEmail = require('../services/emailService');
const { sendOtpToPhoneNumber } = require('../services/twilloService');
const twilloService = require('../services/twilloService');
const generateToken = require('../utils/generateToken');
const response = require('../utils/responseHandler');
const otpGenerate = require('../utils/otpGenerator');
const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');
const Conversation = require('../models/conversation.model');


// send otp 

const sendOtp = async (req, res) => {
    const {phoneNumber,phoneSuffix,email} = req.body;
    const otp = otpGenerate();
    const expiry = Date.now() + 500000;
    let user;
    try {
        if(email){
            user = await User.findOne({email})
            if(!user){
                user = new User({
                    email
                })
            }
            user.emailOtp = otp;
            user.emailOtpExpireAt = expiry;
            await user.save();
            await sendOtpToEmail(email,otp);
            return response(res,200,"Otp sent successfully",user);
        }
        if(!phoneNumber || !phoneSuffix){
            return response(res,400,"Please provide a valid phone number");
        }
        const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`
        user = await User.findOne({phoneNumber});
        if(!user){
            user = new User({
                phoneNumber,
                phoneSuffix,
            })
        }
        await sendOtpToPhoneNumber(fullPhoneNumber);
        // await twillioService.sendOtpToPhoneNumber(fullPhoneNumber);
        await user.save();
        return response(res,200,"Otp sent successfully",user);
        
    } catch (error) {
        console.error(error);
        return response(res,500,"Something went wrong");
    }
}

// verify otp 

const verifyOtp = async (req,res)=>{
    const {phoneNumber,phoneSuffix,email,otp} = req.body;
    try {
        let user;
        if(email){
            user = await User.findOne({email});
            if(!user){
                return response(res,400,"User not found");
            }
            const now = new Date();
            if(!user.emailOtp || String(user.emailOtp) !== String(otp) || now > new Date(user.emailOtpExpireAt)){
                return response(res,400,"Invalid or otp expired");
            }
            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpireAt = null;
            await user.save();
        }else{
            if(!phoneNumber || !phoneSuffix){
            return response(res,400,"Please provide a valid phone number");
        }
        const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`
        user = await User.findOne({phoneNumber});
        if(!user){
            return response(res,400,"User not found");
        }
        const result = await twilloService.verifyOtp(fullPhoneNumber,otp);
        if(result.status !== "approved"){
            return response(res,400,"Invalid expired");
        }
        user.isVerified = true;
        await user.save();
        }
        const token = generateToken(user?._id);
        res.cookie("auth_token",token,{
            maxAge: 1000 * 60 * 60 * 24 * 365,
            httpOnly: true
        });
        return response(res,200,"OTP verified successfully",{user,token});

    } catch (error) {
        console.error(error);
        return response(res,500,"Something went wrong");
    }
}

const updateProfile = async (req,res)=>{
    const {username,agreed,about} = req.body;
    const userId = req.user.userId;
    try {
        const user = await User.findById(userId);
        const file = req.file;
        if(file){
            const uploadResult = await uploadFileToCloudinary(file);
            user.profilePicture = uploadResult.secure_url;
            console.log(uploadResult);
            
        }else if(req.body.profilePicture){
            user.profilePicture = req.body.profilePicture
        }

        if(username){
            user.username = username;
        }
        if(agreed){
            user.agreed = agreed;
        }
        if(about){
            user.about = about;
        }
        await user.save();
        return response(res,200,"Profile updated successfully",user);
    } catch (error) {
        console.error(error);
        return response(res,500,"Something went wrong");
    }
}

const logout = (req,res)=>{
    try {
        res.cookie("auth_token","",{
            expires: new Date(0)
        })
        return response(res,200,"Logged out successfully");
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

const checkAuthenticated = async (req,res)=>{
    try {
        const userId = req.user.userId;
        if(!userId){
            return response(res,404,"unauthorized user || Please login first");
        }
        const user = await User.findById(userId);
        if(!user){
            return response(res,404,"unauthorized user || Please login first");
        }
        return response(res,200,"Authorized user",user);
    } catch (error) {
        console.error(error);
        return response(res,401,"Internal server error");
    }
}

const getAllUsers = async (req,res)=>{
    const loggedInUser = req.user.userId;
    try {
        const users = await User.find({ _id: { $ne: loggedInUser } })
        .select("username profilePicture lastSeen isOnline about phoneNumber phoneSuffix").lean();  // lean is used to get data in the same order

        const usersWithConversation = await Promise.all(users.map(async (user) => {
            const conversation = await Conversation.findOne({
            participants: { $all: [loggedInUser, user?._id] }
            }).populate({
                path:"lastMessage",
                select:"content createdAt sender receiver"
            }).lean();
            return {
                ...user,conversation: conversation || null
            }
        })) 
        console.log("usersWithConversation : ",usersWithConversation);
        return response(res,200,"users retrieved successfully",usersWithConversation);
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

module.exports = {
    sendOtp,
    verifyOtp,
    updateProfile,
    logout,
    checkAuthenticated,
    getAllUsers
}