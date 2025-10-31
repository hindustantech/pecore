import Attendance from "../models/Attendance.js";
import mongoose from "mongoose";

// Office Location (Patna, Bihar)
const OFFICE = {
    latitude: 25.6100,
    longitude: 85.1414,
};
const MAX_DISTANCE_METERS = 200;

// Haversine Distance (fast, accurate)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// MARK ATTENDANCE (Check-In / Check-Out)
export const markAttendance = async (req, res) => {
    try {
        const { checkType, latitude, longitude, locationStatus } = req.body;
        const selfieUrl = req.file?.path;
        const employeeId = req.user.id;

        // Validation
        if (!["Check-In", "Check-Out"].includes(checkType)) {
            return res.status(400).json({
                success: false,
                message: "checkType must be 'Check-In' or 'Check-Out'",
            });
        }

        if (latitude == null || longitude == null || !locationStatus) {
            return res.status(400).json({
                success: false,
                message: "latitude, longitude, and locationStatus are required",
            });
        }

        if (!selfieUrl) {
            return res.status(400).json({
                success: false,
                message: "Selfie image is required",
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                success: false,
                message: "Invalid latitude or longitude",
            });
        }

        // Geo-fence Check
        const distance = haversineDistance(
            OFFICE.latitude,
            OFFICE.longitude,
            lat,
            lng
        );

        if (distance > MAX_DISTANCE_METERS) {
            return res.status(403).json({
                success: false,
                message: `Too far: ${Math.round(distance)}m from office. Must be within 200m.`,
            });
        }

        // Today's midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find or create today's record
        let attendance = await Attendance.findOne({
            employee: new mongoose.Types.ObjectId(employeeId),
            date: today,
        });

        if (!attendance) {
            attendance = new Attendance({
                employee: employeeId,
                date: today,
                sessions: [],
            });
        }

        const lastSession = attendance.sessions[attendance.sessions.length - 1];

        if (checkType === "Check-In") {
            if (lastSession && !lastSession.checkOut) {
                return res.status(400).json({
                    success: false,
                    message: "You are already checked in. Check out first.",
                });
            }

            attendance.sessions.push({
                checkIn: new Date(),
                checkInSelfie: selfieUrl,
                checkInLocation: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
                checkInStatus: locationStatus,
            });
        } else {
            // Check-Out
            if (!lastSession || !lastSession.checkIn || lastSession.checkOut) {
                return res.status(400).json({
                    success: false,
                    message: "No active check-in session to check out.",
                });
            }

            lastSession.checkOut = new Date();
            lastSession.checkOutSelfie = selfieUrl;
            lastSession.checkOutLocation = {
                type: "Point",
                coordinates: [lng, lat],
            };
            lastSession.checkOutStatus = locationStatus;
        }

        await attendance.save();

        return res.status(200).json({
            success: true,
            message: `${checkType} recorded successfully`,
            data: attendance,
        });
    } catch (error) {
        console.error("markAttendance error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// GET EMPLOYEE ATTENDANCE LOGS (Paginated)
export const getAttendanceByEmployee = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const totalLogs = await Attendance.countDocuments({ employee: employeeId });

        const logs = await Attendance.find({ employee: employeeId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return res.status(200).json({
            success: true,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalLogs / limit),
                totalLogs,
                hasNext: page < Math.ceil(totalLogs / limit),
                hasPrev: page > 1,
            },
            results: logs.length,
            data: logs,
        });
    } catch (error) {
        console.error("getAttendanceByEmployee error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch logs",
            error: error.message,
        });
    }
};

// DAILY REPORT (Total Hours per Day)
export const getDailyReport = async (req, res) => {
    try {
        const employeeId = req.user.id;

        const report = await Attendance.aggregate([
            { $match: { employee: new mongoose.Types.ObjectId(employeeId) } },
            { $unwind: "$sessions" },
            {
                $match: {
                    "sessions.checkIn": { $exists: true },
                    "sessions.checkOut": { $exists: true },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalMinutes: {
                        $sum: {
                            $dateDiff: {
                                startDate: "$sessions.checkIn",
                                endDate: "$sessions.checkOut",
                                unit: "minute",
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    date: "$_id",
                    totalHours: { $divide: ["$totalMinutes", 60] },
                },
            },
            { $sort: { date: -1 } },
        ]);

        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        console.error("getDailyReport error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching daily report",
            error: error.message,
        });
    }
};

// MONTHLY SUMMARY (Hours per Day in a Month)
export const getMonthlySummary = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: "month and year query params are required",
            });
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: "Invalid month or year",
            });
        }

        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

        const summary = await Attendance.aggregate([
            {
                $match: {
                    employee: new mongoose.Types.ObjectId(employeeId),
                    date: { $gte: startDate, $lte: endDate },
                },
            },
            { $unwind: "$sessions" },
            {
                $match: {
                    "sessions.checkIn": { $exists: true },
                    "sessions.checkOut": { $exists: true },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalMinutes: {
                        $sum: {
                            $dateDiff: {
                                startDate: "$sessions.checkIn",
                                endDate: "$sessions.checkOut",
                                unit: "minute",
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    date: "$_id",
                    totalHours: { $round: [{ $divide: ["$totalMinutes", 60] }, 2] },
                },
            },
            { $sort: { date: 1 } },
        ]);

        return res.status(200).json({
            success: true,
            month: `${yearNum}-${String(monthNum).padStart(2, "0")}`,
            summary,
        });
    } catch (error) {
        console.error("getMonthlySummary error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching monthly summary",
            error: error.message,
        });
    }
};