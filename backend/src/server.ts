import app from "@/app.js";
import config from "@/config/env.js";
import prisma from "@/config/db.js";

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    app.listen(config.port, () => {
      console.log(`[${config.appName}] Server running on port ${config.port}`);
      console.log(`Environment: ${config.env}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
