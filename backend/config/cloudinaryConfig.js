const dotenv = require("dotenv").config();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const uploadFileToCloudinary = (file) => {
    const options = {
        resource_type:file.mimetype.startsWith("video") ? "video" : "image",

    }
    return new Promise((resolve,reject) =>{
        const uploader = file.mimetype.startsWith("video") ? cloudinary.uploader.upload_large: cloudinary.uploader.upload;
        uploader(file.path,options,(error,result) => {
            if(error){
                fs.unlinkSync(file.path);
                return reject(error);
            }
            fs.unlinkSync(file.path);
            resolve(result);
        })
    })
}

const multerMiddleware = multer({
    dest: "./uploads",
}).single("media");

module.exports = {
    uploadFileToCloudinary,
    multerMiddleware,
};
