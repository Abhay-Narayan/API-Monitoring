import { z } from "zod";

// Monitor Response DTOs
export const MonitorResponseDto = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  url: z.string(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()).nullable(),
  body: z.string().nullable(),
  interval_minutes: z.number(),
  timeout_seconds: z.number(),
  expected_status_codes: z.array(z.number()),
  keyword_validation: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const MonitorCheckResponseDto = z.object({
  id: z.string(),
  monitor_id: z.string(),
  status_code: z.number(),
  response_time_ms: z.number(),
  is_up: z.boolean(),
  error_message: z.string().nullable(),
  response_snippet: z.string().nullable(),
  checked_at: z.string(),
});

export const MonitorStatsResponseDto = z.object({
  monitor_id: z.string(),
  uptime_24h: z.number(),
  uptime_7d: z.number(),
  avg_response_time_24h: z.number(),
  total_checks: z.number(),
  last_check: MonitorCheckResponseDto.nullable(),
  recent_checks: z.array(MonitorCheckResponseDto),
});

export const MonitorWithStatsResponseDto = MonitorResponseDto.extend({
  stats: MonitorStatsResponseDto,
});

export const PaginatedMonitorsResponseDto = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(MonitorResponseDto),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
  message: z.string().optional(),
});

export const MonitorDetailResponseDto = z.object({
  success: z.boolean(),
  data: MonitorResponseDto,
  message: z.string().optional(),
});

export const MonitorStatsDetailResponseDto = z.object({
  success: z.boolean(),
  data: MonitorStatsResponseDto,
  message: z.string().optional(),
});

export const MonitorChecksResponseDto = z.object({
  success: z.boolean(),
  data: z.array(MonitorCheckResponseDto),
  message: z.string().optional(),
});

export const TestMonitorResponseDto = z.object({
  success: z.boolean(),
  data: MonitorCheckResponseDto,
  message: z.string().optional(),
});

export const BulkOperationResponseDto = z.object({
  success: z.boolean(),
  data: z.object({
    affected_count: z.number(),
    monitor_ids: z.array(z.string()),
  }),
  message: z.string().optional(),
});

// Type exports
export type MonitorResponse = z.infer<typeof MonitorResponseDto>;
export type MonitorCheckResponse = z.infer<typeof MonitorCheckResponseDto>;
export type MonitorStatsResponse = z.infer<typeof MonitorStatsResponseDto>;
export type MonitorWithStatsResponse = z.infer<
  typeof MonitorWithStatsResponseDto
>;
export type PaginatedMonitorsResponse = z.infer<
  typeof PaginatedMonitorsResponseDto
>;
export type MonitorDetailResponse = z.infer<typeof MonitorDetailResponseDto>;
export type MonitorStatsDetailResponse = z.infer<
  typeof MonitorStatsDetailResponseDto
>;
export type MonitorChecksResponse = z.infer<typeof MonitorChecksResponseDto>;
export type TestMonitorResponse = z.infer<typeof TestMonitorResponseDto>;
export type BulkOperationResponse = z.infer<typeof BulkOperationResponseDto>;
