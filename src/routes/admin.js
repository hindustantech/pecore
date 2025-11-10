import express from "express";
import { sendOtp, verifyOtp,registerAdmin } from "../controllers/admin.js";
const router = express.Router();

router.post("/registerAdmin", registerAdmin);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);


export default router;
