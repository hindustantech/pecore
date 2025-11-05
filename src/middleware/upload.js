// middleware/upload.js
import multer from "multer";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage for in-memory compression
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB before compression
});

// Middleware to compress and upload image
export const compressAndUpload = async (req, res, next) => {
    try {
        if (!req.file) return next();

        let quality = 70;
        let buffer = await sharp(req.file.buffer)
            .resize({ width: 800, height: 800, fit: "inside" })
            .jpeg({ quality })
            .toBuffer();

        // Reduce quality until image < 1 MB
        while (buffer.length > 1024 * 1024 && quality > 30) {
            quality -= 10;
            buffer = await sharp(req.file.buffer)
                .resize({ width: 800, height: 800, fit: "inside" })
                .jpeg({ quality })
                .toBuffer();
        }

        // Upload compressed image to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "employee_attendance",
                resource_type: "image",
            },
            (error, result) => {
                if (error) return next(error);
                req.file.path = result.secure_url; // Attach Cloudinary URL to req.file.path
                next();
            }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
    } catch (err) {
        console.error("Compression/Upload Error:", err);
        next(err);
    }
};

export default upload;
