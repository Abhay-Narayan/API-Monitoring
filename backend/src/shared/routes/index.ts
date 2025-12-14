import { Application } from "express";
import { authRoutes } from "@/modules/auth/routes";
import { monitoringRoutes } from "@/modules/monitoring/routes";
import { alertRoutes } from "@/modules/alerts/routes";
import { dashboardRoutes } from "./dashboardRoutes";
import { notFoundHandler } from "@/shared/middleware/errorHandler";

export function setupRoutes(app: Application): void {
  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/monitors", monitoringRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // Health and status routes
  app.get("/api/status", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // 404 handler for unmatched API routes
  app.use("/api/*", notFoundHandler);
}
