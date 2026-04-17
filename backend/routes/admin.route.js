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

// All routes now public (no authentication required)
router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.put("/users/:userId/toggle-block", toggleUserBlock);
router.delete("/users/:userId", deleteUser);
router.get("/reports", getReports);
router.put("/reports/:reportId/resolve", resolveReport);
router.get("/analytics", getAnalytics);

module.exports = router;
