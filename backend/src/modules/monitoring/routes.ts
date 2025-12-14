import { Router } from "express";
import { MonitorController } from "./handlers/MonitorController";
import { asyncHandler } from "@/shared/middleware/errorHandler";
import { authenticate } from "@/shared/middleware/auth";
import { apiRateLimiter } from "@/shared/middleware/rateLimiter";
import { validateBody, validateQuery } from "@/shared/middleware/dtoValidation";
import {
  CreateMonitorRequestDto,
  UpdateMonitorRequestDto,
  GetMonitorsQueryDto,
  GetMonitorChecksQueryDto,
  BulkToggleMonitorsRequestDto,
  BulkDeleteMonitorsRequestDto,
} from "@/dto/monitoring";

const router = Router();

// All monitoring routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

// Routes with DTO validation

// Monitor CRUD routes
router.get(
  "/",
  validateQuery(GetMonitorsQueryDto),
  asyncHandler(MonitorController.getMonitors)
);

router.post(
  "/",
  validateBody(CreateMonitorRequestDto),
  asyncHandler(MonitorController.createMonitor)
);

router.get("/:id", asyncHandler(MonitorController.getMonitor));

router.put(
  "/:id",
  validateBody(UpdateMonitorRequestDto),
  asyncHandler(MonitorController.updateMonitor)
);

router.delete("/:id", asyncHandler(MonitorController.deleteMonitor));

// Monitor stats and checks
router.get("/:id/stats", asyncHandler(MonitorController.getMonitorStats));

router.get(
  "/:id/checks",
  validateQuery(GetMonitorChecksQueryDto),
  asyncHandler(MonitorController.getMonitorChecks)
);

// Monitor operations
router.post("/:id/test", asyncHandler(MonitorController.testMonitor));

router.post("/:id/toggle", asyncHandler(MonitorController.toggleMonitor));

// Bulk operations
router.post(
  "/bulk/toggle",
  validateBody(BulkToggleMonitorsRequestDto),
  asyncHandler(MonitorController.bulkToggleMonitors)
);

router.delete(
  "/bulk/delete",
  validateBody(BulkDeleteMonitorsRequestDto),
  asyncHandler(MonitorController.bulkDeleteMonitors)
);

export { router as monitoringRoutes };
