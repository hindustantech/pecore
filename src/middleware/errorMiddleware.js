
import { logger } from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
    logger.error(`${err.name}: ${err.message}`, { stack: err.stack });
    
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
};
