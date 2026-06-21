import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import config from "@/config/env.js";

const isDev = config.env === "development";

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`
      : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

const rotateOptions = {
  datePattern: "YYYY-MM-DD",
  maxAge: "7d",
  zippedArchive: false,
};

const transports: winston.transport[] = [
  new DailyRotateFile({
    ...rotateOptions,
    filename: "logs/combined-%DATE%.log",
    level: "debug",
  }),
  new DailyRotateFile({
    ...rotateOptions,
    filename: "logs/error-%DATE%.log",
    level: "error",
  }),
];

if (isDev) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

const logger = winston.createLogger({
  level: isDev ? "debug" : "warn",
  format: fileFormat,
  transports,
});

export default logger;
