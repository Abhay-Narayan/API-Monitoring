import { z } from "zod";
import {
  MonitorResponseDto,
  MonitorStatsResponseDto,
} from "../monitoring/response.dto";

// Dashboard Response DTOs
export const DashboardStatsResponseDto = z.object({
  total_monitors: z.number(),
  active_monitors: z.number(),
  total_uptime: z.number(),
  avg_response_time: z.number(),
  monitors_up: z.number(),
  monitors_down: z.number(),
  alerts_sent_24h: z.number(),
  checks_performed_24h: z.number(),
});

export const RecentActivityResponseDto = z.object({
  id: z.string(),
  type: z.enum([
    "check_completed",
    "monitor_created",
    "monitor_updated",
    "alert_sent",
  ]),
  monitor_name: z.string(),
  monitor_url: z.string(),
  message: z.string(),
  status: z.enum(["success", "failure", "info"]),
  timestamp: z.string(),
});

export const MonitorOverviewResponseDto = MonitorResponseDto.extend({
  stats: MonitorStatsResponseDto,
  recent_status: z.enum(["up", "down", "pending"]),
  last_check_time: z.string().nullable(),
});

export const DashboardDataResponseDto = z.object({
  success: z.boolean(),
  data: z.object({
    stats: DashboardStatsResponseDto,
    monitors: z.array(MonitorOverviewResponseDto),
    recent_activity: z.array(RecentActivityResponseDto),
    uptime_chart_data: z.array(
      z.object({
        timestamp: z.string(),
        uptime_percentage: z.number(),
      })
    ),
    response_time_chart_data: z.array(
      z.object({
        timestamp: z.string(),
        avg_response_time: z.number(),
      })
    ),
  }),
  message: z.string().optional(),
});

export const QuickStatsResponseDto = z.object({
  success: z.boolean(),
  data: DashboardStatsResponseDto,
  message: z.string().optional(),
});

export const RecentActivityDetailResponseDto = z.object({
  success: z.boolean(),
  data: z.array(RecentActivityResponseDto),
  message: z.string().optional(),
});

// Type exports
export type DashboardStatsResponse = z.infer<typeof DashboardStatsResponseDto>;
export type RecentActivityResponse = z.infer<typeof RecentActivityResponseDto>;
export type MonitorOverviewResponse = z.infer<
  typeof MonitorOverviewResponseDto
>;
export type DashboardDataResponse = z.infer<typeof DashboardDataResponseDto>;
export type QuickStatsResponse = z.infer<typeof QuickStatsResponseDto>;
export type RecentActivityDetailResponse = z.infer<
  typeof RecentActivityDetailResponseDto
>;
