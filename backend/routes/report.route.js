const express = require("express");
const { createReport, getMyReports } = require("../controllers/report.controller");
const protectRoute = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/create", protectRoute, createReport);
router.get("/my-reports", protectRoute, getMyReports);

module.exports = router;
