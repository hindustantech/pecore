
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

export const generateAccessToken = (user) => {
    try {
        return jwt.sign(
            { id: user._id, email: user.email },
            config.jwtSecret,
            { expiresIn: "15m" }
        );
    } catch (error) {
        logger.error("Error generating access token:", error);
        throw error;
    }
};

export const generateRefreshToken = (user) => {
    try {
        return jwt.sign(
            { id: user._id },
            config.jwtSecret,
            { expiresIn: "7d" }
        );
    } catch (error) {
        logger.error("Error generating refresh token:", error);
        throw error;
    }
};

export const generateOTP = () => {
    return randomBytes(3).toString("hex").toUpperCase();
};

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        logger.error("Error verifying refresh token:", error);
        throw error;
    }
};
