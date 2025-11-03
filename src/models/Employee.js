// models/Employee.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const employeeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            index: true
        },
        email: {
            type: String,
            unique: true,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            index: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },
        phone: {
            type: String,
            trim: true,
        },
        department: {
            type: String,
            trim: true,
            index: true
        },
        position: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            default: "Patna, Bihar",
        },
        joinDate: {
            type: Date,
            default: Date.now,
        },
        image: {
            type: String,
            default: ""
        },
        role: {
            type: String,
            enum: ["employee", "admin"],
            default: "employee",
        },
        isActive: {
            type: Boolean,
            default: true,
        }
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

// Method to get public profile (without password)
employeeSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export default mongoose.model("Employee", employeeSchema);