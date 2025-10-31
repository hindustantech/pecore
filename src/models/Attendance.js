import mongoose from "mongoose";

// GeoJSON Point Schema
const pointSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
            default: "Point",
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
    },
    { _id: false }
);

// Session Sub-document
const sessionSchema = new mongoose.Schema(
    {
        checkIn: { type: Date },
        checkInSelfie: { type: String },
        checkInLocation: { type: pointSchema },
        checkInStatus: { type: String, trim: true },

        checkOut: { type: Date },
        checkOutSelfie: { type: String },
        checkOutLocation: { type: pointSchema },
        checkOutStatus: { type: String, trim: true },
    },
    { _id: false }
);

// Main Attendance Schema
const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        sessions: [sessionSchema],
    },
    {
        timestamps: true,
    }
);

// Indexes
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ "sessions.checkInLocation": "2dsphere" });
attendanceSchema.index({ "sessions.checkOutLocation": "2dsphere" });

export default mongoose.model("Attendance", attendanceSchema);