import mongoose from "mongoose";

const enquerySchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },

        email: {
            type: String,

        },
        message: {
            type: String,

        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Optional: prevent exact duplicates from flooding the DB
enquerySchema.index({ email: 1, message: 1 }, { unique: false });

export default mongoose.model("Enquery", enquerySchema);

