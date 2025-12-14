// Path aliases are registered via -r flag in package.json start script

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { config } from "@/config/environment";
import { errorHandler } from "@/shared/middleware/errorHandler";
import { rateLimiter } from "@/shared/middleware/rateLimiter";
import { setupRoutes } from "@/shared/routes";
import { MonitoringService } from "@/modules/monitoring/services/MonitoringService";
import { AlertService } from "@/modules/alerts/services/AlertService";
import { logger } from "@/shared/utils/logger";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Request parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan("combined"));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Setup all routes
setupRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(
    `🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`
  );
  logger.info(`📊 Frontend URL: ${config.frontendUrl}`);
});

// Initialize monitoring services
const monitoringService = MonitoringService.getInstance();
const alertService = AlertService.getInstance();

// Start monitoring scheduler
monitoringService.startScheduler();
logger.info("✅ Monitoring scheduler started");

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  monitoringService.stopScheduler();
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  monitoringService.stopScheduler();
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

export default app;
