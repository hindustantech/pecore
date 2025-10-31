
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw Object.assign(new Error("No token provided"), { statusCode: 401 });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await Employee.findById(decoded.id).select("-password");
        
        if (!user) {
            throw Object.assign(new Error("Invalid token"), { statusCode: 401 });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error("Authentication error:", error);
        next(error);
    }
};
