const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");
const { createStatus, getStatuses, deleteStatus, viewStatus } = require("../controllers/status.controller");

// protected route 
router.post("/",authMiddleware, multerMiddleware,createStatus);
router.get("/",authMiddleware,getStatuses);

router.put("/:statusId/view",authMiddleware,viewStatus);

router.delete("/:statusId",authMiddleware,deleteStatus);



module.exports = router;