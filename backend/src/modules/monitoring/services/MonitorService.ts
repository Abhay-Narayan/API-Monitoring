import { supabase } from "@/config/database";
import { config } from "@/config/environment";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@/shared/middleware/errorHandler";
import { logger } from "@/shared/utils/logger";
import { MonitoringService } from "./MonitoringService";
import type {
  Monitor,
  MonitorStats,
  MonitorCheck,
  CreateMonitorRequest,
  UpdateMonitorRequest,
} from "@/types";

interface GetMonitorsOptions {
  page: number;
  limit: number;
  search?: string;
  activeOnly: boolean;
}

interface GetChecksOptions {
  limit: number;
  hours: number;
}

export class MonitorService {
  static async getMonitors(
    userId: string,
    options: GetMonitorsOptions
  ): Promise<{
    items: (Monitor & { stats: MonitorStats })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, search, activeOnly } = options;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("monitors")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,url.ilike.%${search}%`);
    }

    const {
      data: monitors,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch monitors", error);
      throw new Error("Failed to fetch monitors");
    }

    // Get stats for each monitor
    const monitorsWithStats = await Promise.all(
      (monitors || []).map(async (monitor) => {
        const stats = await this.getMonitorStats(userId, monitor.id);
        return { ...monitor, stats };
      })
    );

    return {
      items: monitorsWithStats,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  static async createMonitor(
    userId: string,
    data: CreateMonitorRequest
  ): Promise<Monitor> {
    // Check user's monitor limit
    const { count } = await supabase
      .from("monitors")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((count || 0) >= config.monitoring.maxChecksPerUser) {
      throw new ForbiddenError(
        `Monitor limit reached. Maximum ${config.monitoring.maxChecksPerUser} monitors allowed.`
      );
    }

    // Validate URL is reachable
    await this.validateMonitorUrl(
      data.url,
      data.method,
      data.headers,
      data.body,
      data.timeout_seconds
    );

    const { data: monitor, error } = await supabase
      .from("monitors")
      .insert([
        {
          user_id: userId,
          name: data.name,
          url: data.url,
          method: data.method,
          headers: data.headers,
          body: data.body,
          interval_minutes: data.interval_minutes,
          timeout_seconds: data.timeout_seconds || 30,
          expected_status_codes: data.expected_status_codes || [
            200, 201, 202, 204,
          ],
          keyword_validation: data.keyword_validation,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error || !monitor) {
      logger.error("Failed to create monitor", error);
      throw new Error("Failed to create monitor");
    }

    return monitor;
  }

  static async getMonitor(userId: string, monitorId: string): Promise<Monitor> {
    const { data: monitor, error } = await supabase
      .from("monitors")
      .select("*")
      .eq("id", monitorId)
      .eq("user_id", userId)
      .single();

    if (error || !monitor) {
      throw new NotFoundError("Monitor not found");
    }

    return monitor;
  }

  static async getMonitorWithStats(
    userId: string,
    monitorId: string
  ): Promise<Monitor & { stats: MonitorStats }> {
    const monitor = await this.getMonitor(userId, monitorId);
    const stats = await this.getMonitorStats(userId, monitorId);

    return { ...monitor, stats };
  }

  static async updateMonitor(
    userId: string,
    monitorId: string,
    updates: UpdateMonitorRequest
  ): Promise<Monitor> {
    // Get existing monitor to ensure user owns it
    await this.getMonitor(userId, monitorId);

    // If URL/method/headers/body changed, validate
    if (updates.url || updates.method || updates.headers || updates.body) {
      const currentMonitor = await this.getMonitor(userId, monitorId);
      const testUrl = updates.url || currentMonitor.url;
      const testMethod = updates.method || currentMonitor.method;
      const testHeaders =
        updates.headers !== undefined
          ? updates.headers
          : currentMonitor.headers;
      const testBody =
        updates.body !== undefined ? updates.body : currentMonitor.body;
      const testTimeout =
        updates.timeout_seconds || currentMonitor.timeout_seconds;

      await this.validateMonitorUrl(
        testUrl,
        testMethod,
        testHeaders,
        testBody,
        testTimeout
      );
    }

    const { data: monitor, error } = await supabase
      .from("monitors")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", monitorId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !monitor) {
      logger.error("Failed to update monitor", error);
      throw new Error("Failed to update monitor");
    }

    return monitor;
  }

  static async deleteMonitor(userId: string, monitorId: string): Promise<void> {
    // Ensure monitor exists and user owns it
    await this.getMonitor(userId, monitorId);

    const { error } = await supabase
      .from("monitors")
      .delete()
      .eq("id", monitorId)
      .eq("user_id", userId);

    if (error) {
      logger.error("Failed to delete monitor", error);
      throw new Error("Failed to delete monitor");
    }
  }

  static async getMonitorStats(
    userId: string,
    monitorId: string
  ): Promise<MonitorStats> {
    // Ensure user owns monitor
    await this.getMonitor(userId, monitorId);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get checks for last 24 hours
    const { data: checks24h } = await supabase
      .from("monitor_checks")
      .select("*")
      .eq("monitor_id", monitorId)
      .gte("checked_at", twentyFourHoursAgo.toISOString())
      .order("checked_at", { ascending: false });

    // Get checks for last 7 days
    const { data: checks7d } = await supabase
      .from("monitor_checks")
      .select("*")
      .eq("monitor_id", monitorId)
      .gte("checked_at", sevenDaysAgo.toISOString())
      .order("checked_at", { ascending: false });

    // Get total checks count
    const { count: totalChecks } = await supabase
      .from("monitor_checks")
      .select("*", { count: "exact", head: true })
      .eq("monitor_id", monitorId);

    // Get last check
    const { data: lastCheckData } = await supabase
      .from("monitor_checks")
      .select("*")
      .eq("monitor_id", monitorId)
      .order("checked_at", { ascending: false })
      .limit(1);

    // Calculate uptime percentages
    const uptime24h =
      checks24h && checks24h.length > 0
        ? (checks24h.filter((c) => c.is_up).length / checks24h.length) * 100
        : 0;

    const uptime7d =
      checks7d && checks7d.length > 0
        ? (checks7d.filter((c) => c.is_up).length / checks7d.length) * 100
        : 0;

    // Calculate average response time for last 24 hours
    const avgResponseTime24h =
      checks24h && checks24h.length > 0
        ? checks24h
            .filter((c) => c.is_up && c.response_time_ms)
            .reduce((sum, c) => sum + (c.response_time_ms || 0), 0) /
          checks24h.filter((c) => c.is_up).length
        : 0;

    return {
      monitor_id: monitorId,
      uptime_24h: Number(uptime24h.toFixed(2)),
      uptime_7d: Number(uptime7d.toFixed(2)),
      avg_response_time_24h: Math.round(avgResponseTime24h),
      total_checks: totalChecks || 0,
      last_check: lastCheckData?.[0],
      recent_checks: (checks24h || []).slice(0, 20), // Last 20 checks
    };
  }

  static async getMonitorChecks(
    userId: string,
    monitorId: string,
    options: GetChecksOptions
  ): Promise<MonitorCheck[]> {
    // Ensure user owns monitor
    await this.getMonitor(userId, monitorId);

    const hoursAgo = new Date(Date.now() - options.hours * 60 * 60 * 1000);

    const { data: checks, error } = await supabase
      .from("monitor_checks")
      .select("*")
      .eq("monitor_id", monitorId)
      .gte("checked_at", hoursAgo.toISOString())
      .order("checked_at", { ascending: false })
      .limit(options.limit);

    if (error) {
      logger.error("Failed to fetch monitor checks", error);
      throw new Error("Failed to fetch monitor checks");
    }

    return checks || [];
  }

  static async testMonitor(
    userId: string,
    monitorId: string
  ): Promise<MonitorCheck> {
    const monitor = await this.getMonitor(userId, monitorId);

    const monitoringService = MonitoringService.getInstance();
    const result = await monitoringService.performCheck(monitor);

    return result;
  }

  static async toggleMonitor(
    userId: string,
    monitorId: string
  ): Promise<Monitor> {
    const monitor = await this.getMonitor(userId, monitorId);

    return await this.updateMonitor(userId, monitorId, {
      is_active: !monitor.is_active,
    });
  }

  static async bulkToggleMonitors(
    userId: string,
    monitorIds: string[],
    isActive: boolean
  ): Promise<number> {
    const { data, error } = await supabase
      .from("monitors")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .in("id", monitorIds)
      .select("id");

    if (error) {
      logger.error("Failed to bulk toggle monitors", error);
      throw new Error("Failed to update monitors");
    }

    return data?.length || 0;
  }

  static async bulkDeleteMonitors(
    userId: string,
    monitorIds: string[]
  ): Promise<number> {
    const { data, error } = await supabase
      .from("monitors")
      .delete()
      .eq("user_id", userId)
      .in("id", monitorIds)
      .select("id");

    if (error) {
      logger.error("Failed to bulk delete monitors", error);
      throw new Error("Failed to delete monitors");
    }

    return data?.length || 0;
  }

  static async getMonitorsByIds(
    userId: string,
    monitorIds: string[]
  ): Promise<Monitor[]> {
    const { data: monitors, error } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", userId)
      .in("id", monitorIds);

    if (error) {
      logger.error("Failed to fetch monitors by IDs", error);
      throw new Error("Failed to fetch monitors");
    }

    return monitors || [];
  }

  private static async validateMonitorUrl(
    url: string,
    method: string,
    headers?: Record<string, string> | null,
    body?: string | null,
    timeoutSeconds: number = 30
  ): Promise<void> {
    const axios = require("axios");

    try {
      const config = {
        method: method.toLowerCase(),
        url,
        timeout: timeoutSeconds * 1000,
        headers: headers || {},
        validateStatus: () => true, // Accept any status code for validation
      };

      if (body && ["post", "put", "patch"].includes(method.toLowerCase())) {
        (config as any).data = body;
      }

      await axios(config);
    } catch (error: any) {
      if (error.code === "ECONNABORTED") {
        throw new ValidationError(
          "URL validation timeout. Please check the URL and try again."
        );
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        throw new ValidationError(
          "Unable to reach the specified URL. Please verify the URL is correct and accessible."
        );
      } else {
        logger.warn("URL validation failed but allowing monitor creation", {
          url,
          error: error.message,
        });
        // Allow monitor creation even if validation fails for edge cases
      }
    }
  }
}
