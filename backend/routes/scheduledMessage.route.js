const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");
const { 
    createScheduledMessage, 
    updateScheduledMessage, 
    cancelScheduledMessage, 
    getScheduledMessages 
} = require("../controllers/scheduledMessage.controller");

router.post("/", authMiddleware, multerMiddleware, createScheduledMessage);
router.put("/:messageId", authMiddleware, updateScheduledMessage);
router.delete("/:messageId", authMiddleware, cancelScheduledMessage);
router.get("/", authMiddleware, getScheduledMessages);

module.exports = router;
