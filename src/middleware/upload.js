import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        const params = {
            folder: "employee_attendance",
            allowed_formats: ["jpg", "jpeg", "png"],
            transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "40" }, // Very aggressive compression
                { fetch_format: "jpg" },
            ],
            quality_analysis: true,
            compression: "advanced",
        };

        // Adjust settings based on file type if needed
        if (file.mimetype === 'image/png') {
            params.transformation[1].quality = "50"; // Slightly higher for PNG
        }

        return params;
    },
});

const upload = multer({
    storage: storage
    // No file size limits - compression happens on Cloudinary side
});


export default upload;
