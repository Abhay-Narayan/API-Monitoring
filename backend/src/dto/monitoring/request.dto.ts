import { z } from "zod";

// Monitor Request DTOs
export const CreateMonitorRequestDto = z.object({
  name: z.string().min(1, "Monitor name is required").max(100, "Name too long"),
  url: z.string().url("Invalid URL format"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  interval_minutes: z
    .number()
    .int()
    .min(1, "Minimum interval is 1 minute")
    .max(1440, "Maximum interval is 24 hours")
    .default(5),
  timeout_seconds: z
    .number()
    .int()
    .min(1, "Minimum timeout is 1 second")
    .max(300, "Maximum timeout is 5 minutes")
    .default(30),
  expected_status_codes: z
    .array(z.number().int().min(100).max(599))
    .default([200, 201, 202, 204]),
  keyword_validation: z.string().optional(),
});

export const UpdateMonitorRequestDto = CreateMonitorRequestDto.partial().extend(
  {
    is_active: z.boolean().optional(),
  }
);

export const GetMonitorsQueryDto = z.object({
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().default(1)),
  limit: z.preprocess(
    (val) => (val ? Number(val) : 10),
    z.number().default(10)
  ),
  search: z.string().optional(),
  active_only: z.preprocess((val) => val === "true", z.boolean().default(true)),
});

export const GetMonitorChecksQueryDto = z.object({
  limit: z.preprocess(
    (val) => (val ? Number(val) : 100),
    z.number().default(100)
  ),
  hours: z.preprocess(
    (val) => (val ? Number(val) : 24),
    z.number().default(24)
  ),
});

export const BulkToggleMonitorsRequestDto = z.object({
  monitor_ids: z.array(z.string().uuid()),
  is_active: z.boolean(),
});

export const BulkDeleteMonitorsRequestDto = z.object({
  monitor_ids: z.array(z.string().uuid()),
});

export const TestMonitorRequestDto = z.object({
  url: z.string().url("Invalid URL format"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  timeout_seconds: z.number().int().min(1).max(300).default(30),
  expected_status_codes: z.array(z.number().int().min(100).max(599)).optional(),
  keyword_validation: z.string().optional(),
});

// Type exports
export type CreateMonitorRequest = z.infer<typeof CreateMonitorRequestDto>;
export type UpdateMonitorRequest = z.infer<typeof UpdateMonitorRequestDto>;
export type GetMonitorsQuery = z.infer<typeof GetMonitorsQueryDto>;
export type GetMonitorChecksQuery = z.infer<typeof GetMonitorChecksQueryDto>;
export type BulkToggleMonitorsRequest = z.infer<
  typeof BulkToggleMonitorsRequestDto
>;
export type BulkDeleteMonitorsRequest = z.infer<
  typeof BulkDeleteMonitorsRequestDto
>;
export type TestMonitorRequest = z.infer<typeof TestMonitorRequestDto>;
