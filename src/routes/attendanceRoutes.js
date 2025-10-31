import express from "express";
import { markAttendance, getAttendanceByEmployee ,getDailyReport,getMonthlySummary} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
const router = express.Router();


router.post("/mark", protect, upload.single("selfieUrl"), markAttendance);
router.get("/my", protect, getAttendanceByEmployee);
router.get("/daily-report", protect, getDailyReport);
router.get("/monthly-summary", protect, getMonthlySummary);

export default router;
