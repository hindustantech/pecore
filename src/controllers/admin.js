import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import { sendWhatsAppOtp, verifyWhatsAppOtp } from "../config/Whatapp.js";

// Step 1: Send OTP to Admin phone number
export const sendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ message: "Phone number is required" });
        }
        
        let admin = await Admin.findOne({ phoneNumber });
        if (!admin) {
            return res.status(401).json({
                message: "Unauthorized number",
            });
        }

        // Send OTP using helper
        const otpResponse = await sendWhatsAppOtp(phoneNumber);
        if (!otpResponse.success) {
            return res.status(400).json({ message: "Failed to send OTP", error: otpResponse.error });
        }

        // If admin doesn't exist, create one temporarily


        // Return OTP uid (you’ll need this to verify)
        res.status(200).json({
            message: "OTP sent successfully",
            uid: otpResponse.data?.uid || null,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Step 2: Verify OTP and Login
export const verifyOtp = async (req, res) => {
    try {
        const { uid, otp, phoneNumber } = req.body;

        if (!uid || !otp || !phoneNumber) {
            return res.status(400).json({ message: "UID, OTP and phone number are required" });
        }

        const verifyResponse = await verifyWhatsAppOtp(uid, otp);
        if (!verifyResponse.success || verifyResponse.data?.status !== "success") {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const admin = await Admin.findOne({ phoneNumber });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Generate JWT token
        const token = jwt.sign({ _id: admin._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
        admin.tokens.push({ token });
        await admin.save();

        res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                _id: admin._id,
                name: admin.name,
                phoneNumber: admin.phoneNumber,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

