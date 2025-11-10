import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true,
            validate: {
                validator: (v) => /^\+?[\d\s-]{10,}$/.test(v),
                message: (props) => `${props.value} is not a valid phone number!`,
            },
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// 🔒 Hash password before saving
adminSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// 🔑 Generate JWT token
adminSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);
    this.tokens = [...this.tokens, { token }];
    await this.save();
    return token;
};

// 🔍 Static method: validate login credentials
adminSchema.statics.findByCredentials = async function (phoneNumber, password) {
    const admin = await this.findOne({ phoneNumber });
    if (!admin) {
        throw new Error("Invalid login credentials");
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        throw new Error("Invalid login credentials");
    }

    return admin;
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
