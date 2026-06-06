import { ErrorRequestHandler } from "express";
import ApiError from "@/utils/ApiError.js";

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
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: "Already exists",
      data: null,
    });
  }

  if (e.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Invalid token",
      data: null,
    });
  }

  if (e.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Token expired",
      data: null,
    });
  }

  console.error("UNHANDLED ERROR:", err);
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal server error",
    data: null,
  });
};

export default errorHandler;
