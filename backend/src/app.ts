import express, { Request, Response, Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "@/middlewares/errorHandler.js";
import authRoutes from "@/modules/auth/auth.route.js";
import orgRoutes from "@/modules/organizations/org.route.js";
import projectRoutes from "@/modules/projects/projects.routes.js";
import userRoutes from "@/modules/users/users.route.js";
import { globalLimiter } from "@/middlewares/rateLimitar.js";

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logging
app.use(morgan("dev"));

// Rate limiting
app.use(globalLimiter);
app.use("/public", express.static("public"));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organizations", orgRoutes);
app.use("/api/v1/organizations", projectRoutes);
app.use("/api/v1/users", userRoutes);

// Health check — should always be present
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    app: "ProjectManagement",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

export default app;
