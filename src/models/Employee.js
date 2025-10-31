import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const employeeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        
        email: {
            type: String,
            unique: true,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },
        department: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            default: "Patna, Bihar",
        },
        role: {
            type: String,
            enum: ["employee", "admin"],
            default: "employee",
        },
    },
    { timestamps: true }
);

// 🔐 Hash password before saving
employeeSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 🔑 Generate JWT Token
employeeSchema.methods.generateJWT = function () {
    return jwt.sign(
        { id: this._id, role: this.role, email: this.email },
        process.env.JWT_SECRET,
        
    );
};

// 🔍 Compare password
employeeSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Employee", employeeSchema);
