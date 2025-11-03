import express from "express";
import {
    markAttendance,
    getAttendanceByEmployee,
    getDailyReport,
    getMonthlySummary,
    getAttendanceByEmployeeAdmin,
    getDailyReportAdmin,
    getMonthlySummaryAdmin,
    getAttendanceReport,
    exportAttendanceReport,
    getAttendanceLog
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
const router = express.Router();


router.post("/mark", protect, upload.single("selfieUrl"), markAttendance);
router.get("/my", protect, getAttendanceByEmployee);
router.get("/daily-report", protect, getDailyReport);
router.get("/monthly-summary", protect, getMonthlySummary);


router.get("/admin/my", protect, getAttendanceByEmployeeAdmin);
router.get("/admin/daily-report", protect, getDailyReportAdmin);
router.get("/admin/monthly-summary", protect, getMonthlySummaryAdmin);



router.get('/report', getAttendanceReport);
router.get('/report/export', exportAttendanceReport);
router.get('/log/:id', getAttendanceLog);


export default router;
