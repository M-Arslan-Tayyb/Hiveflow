import { ErrorRequestHandler } from "express";
import ApiError from "@/utils/ApiError.js";
import logger from "@/config/logger.js";

interface PrismaLikeError {
  code?: string;
  name?: string;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      data: null,
    });
  }

  const e = err as PrismaLikeError;

  if (e.code === "P2002") {
    logger.warn("Prisma unique constraint violation (P2002)");
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: "Already exists",
      data: null,
    });
  }

  if (e.name === "JsonWebTokenError") {
    logger.warn("Invalid JWT token");
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Invalid token",
      data: null,
    });
  }

  if (e.name === "TokenExpiredError") {
    logger.warn("Expired JWT token");
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Token expired",
      data: null,
    });
  }

  const error = err as Error;
  logger.error(`UNHANDLED ERROR: ${error.message}`, { stack: error.stack });
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal server error",
    data: null,
  });
};

export default errorHandler;
