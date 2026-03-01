const express = require("express");
const router = express.Router();
const adminAuthMiddleware = require("../middlewares/adminAuth.middleware");
const {
    adminLogin,
    getDashboardStats,
    getAllUsers,
    getUserDetails,
    toggleUserBlock,
    deleteUser,
    getReports,
    resolveReport,
    getAnalytics
} = require("../controllers/admin.controller");

// Public route
router.post("/login", adminLogin);

// Protected routes
router.get("/dashboard", adminAuthMiddleware, getDashboardStats);
router.get("/users", adminAuthMiddleware, getAllUsers);
router.get("/users/:userId", adminAuthMiddleware, getUserDetails);
router.put("/users/:userId/toggle-block", adminAuthMiddleware, toggleUserBlock);
router.delete("/users/:userId", adminAuthMiddleware, deleteUser);
router.get("/reports", adminAuthMiddleware, getReports);
router.put("/reports/:reportId/resolve", adminAuthMiddleware, resolveReport);
router.get("/analytics", adminAuthMiddleware, getAnalytics);

module.exports = router;
