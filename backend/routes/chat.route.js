const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");
const { sendMessage, getConversation, getMessages, markAsRead, deleteMessage, clearChat, toggleTemporaryMode, viewOneTimeMedia } = require("../controllers/chat.controller");

// protected route 
router.post("/send-message",authMiddleware, multerMiddleware,sendMessage);

router.get("/conversations", authMiddleware,getConversation);
router.get("/conversations/:conversationId/messages",authMiddleware,getMessages)

router.put("/messages/read", authMiddleware,markAsRead);

router.delete("/messages/:messageId", authMiddleware,deleteMessage);

router.delete("/conversations/:conversationId/clear", authMiddleware, clearChat);

router.put("/conversations/:conversationId/temporary-mode", authMiddleware, toggleTemporaryMode);

router.post("/messages/:messageId/view", authMiddleware, viewOneTimeMedia);

module.exports = router;