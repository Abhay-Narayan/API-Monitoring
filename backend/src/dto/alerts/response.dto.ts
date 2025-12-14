import { z } from "zod";

// Alert Response DTOs
export const AlertResponseDto = z.object({
  id: z.string(),
  monitor_id: z.string(),
  type: z.enum(["email", "webhook"]),
  target: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export const AlertLogResponseDto = z.object({
  id: z.string(),
  alert_id: z.string(),
  monitor_id: z.string(),
  message: z.string(),
  sent_at: z.string(),
  success: z.boolean(),
  error_message: z.string().nullable(),
});

export const AlertWithMonitorResponseDto = AlertResponseDto.extend({
  monitor: z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
  }),
});

export const PaginatedAlertsResponseDto = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(AlertResponseDto),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
  message: z.string().optional(),
});

export const AlertDetailResponseDto = z.object({
  success: z.boolean(),
  data: AlertResponseDto,
  message: z.string().optional(),
});

export const AlertLogsResponseDto = z.object({
  success: z.boolean(),
  data: z.array(AlertLogResponseDto),
  message: z.string().optional(),
});

export const TestAlertResponseDto = z.object({
  success: z.boolean(),
  data: z.object({
    test_successful: z.boolean(),
    message: z.string(),
    response_time_ms: z.number().optional(),
  }),
  message: z.string().optional(),
});

export const AlertStatsResponseDto = z.object({
  success: z.boolean(),
  data: z.object({
    total_alerts: z.number(),
    active_alerts: z.number(),
    alerts_sent_24h: z.number(),
    success_rate_24h: z.number(),
    by_type: z.object({
      email: z.number(),
      webhook: z.number(),
    }),
  }),
  message: z.string().optional(),
});

// Type exports
export type AlertResponse = z.infer<typeof AlertResponseDto>;
export type AlertLogResponse = z.infer<typeof AlertLogResponseDto>;
export type AlertWithMonitorResponse = z.infer<
  typeof AlertWithMonitorResponseDto
>;
export type PaginatedAlertsResponse = z.infer<
  typeof PaginatedAlertsResponseDto
>;
export type AlertDetailResponse = z.infer<typeof AlertDetailResponseDto>;
export type AlertLogsResponse = z.infer<typeof AlertLogsResponseDto>;
export type TestAlertResponse = z.infer<typeof TestAlertResponseDto>;
export type AlertStatsResponse = z.infer<typeof AlertStatsResponseDto>;
