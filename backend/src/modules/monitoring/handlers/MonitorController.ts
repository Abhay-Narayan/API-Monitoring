import { Request, Response } from "express";
import { MonitorService } from "../services/MonitorService";
import { MonitoringService } from "../services/MonitoringService";
import { logger } from "@/shared/utils/logger";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/shared/middleware/dtoValidation";
import type {
  CreateMonitorRequest,
  UpdateMonitorRequest,
  GetMonitorsQuery,
  GetMonitorChecksQuery,
  BulkToggleMonitorsRequest,
  BulkDeleteMonitorsRequest,
  MonitorDetailResponse,
  PaginatedMonitorsResponse,
  MonitorStatsDetailResponse,
  MonitorChecksResponse,
  TestMonitorResponse,
  BulkOperationResponse,
} from "@/dto/monitoring";
import type { ApiResponse } from "@/dto/common";
import type { Monitor, MonitorStats, MonitorCheck } from "@/types";

// Controller class with DTO-typed methods

export class MonitorController {
  static async getMonitors(
    req: Request,
    res: Response<ApiResponse<PaginatedMonitorsResponse>>
  ): Promise<void> {
    const userId = req.userId!;
    const { page, limit, search, active_only } = req.query as any;

    const result = await MonitorService.getMonitors(userId, {
      page,
      limit,
      search,
      activeOnly: active_only,
    });

    res.json(
      paginatedResponse(
        result.items,
        result.total,
        result.page,
        result.limit,
        "Monitors retrieved successfully"
      )
    );
  }

  static async createMonitor(
    req: Request<{}, ApiResponse<Monitor>, CreateMonitorRequest>,
    res: Response<ApiResponse<Monitor>>
  ): Promise<void> {
    const userId = req.userId!;
    const monitorData = req.body;

    logger.info("Creating monitor", {
      userId,
      name: monitorData.name,
      url: monitorData.url,
    });

    const monitor = await MonitorService.createMonitor(userId, monitorData);

    // Add to monitoring scheduler
    const monitoringService = MonitoringService.getInstance();
    await monitoringService.addMonitor(monitor);

    logger.info("Monitor created successfully", {
      monitorId: monitor.id,
      userId,
      name: monitor.name,
    });

    res
      .status(201)
      .json(successResponse(monitor, "Monitor created successfully"));
  }

  static async getMonitor(
    req: Request,
    res: Response<ApiResponse<Monitor & { stats: MonitorStats }>>
  ): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    const monitor = await MonitorService.getMonitorWithStats(userId, id);

    res.json(successResponse(monitor, "Monitor retrieved successfully"));
  }

  static async updateMonitor(
    req: Request<{ id: string }, ApiResponse<Monitor>, UpdateMonitorRequest>,
    res: Response<ApiResponse<Monitor>>
  ): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;
    const updates = req.body;

    logger.info("Updating monitor", { userId, monitorId: id, updates });

    const monitor = await MonitorService.updateMonitor(userId, id, updates);

    // Update in monitoring scheduler
    const monitoringService = MonitoringService.getInstance();
    await monitoringService.updateMonitor(monitor);

    logger.info("Monitor updated successfully", {
      monitorId: id,
      userId,
    });

    res.json(successResponse(monitor, "Monitor updated successfully"));
  }

  static async deleteMonitor(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    logger.info("Deleting monitor", { userId, monitorId: id });

    await MonitorService.deleteMonitor(userId, id);

    // Remove from monitoring scheduler
    const monitoringService = MonitoringService.getInstance();
    await monitoringService.removeMonitor(id);

    logger.info("Monitor deleted successfully", {
      monitorId: id,
      userId,
    });

    res.json(successResponse(null, "Monitor deleted successfully"));
  }

  static async getMonitorStats(
    req: Request,
    res: Response<ApiResponse<MonitorStats>>
  ): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    const stats = await MonitorService.getMonitorStats(userId, id);

    res.json(successResponse(stats, "Monitor stats retrieved successfully"));
  }

  static async getMonitorChecks(
    req: Request,
    res: Response<ApiResponse<MonitorCheck[]>>
  ): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;
    const { limit, hours } = req.query as any;

    const checks = await MonitorService.getMonitorChecks(userId, id, {
      limit,
      hours,
    });

    res.json(successResponse(checks, "Monitor checks retrieved successfully"));
  }

  static async testMonitor(
    req: Request,
    res: Response<ApiResponse<MonitorCheck>>
  ): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    logger.info("Testing monitor", { userId, monitorId: id });

    const result = await MonitorService.testMonitor(userId, id);

    res.json(successResponse(result, "Monitor test completed"));
  }

  static async toggleMonitor(
    req: Request,
    res: Response<ApiResponse<Monitor>>
  ): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    const monitor = await MonitorService.toggleMonitor(userId, id);

    // Update in monitoring scheduler
    const monitoringService = MonitoringService.getInstance();
    if (monitor.is_active) {
      await monitoringService.addMonitor(monitor);
    } else {
      await monitoringService.removeMonitor(id);
    }

    logger.info("Monitor toggled", {
      monitorId: id,
      userId,
      isActive: monitor.is_active,
    });

    res.json(
      successResponse(
        monitor,
        `Monitor ${
          monitor.is_active ? "activated" : "deactivated"
        } successfully`
      )
    );
  }

  static async bulkToggleMonitors(
    req: Request,
    res: Response<ApiResponse<{ updated: number }>>
  ): Promise<void> {
    const userId = req.userId!;
    const { monitor_ids, is_active } = req.body;

    logger.info("Bulk toggle monitors", {
      userId,
      count: monitor_ids.length,
      isActive: is_active,
    });

    const result = await MonitorService.bulkToggleMonitors(
      userId,
      monitor_ids,
      is_active
    );

    // Update monitoring scheduler for all affected monitors
    const monitoringService = MonitoringService.getInstance();

    if (is_active) {
      // Get updated monitors and add them to scheduler
      const monitors = await MonitorService.getMonitorsByIds(
        userId,
        monitor_ids
      );
      for (const monitor of monitors) {
        await monitoringService.addMonitor(monitor);
      }
    } else {
      // Remove from scheduler
      for (const monitorId of monitor_ids) {
        await monitoringService.removeMonitor(monitorId);
      }
    }

    res.json(
      successResponse(
        { updated: result },
        `${result} monitors ${
          is_active ? "activated" : "deactivated"
        } successfully`
      )
    );
  }

  static async bulkDeleteMonitors(
    req: Request,
    res: Response<ApiResponse<{ deleted: number }>>
  ): Promise<void> {
    const userId = req.userId!;
    const { monitor_ids } = req.body;

    logger.info("Bulk delete monitors", {
      userId,
      count: monitor_ids.length,
    });

    const result = await MonitorService.bulkDeleteMonitors(userId, monitor_ids);

    // Remove from monitoring scheduler
    const monitoringService = MonitoringService.getInstance();
    for (const monitorId of monitor_ids) {
      await monitoringService.removeMonitor(monitorId);
    }

    res.json(
      successResponse(
        { deleted: result },
        `${result} monitors deleted successfully`
      )
    );
  }
}
