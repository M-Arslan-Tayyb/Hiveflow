import redis from "@/config/redis.js";
import logger from "@/config/logger.js";

/**
 * Retrieve a value from cache. Returns null if key doesn't exist or on error.
 */
const getCache = async (key: string): Promise<unknown> => {
  try {
    const value = await redis.get(key);
    if (value === null) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }
    const parsed = JSON.parse(value);
    logger.debug(`Cache hit: ${key}`);
    return parsed;
  } catch (error) {
    const err = error as Error;
    logger.error(`Cache get error for key "${key}": ${err.message}`, { stack: err.stack });
    return null;
  }
};

/**
 * Store a value in cache with optional TTL (in seconds).
 */
const setCache = async (key: string, value: unknown, ttlSeconds?: number): Promise<boolean> => {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
    logger.debug(`Cache set: ${key}${ttlSeconds ? ` (TTL: ${ttlSeconds}s)` : ""}`);
    return true;
  } catch (error) {
    const err = error as Error;
    logger.error(`Cache set error for key "${key}": ${err.message}`, { stack: err.stack });
    return false;
  }
};

/**
 * Delete a single key from cache.
 */
const deleteCache = async (key: string): Promise<boolean> => {
  try {
    await redis.del(key);
    logger.debug(`Cache deleted: ${key}`);
    return true;
  } catch (error) {
    const err = error as Error;
    logger.error(`Cache delete error for key "${key}": ${err.message}`, { stack: err.stack });
    return false;
  }
};

/**
 * Delete multiple keys matching a glob pattern (e.g., "user:*", "session:*:data").
 */
const deleteCachePattern = async (pattern: string): Promise<boolean> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      logger.debug(`Cache pattern match found 0 keys: ${pattern}`);
      return true;
    }
    await redis.del(...keys);
    logger.debug(`Cache pattern deleted ${keys.length} keys: ${pattern}`);
    return true;
  } catch (error) {
    const err = error as Error;
    logger.error(`Cache delete pattern error for "${pattern}": ${err.message}`, { stack: err.stack });
    return false;
  }
};

export { getCache, setCache, deleteCache, deleteCachePattern };
