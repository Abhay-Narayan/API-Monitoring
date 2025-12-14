import { Router } from "express";
import { asyncHandler } from "@/shared/middleware/errorHandler";
import { authenticate } from "@/shared/middleware/auth";
import { DashboardController } from "../handlers/DashboardController";

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard overview
router.get("/overview", asyncHandler(DashboardController.getOverview));

// Recent activity
router.get("/activity", asyncHandler(DashboardController.getRecentActivity));

// System stats
router.get("/stats", asyncHandler(DashboardController.getSystemStats));

export { router as dashboardRoutes };
