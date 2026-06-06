import rateLimit from "express-rate-limit";
// Global — applied to all routes
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests, please try again later.",
        data: null,
    },
});
// Auth — strict
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many attempts, please try again after 15 minutes.",
        data: null,
    },
});
// Register — looser
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many accounts created, please try again after an hour.",
        data: null,
    },
});
//# sourceMappingURL=rateLimitar.js.map