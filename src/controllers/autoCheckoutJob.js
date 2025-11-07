import cron from "node-cron";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";

// Auto Check-Out at 12:00 AM IST
cron.schedule("0 0 * * *", async () => {
    console.log("🕛 Running Auto Check-Out Job...");

    try {
        const now = new Date();

        // Calculate yesterday's date (because job runs at 00:00)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        // Find all attendance records from yesterday where last session has no checkOut
        const records = await Attendance.find({
            date: yesterday,
            "sessions.checkOut": { $exists: false },
        });

        for (const record of records) {
            const lastSession = record.sessions[record.sessions.length - 1];
            if (lastSession && !lastSession.checkOut) {
                lastSession.checkOut = new Date(yesterday.setHours(23, 59, 59, 999));
                lastSession.checkOutStatus = "Auto Check-Out";
                lastSession.checkOutLocation = {
                    type: "Point",
                    coordinates: [
                        lastSession.checkInLocation?.coordinates[0] || 0,
                        lastSession.checkInLocation?.coordinates[1] || 0,
                    ],
                };
            }
            await record.save();
        }

        console.log(`✅ Auto Check-Out complete for ${records.length} employees`);
    } catch (error) {
        console.error("❌ Auto Check-Out job failed:", error.message);
    }
});
