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
        { quality: "40" }, // aggressive compression
        { fetch_format: "jpg" },
      ],
    };

    // Adjust for PNG slightly
    if (file.mimetype === "image/png") {
      params.transformation[1].quality = "50";
    }

    return params;
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // ✅ allow up to 10MB per file
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

export default upload;
