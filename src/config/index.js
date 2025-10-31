
import dotenv from "dotenv";

dotenv.config();

export const config = {
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development"
};
