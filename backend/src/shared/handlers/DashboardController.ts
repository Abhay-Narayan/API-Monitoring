import { Request, Response } from "express";
import { supabase } from "@/config/database";
import { MonitoringService } from "@/modules/monitoring/services/MonitoringService";
import { logger } from "@/shared/utils/logger";
import type { DashboardData, MonitorCheck, ApiResponse } from "@/types";

interface RecentActivity {
  id: string;
  monitor_name: string;
  monitor_url: string;
  status_code: number;
  is_up: boolean;
  response_time_ms: number;
  error_message?: string;
  checked_at: string;
}

interface SystemStats {
  total_users: number;
  total_monitors: number;
  active_monitors: number;
  total_checks_today: number;
  avg_uptime_24h: number;
  avg_response_time_24h: number;
  scheduler_status: {
    is_running: boolean;
    active_jobs: number;
  };
}

export class DashboardController {
  static async getOverview(
    req: Request,
    res: Response<ApiResponse<DashboardData>>
  ): Promise<void> {
    const userId = req.userId!;

    try {
      // Get user's monitors with stats
      const { data: monitors, error: monitorsError } = await supabase
        .from("monitors")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (monitorsError) {
        throw new Error("Failed to fetch monitors");
      }

      // Get stats for each monitor
      const monitorsWithStats = await Promise.all(
        (monitors || []).map(async (monitor) => {
          const stats = await DashboardController.getMonitorStats(monitor.id);
          return { ...monitor, stats };
        })
      );

      // Calculate overall stats
      const totalMonitors = monitorsWithStats.length;
      const totalUptime =
        totalMonitors > 0
          ? monitorsWithStats.reduce((sum, m) => sum + m.stats.uptime_24h, 0) /
            totalMonitors
          : 0;

      const avgResponseTime =
        totalMonitors > 0
          ? monitorsWithStats
              .filter((m) => m.stats.avg_response_time_24h > 0)
              .reduce((sum, m) => sum + m.stats.avg_response_time_24h, 0) /
            Math.max(
              1,
              monitorsWithStats.filter((m) => m.stats.avg_response_time_24h > 0)
                .length
            )
          : 0;

      const dashboardData: DashboardData = {
        monitors: monitorsWithStats,
        total_monitors: totalMonitors,
        total_uptime: Number(totalUptime.toFixed(2)),
        avg_response_time: Math.round(avgResponseTime),
      };

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      logger.error("Failed to get dashboard overview", error, { userId });
      res.status(500).json({
        success: false,
        error: "Failed to load dashboard data",
        message: error.message,
      });
    }
  }

  static async getRecentActivity(
    req: Request,
    res: Response<ApiResponse<RecentActivity[]>>
  ): Promise<void> {
    const userId = req.userId!;
    const limit = Number(req.query.limit) || 50;

    try {
      // Get recent monitor checks for user's monitors
      const { data: activity, error } = await supabase
        .from("monitor_checks")
        .select(
          `
          id,
          status_code,
          is_up,
          response_time_ms,
          error_message,
          checked_at,
          monitors!inner (
            name,
            url,
            user_id
          )
        `
        )
        .eq("monitors.user_id", userId)
        .order("checked_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error("Failed to fetch recent activity");
      }

      // Transform data
      const recentActivity: RecentActivity[] = (activity || []).map(
        (check) => ({
          id: check.id,
          monitor_name: (check.monitors as any).name,
          monitor_url: (check.monitors as any).url,
          status_code: check.status_code,
          is_up: check.is_up,
          response_time_ms: check.response_time_ms,
          error_message: check.error_message,
          checked_at: check.checked_at,
        })
      );

      res.json({
        success: true,
        data: recentActivity,
      });
    } catch (error: any) {
      logger.error("Failed to get recent activity", error, { userId });
      res.status(500).json({
        success: false,
        error: "Failed to load recent activity",
        message: error.message,
      });
    }
  }

  static async getSystemStats(
    req: Request,
    res: Response<ApiResponse<SystemStats>>
  ): Promise<void> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // Get total monitors
      const { count: totalMonitors } = await supabase
        .from("monitors")
        .select("*", { count: "exact", head: true });

      // Get active monitors
      const { count: activeMonitors } = await supabase
        .from("monitors")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get today's checks
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: totalChecksToday } = await supabase
        .from("monitor_checks")
        .select("*", { count: "exact", head: true })
        .gte("checked_at", today.toISOString());

      // Get average uptime and response time for last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data: recentChecks } = await supabase
        .from("monitor_checks")
        .select("is_up, response_time_ms")
        .gte("checked_at", twentyFourHoursAgo.toISOString());

      let avgUptime24h = 0;
      let avgResponseTime24h = 0;

      if (recentChecks && recentChecks.length > 0) {
        const upChecks = recentChecks.filter((c) => c.is_up).length;
        avgUptime24h = (upChecks / recentChecks.length) * 100;

        const responseTimes = recentChecks
          .filter((c) => c.is_up && c.response_time_ms)
          .map((c) => c.response_time_ms);

        if (responseTimes.length > 0) {
          avgResponseTime24h =
            responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length;
        }
      }

      // Get scheduler status
      const monitoringService = MonitoringService.getInstance();
      const schedulerStatus = {
        is_running: monitoringService.getActiveMonitorCount() > 0,
        active_jobs: monitoringService.getActiveMonitorCount(),
      };

      const systemStats: SystemStats = {
        total_users: totalUsers || 0,
        total_monitors: totalMonitors || 0,
        active_monitors: activeMonitors || 0,
        total_checks_today: totalChecksToday || 0,
        avg_uptime_24h: Number(avgUptime24h.toFixed(2)),
        avg_response_time_24h: Math.round(avgResponseTime24h),
        scheduler_status: schedulerStatus,
      };

      res.json({
        success: true,
        data: systemStats,
      });
    } catch (error: any) {
      logger.error("Failed to get system stats", error);
      res.status(500).json({
        success: false,
        error: "Failed to load system stats",
        message: error.message,
      });
    }
  }

  private static async getMonitorStats(monitorId: string): Promise<any> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get checks for last 24 hours
    const { data: checks24h } = await supabase
      .from("monitor_checks")
      .select("*")
      .eq("monitor_id", monitorId)
      .gte("checked_at", twentyFourHoursAgo.toISOString());

    // Get checks for last 7 days
    const { data: checks7d } = await supabase
      .from("monitor_checks")
      .select("*")
      .eq("monitor_id", monitorId)
      .gte("checked_at", sevenDaysAgo.toISOString());

    // Get total checks
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

    // Calculate stats
    const uptime24h =
      checks24h && checks24h.length > 0
        ? (checks24h.filter((c) => c.is_up).length / checks24h.length) * 100
        : 0;

    const uptime7d =
      checks7d && checks7d.length > 0
        ? (checks7d.filter((c) => c.is_up).length / checks7d.length) * 100
        : 0;

    const avgResponseTime24h =
      checks24h && checks24h.length > 0
        ? checks24h
            .filter((c) => c.is_up && c.response_time_ms)
            .reduce((sum, c) => sum + (c.response_time_ms || 0), 0) /
          Math.max(1, checks24h.filter((c) => c.is_up).length)
        : 0;

    return {
      monitor_id: monitorId,
      uptime_24h: Number(uptime24h.toFixed(2)),
      uptime_7d: Number(uptime7d.toFixed(2)),
      avg_response_time_24h: Math.round(avgResponseTime24h),
      total_checks: totalChecks || 0,
      last_check: lastCheckData?.[0],
      recent_checks: (checks24h || []).slice(0, 20),
    };
  }
}
