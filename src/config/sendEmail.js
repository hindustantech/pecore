
import nodemailer from "nodemailer";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.emailUser,
        pass: config.emailPass
    }
});

export const sendOTP = async (to, otp) => {
    try {
        await transporter.sendMail({
            from: config.emailUser,
            to,
            subject: "Your OTP Code",
            text: `Your OTP code is: ${otp}. It expires in 10 minutes.`
        });
        logger.info(`OTP sent to ${to}`);
        return true;
    } catch (error) {
        logger.error("Error sending OTP:", error);
        return false;
    }
};
