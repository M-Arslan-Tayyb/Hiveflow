import app from "@/app.js";
import config from "@/config/env.js";
import prisma from "@/config/db.js";
import logger from "@/config/logger.js";

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");

    app.listen(config.port, () => {
      logger.info(`[${config.appName}] Server running on port ${config.port} — env: ${config.env}`);
    });
  } catch (error) {
    const err = error as Error;
    logger.error(`Server failed to start: ${err.message}`, { stack: err.stack });
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
