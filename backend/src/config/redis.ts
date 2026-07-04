import { Redis } from "ioredis";
import logger from "@/config/logger.js";
import config from "@/config/env.js";

const redis = new Redis(config.redis.url || "redis://localhost:6379", {
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  logger.info("Redis client connected");
});

redis.on("ready", () => {
  logger.info("Redis client ready");
});

redis.on("error", (err: Error) => {
  logger.error(`Redis error: ${err.message}`, { stack: err.stack });
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

redis.on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

export default redis;
