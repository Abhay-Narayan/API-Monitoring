import { Router } from "express";
import { AlertController } from "./handlers/AlertController";
import { asyncHandler } from "@/shared/middleware/errorHandler";
import { authenticate } from "@/shared/middleware/auth";
import { apiRateLimiter } from "@/shared/middleware/rateLimiter";
import { validateBody, validateQuery } from "@/shared/middleware/dtoValidation";
import {
  CreateAlertRequestDto,
  UpdateAlertRequestDto,
  GetAlertsQueryDto,
  TestAlertRequestDto,
  BulkDeleteAlertsRequestDto,
} from "@/dto/alerts";

const router = Router();

// All alert routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

// Monitor-specific alert routes
router.get(
  "/monitor/:monitorId",
  asyncHandler(AlertController.getMonitorAlerts)
);

router.post(
  "/monitor/:monitorId",
  validateBody(CreateAlertRequestDto.omit({ monitor_id: true })),
  asyncHandler(AlertController.createAlert)
);

router.get(
  "/monitor/:monitorId/logs",
  asyncHandler(AlertController.getAlertLogs)
);

// Alert management routes
router.put(
  "/:alertId",
  validateBody(UpdateAlertRequestDto),
  asyncHandler(AlertController.updateAlert)
);

router.delete("/:alertId", asyncHandler(AlertController.deleteAlert));

// Alert testing and configuration
router.post("/:alertId/test", asyncHandler(AlertController.testAlert));

router.get(
  "/config/email/test",
  asyncHandler(AlertController.testEmailConfiguration)
);

export { router as alertRoutes };
