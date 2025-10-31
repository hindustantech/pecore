import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "employee_attendance", // Folder name in Cloudinary
        allowed_formats: ["jpg", "jpeg", "png"],
        transformation: [{ width: 800, height: 800, crop: "limit" }], // optional
    },
});

// Create multer instance
const upload = multer({ storage });

export default upload;
