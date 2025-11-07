import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
/**
 * Get dashboard statistics and recent attendance
 */
export const getDashboardData = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get total employees count
        const totalEmployees = await Employee.countDocuments({ isActive: true });

        // Get today's attendance records
        const todayAttendance = await Attendance.find({
            date: {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('employee', 'name email image department position location');

        // Calculate statistics
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        const recentAttendance = [];

        todayAttendance.forEach(record => {
            const hasCheckIn = record.sessions.some(session => session.checkIn);
            const hasCheckOut = record.sessions.some(session => session.checkOut);

            if (hasCheckIn) {
                // Check if employee was late (check-in after 9:30 AM)
                const checkInSession = record.sessions.find(session => session.checkIn);
                if (checkInSession && checkInSession.checkIn) {
                    const checkInTime = new Date(checkInSession.checkIn);
                    const lateThreshold = new Date(checkInTime);
                    lateThreshold.setHours(9, 30, 0, 0); // 9:30 AM

                    if (checkInTime > lateThreshold) {
                        lateCount++;
                    }
                }
                presentCount++;

                // Prepare data for recent attendance table
                const employee = record.employee;
                const session = record.sessions[record.sessions.length - 1]; // Get latest session

                recentAttendance.push({
                    id: record._id,
                    name: employee.name,
                    checkIn: session.checkIn ? formatTime(session.checkIn) : "-",
                    checkOut: session.checkOut ? formatTime(session.checkOut) : "-",
                    // checkInSelfie,checkOutLocation
                    checkInSelfie: session.checkInSelfie,
                    checkOutLocation: session.checkOutLocation,

                    status: hasCheckIn ? (session.checkInStatus === 'late' ? 'late' : 'present') : 'absent',
                    location: session.checkInLocation ? 'Office' : (session.checkIn ? 'Remote' : '-'),
                    image: employee.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.name}`,
                    employeeId: employee._id
                });
            } else {
                absentCount++;

                // Add absent employees to recent attendance
                const employee = record.employee;
                recentAttendance.push({
                    id: record._id,
                    name: employee.name,
                    checkIn: "-",
                    checkOut: "-",
                    status: "absent",
                    location: "-",
                    image: employee.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.name}`,
                    employeeId: employee._id
                });
            }
        });

        // Calculate trends (you might want to compare with previous day)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayAttendance = await Attendance.countDocuments({
            date: {
                $gte: yesterday,
                $lt: today
            },
            'sessions.checkIn': { $exists: true }
        });

        const presentTrend = yesterdayAttendance > 0 ?
            `${(((presentCount - yesterdayAttendance) / yesterdayAttendance) * 100).toFixed(1)}% from yesterday` :
            "No data for yesterday";

        // Get employee growth (last month vs current month)
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        const currentMonthEmployees = await Employee.countDocuments({
            createdAt: { $gte: currentMonthStart },
            isActive: true
        });

        const lastMonthEmployees = await Employee.countDocuments({
            createdAt: {
                $gte: lastMonthStart,
                $lt: lastMonthEnd
            },
            isActive: true
        });

        const employeeTrend = lastMonthEmployees > 0 ?
            `${(((totalEmployees - lastMonthEmployees) / lastMonthEmployees) * 100).toFixed(1)}% from last month` :
            "New system";

        // Prepare response data
        const dashboardData = {
            stats: {
                totalEmployees,
                presentToday: presentCount,
                absentToday: absentCount,
                lateArrivals: lateCount,
                trends: {
                    employees: employeeTrend,
                    present: presentTrend,
                    absent: `${absentCount > 0 ? '-' : ''}${absentCount} from yesterday`,
                    late: "Same as yesterday" // You can implement proper comparison
                }
            },
            recentAttendance: recentAttendance.slice(0, 10) // Limit to 10 records
        };

        res.status(200).json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

/**
 * Get detailed attendance analytics
 */
export const getAttendanceAnalytics = async (req, res) => {
    try {
        const { period = 'week' } = req.query; // week, month, year
        const today = new Date();

        let startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            default:
                startDate.setDate(today.getDate() - 7);
        }

        // Get attendance data for the period
        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: today }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" }
                    },
                    present: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $size: "$sessions" }, 0] },
                                1,
                                0
                            ]
                        }
                    },
                    total: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                period,
                attendanceData
            }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics data',
            error: error.message
        });
    }
};

/**
 * Get employee location distribution
 */
export const getLocationDistribution = async (req, res) => {
    try {
        const locationData = await Employee.aggregate([
            {
                $group: {
                    _id: "$location",
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    _id: { $ne: null, $ne: "" }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: locationData
        });

    } catch (error) {
        console.error('Location distribution error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching location data',
            error: error.message
        });
    }
};

// Helper function to format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}