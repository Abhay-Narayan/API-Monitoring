import { Request, Response } from "express";
import { AlertService } from "../services/AlertService";
import { logger } from "@/shared/utils/logger";
import {
  successResponse,
  errorResponse,
} from "@/shared/middleware/dtoValidation";
import type { CreateAlertRequest, UpdateAlertRequest } from "@/dto/alerts";
import type { ApiResponse } from "@/dto/common";
import type { Alert, AlertLog } from "@/types";

export class AlertController {
  static async getMonitorAlerts(
    req: Request,
    res: Response<ApiResponse<Alert[]>>
  ): Promise<void> {
    const userId = req.userId!;
    const { monitorId } = req.params;

    try {
      // Verify user owns the monitor (done via RLS policy)
      const alertService = AlertService.getInstance();
      const alerts = await alertService.getMonitorAlerts(monitorId);

      res.json(successResponse(alerts, "Alerts retrieved successfully"));
    } catch (error: any) {
      logger.error("Failed to get monitor alerts", error, {
        userId,
        monitorId,
      });
      res.status(500).json(errorResponse("Failed to retrieve alerts"));
    }
  }

  static async createAlert(
    req: Request<{ monitorId: string }, ApiResponse<Alert>, CreateAlertRequest>,
    res: Response<ApiResponse<Alert>>
  ): Promise<void> {
    const userId = req.userId!;
    const { monitorId } = req.params;
    const { type, target } = req.body;

    try {
      logger.info("Creating alert", { userId, monitorId, type, target });

      const alertService = AlertService.getInstance();
      const alert = await alertService.createAlert(monitorId, type, target);

      logger.info("Alert created successfully", {
        alertId: alert.id,
        userId,
        monitorId,
        type,
      });

      res
        .status(201)
        .json(successResponse(alert, "Alert created successfully"));
    } catch (error: any) {
      logger.error("Failed to create alert", error, { userId, monitorId });
      res.status(500).json(errorResponse("Failed to create alert"));
    }
  }

  static async updateAlert(
    req: Request<{ alertId: string }, ApiResponse<Alert>, UpdateAlertRequest>,
    res: Response<ApiResponse<Alert>>
  ): Promise<void> {
    const userId = req.userId!;
    const { alertId } = req.params;
    const updates = req.body;

    try {
      logger.info("Updating alert", { userId, alertId, updates });

      const alertService = AlertService.getInstance();
      const alert = await alertService.updateAlert(alertId, updates);

      logger.info("Alert updated successfully", { alertId, userId });

      res.json(successResponse(alert, "Alert updated successfully"));
    } catch (error: any) {
      logger.error("Failed to update alert", error, { userId, alertId });
      res.status(500).json(errorResponse("Failed to update alert"));
    }
  }

  static async deleteAlert(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    const userId = req.userId!;
    const { alertId } = req.params;

    try {
      logger.info("Deleting alert", { userId, alertId });

      const alertService = AlertService.getInstance();
      await alertService.deleteAlert(alertId);

      logger.info("Alert deleted successfully", { alertId, userId });

      res.json(successResponse(null, "Alert deleted successfully"));
    } catch (error: any) {
      logger.error("Failed to delete alert", error, { userId, alertId });
      res.status(500).json(errorResponse("Failed to delete alert"));
    }
  }

  static async getAlertLogs(
    req: Request,
    res: Response<ApiResponse<AlertLog[]>>
  ): Promise<void> {
    const userId = req.userId!;
    const { monitorId } = req.params;
    const { limit = 50, hours = 24 } = req.query as any;

    try {
      const alertService = AlertService.getInstance();
      const logs = await alertService.getAlertLogs(monitorId, {
        limit,
        hours,
      });

      res.json(successResponse(logs, "Alert logs retrieved successfully"));
    } catch (error: any) {
      logger.error("Failed to get alert logs", error, { userId, monitorId });
      res.status(500).json(errorResponse("Failed to retrieve alert logs"));
    }
  }

  static async testEmailConfiguration(
    req: Request,
    res: Response<ApiResponse<{ emailConfigValid: boolean }>>
  ): Promise<void> {
    const userId = req.userId!;

    try {
      logger.info("Testing email configuration", { userId });

      const alertService = AlertService.getInstance();
      const isValid = await alertService.testEmailConfiguration();

      res.json(
        successResponse(
          { emailConfigValid: isValid },
          isValid
            ? "Email configuration is valid"
            : "Email configuration has issues"
        )
      );
    } catch (error: any) {
      logger.error("Failed to test email configuration", error, { userId });
      res.status(500).json(errorResponse("Failed to test email configuration"));
    }
  }

  static async testAlert(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    const userId = req.userId!;
    const { alertId } = req.params;

    try {
      logger.info("Testing alert", { userId, alertId });

      const alertService = AlertService.getInstance();
      await alertService.testAlert(alertId);

      res.json(successResponse(null, "Test alert sent successfully"));
    } catch (error: any) {
      logger.error("Failed to test alert", error, { userId, alertId });
      res.status(500).json(errorResponse("Failed to send test alert"));
    }
  }
}
