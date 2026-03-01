const Report = require("../models/report.model");
const User = require("../models/user.model");
const Message = require("../models/message.model");

// Create report
exports.createReport = async (req, res) => {
  try {
    const { reportedUserId, reportedMessageId, reason, description } = req.body;
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const reporterId = req.user.userId;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create report
    const report = await Report.create({
      reportedBy: reporterId,
      reportedUser: reportedUserId,
      reportedMessage: reportedMessageId || null,
      reason,
      description,
      status: "pending"
    });

    res.status(201).json({ 
      message: "Report submitted successfully",
      report 
    });
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's reports
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user.userId })
      .populate("reportedUser", "fullName profilePicture")
      .populate("reportedMessage")
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
