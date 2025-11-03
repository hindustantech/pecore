import Attendance from "../models/Attendance.js";
import mongoose from "mongoose";

import Employee from "../models/Employee.js";
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
        const { checkType, latitude, longitude, locationStatus ,comment} = req.body;
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
        // const distance = haversineDistance(
        //     OFFICE.latitude,
        //     OFFICE.longitude,
        //     lat,
        //     lng
        // );

        // if (distance > MAX_DISTANCE_METERS) {
        //     return res.status(403).json({
        //         success: false,
        //         message: `Too far: ${Math.round(distance)}m from office. Must be within 200m.`,
        //     });
        // }

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
                comment,
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




// GET EMPLOYEE ATTENDANCE LOGS (Paginated)
export const getAttendanceByEmployeeAdmin = async (req, res) => {
    try {
        const employeeId = req.query.employeeId;
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
export const getDailyReportAdmin = async (req, res) => {
    try {
        const employeeId = req.query.employeeId;

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
export const getMonthlySummaryAdmin = async (req, res) => {
    try {
        const employeeId = req.query.employeeId;
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








// Get Attendance Report Controller
export const getAttendanceReport = async (req, res) => {
    try {
        const {
            viewMode = 'daily',
            employee = 'all',
            dateRange,
            page = 1,
            limit = 10
        } = req.query;

        // Build query object
        const query = {};

        if (employee !== 'all') {
            query.employee = employee;
        }

        if (dateRange && dateRange.start && dateRange.end) {
            query.date = {
                $gte: new Date(dateRange.start),
                $lte: new Date(dateRange.end)
            };
        }

        // Fetch attendance records
        const attendanceRecords = await Attendance.find(query)
            .populate('employee', 'name email department')
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Format records for frontend
        const formattedRecords = attendanceRecords.map(record => {
            const session = record.sessions[0]; // Assuming first session for daily view

            return {
                id:record._id,
                date: record.date.toISOString().split('T')[0],
                employee: record.employee.name,
                checkIn: session?.checkIn ? formatTime(session.checkIn) : '--',
                checkOut: session?.checkOut ? formatTime(session.checkOut) : '--',
                hours: calculateHours(session?.checkIn, session?.checkOut),
                location: getLocationString(session?.checkInLocation),
                status: determineStatus(session),
                actions: {
                    viewLog: true,
                    viewImage: !!(session?.checkInSelfie || session?.checkOutSelfie)
                }
            };
        });

        // Get total count for pagination
        const total = await Attendance.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                records: formattedRecords,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching attendance report:', error);
        res.status(500).json({
            success: false,
            data: {
                records: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    pages: 0
                }
            },
            message: 'Error fetching attendance report'
        });
    }
};

// Export Report Controller
export const exportAttendanceReport = async (req, res) => {
    try {
        const { viewMode, employee, dateRange } = req.query;

        // Build query object
        const query = {};

        if (employee && employee !== 'all') {
            query.employee = employee;
        }

        if (dateRange && dateRange.start && dateRange.end) {
            query.date = {
                $gte: new Date(dateRange.start),
                $lte: new Date(dateRange.end)
            };
        }

        // Fetch data for export
        const attendanceRecords = await Attendance.find(query)
            .populate('employee', 'name email department position')
            .sort({ date: -1 });

        // Generate CSV data
        const csvData = generateCSV(attendanceRecords);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${Date.now()}.csv`);
        res.send(csvData);

    } catch (error) {
        console.error('Error exporting attendance report:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting attendance report'
        });
    }
};

// Get single attendance log with images
export const getAttendanceLog = async (req, res) => {
    try {
        const { id } = req.params;

        const attendance = await Attendance.findById(id)
            .populate('employee', 'name email department position');

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: attendance
        });

    } catch (error) {
        console.error('Error fetching attendance log:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance log'
        });
    }
};

// Helper Functions
const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '--';

    const diffMs = checkOut.getTime() - checkIn.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0 && minutes > 0) {
        return `${minutes}m`;
    } else if (minutes > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${hours}h`;
    }
};

const getLocationString = (location) => {
    if (!location) return 'Remote';

    // You can add logic here to determine office floor based on coordinates
    // For now, returning a default value
    return 'Office Floor 2';
};

const determineStatus = (session) => {
    if (!session?.checkIn) return 'absent';
    if (!session?.checkOut) return 'present';
    return 'present';
};

const generateCSV = (attendanceRecords) => {
    const headers = ['Date', 'Employee', 'Check In', 'Check Out', 'Hours', 'Location', 'Status'];

    let csv = headers.join(',') + '\n';

    attendanceRecords.forEach(record => {
        const session = record.sessions[0];
        const row = [
            record.date.toISOString().split('T')[0],
            `"${record.employee.name}"`,
            session?.checkIn ? formatTime(session.checkIn) : '--',
            session?.checkOut ? formatTime(session.checkOut) : '--',
            calculateHours(session?.checkIn, session?.checkOut),
            getLocationString(session?.checkInLocation),
            determineStatus(session)
        ];

        csv += row.join(',') + '\n';
    });

    return csv;
};