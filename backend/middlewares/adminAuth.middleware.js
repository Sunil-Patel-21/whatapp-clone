const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const response = require("../utils/responseHandler");

const adminAuthMiddleware = async (req, res, next) => {
    const adminToken = req.cookies?.admin_token;
    if (!adminToken) {
        return response(res, 401, "Admin token missing");
    }
    try {
        const decode = jwt.verify(adminToken, process.env.JWT_SECRET);
        const admin = await Admin.findById(decode.userId);
        
        if (!admin || !admin.isActive) {
            return response(res, 401, "Unauthorized admin");
        }
        
        req.user = decode;
        req.admin = admin;
        next();
    } catch (error) {
        console.error(error);
        return response(res, 401, "Invalid admin token");
    }
};

module.exports = adminAuthMiddleware;
