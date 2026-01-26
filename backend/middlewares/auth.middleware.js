const jwt = require("jsonwebtoken");
const response = require("../utils/responseHandler");

const authMiddleware = async (req,res,next)=>{
    const authToken = req.cookies?.auth_token;
    if(!authToken){
        return response(res,401,"auth token missing");
    }
    try {
        const decode = jwt.verify(authToken,process.env.JWT_SECRET);
        req.user = decode;
        // console.log("req.user : ", req.user);
        next();
    } catch (error) {
        console.error(error);
        return response(res,401,"Invalid auth token");
    }
}



module.exports = authMiddleware;