const express = require("express");
const router = express.Router();

const { sendOtp, verifyOtp, updateProfile, logout, checkAuthenticated, getAllUsers, } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/logout", logout);

// protected route 
router.put("/update-profile", authMiddleware, multerMiddleware,updateProfile);
router.get("/check-auth", authMiddleware,checkAuthenticated);
router.get("/users",authMiddleware,getAllUsers)


module.exports = router;