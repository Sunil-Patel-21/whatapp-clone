const Admin = require('../models/admin.model');
const User = require('../models/user.model');
const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const Status = require('../models/status.model');
const Report = require('../models/report.model');
const response = require('../utils/responseHandler');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcrypt');

// Admin Login
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email, isActive: true });
        if (!admin) {
            return response(res, 401, "Invalid credentials");
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return response(res, 401, "Invalid credentials");
        }

        admin.lastLogin = new Date();
        await admin.save();

        const token = generateToken(admin._id);
        res.cookie("admin_token", token, {
            maxAge: 1000 * 60 * 60 * 8, // 8 hours
            httpOnly: true
        });

        return response(res, 200, "Login successful", {
            admin: { email: admin.email, role: admin.role },
            token
        });
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, activeUsers, totalMessages, totalConversations, totalStatuses, pendingReports] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isOnline: true }),
            Message.countDocuments(),
            Conversation.countDocuments(),
            Status.countDocuments({ expiredAt: { $gt: new Date() } }),
            Report.countDocuments({ status: 'pending' })
        ]);

        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [todayUsers, todayMessages] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: today } }),
            Message.countDocuments({ createdAt: { $gte: today } })
        ]);

        return response(res, 200, "Stats retrieved", {
            totalUsers,
            activeUsers,
            totalMessages,
            totalConversations,
            totalStatuses,
            pendingReports,
            todayUsers,
            todayMessages
        });
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;
    try {
        const query = search ? {
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const users = await User.find(query)
            .select('username email phoneNumber isOnline lastSeen createdAt isVerified')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await User.countDocuments(query);

        return response(res, 200, "Users retrieved", {
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// Get User Details
exports.getUserDetails = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return response(res, 404, "User not found");
        }

        const [messageCount, conversationCount, statusCount] = await Promise.all([
            Message.countDocuments({ sender: userId }),
            Conversation.countDocuments({ participants: userId }),
            Status.countDocuments({ user: userId })
        ]);

        return response(res, 200, "User details retrieved", {
            user,
            stats: { messageCount, conversationCount, statusCount }
        });
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// Block/Unblock User
exports.toggleUserBlock = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return response(res, 404, "User not found");
        }

        user.isVerified = !user.isVerified;
        await user.save();

        return response(res, 200, `User ${user.isVerified ? 'unblocked' : 'blocked'}`, user);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    try {
        await Promise.all([
            User.findByIdAndDelete(userId),
            Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
            Status.deleteMany({ user: userId }),
            Conversation.deleteMany({ participants: userId })
        ]);

        return response(res, 200, "User deleted successfully");
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// Get All Reports
exports.getReports = async (req, res) => {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    try {
        const query = status !== 'all' ? { status } : {};

        const reports = await Report.find(query)
            .populate('reportedBy', 'username email')
            .populate('reportedUser', 'username email')
            .populate('resolvedBy', 'email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Report.countDocuments(query);

        return response(res, 200, "Reports retrieved", {
            reports,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// Resolve Report
exports.resolveReport = async (req, res) => {
    const { reportId } = req.params;
    const { action, status } = req.body;
    const adminId = req.user.userId;

    try {
        const report = await Report.findById(reportId);
        if (!report) {
            return response(res, 404, "Report not found");
        }

        report.status = status || 'resolved';
        report.action = action;
        report.resolvedBy = adminId;
        report.resolvedAt = new Date();
        await report.save();

        return response(res, 200, "Report resolved", report);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};

// Analytics
exports.getAnalytics = async (req, res) => {
    const { period = '7' } = req.query; // days
    try {
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const messageVolume = await Message.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return response(res, 200, "Analytics retrieved", {
            userGrowth,
            messageVolume
        });
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal server error");
    }
};
