import { z } from "zod";

// Alert Request DTOs
export const CreateAlertRequestDto = z.object({
  monitor_id: z.string().uuid("Invalid monitor ID"),
  type: z.enum(["email", "webhook"]),
  target: z.string().min(1, "Target is required"),
});

export const UpdateAlertRequestDto = z.object({
  target: z.string().min(1, "Target is required").optional(),
  is_active: z.boolean().optional(),
});

export const GetAlertsQueryDto = z.object({
  monitor_id: z.string().uuid().optional(),
  type: z.enum(["email", "webhook"]).optional(),
  is_active: z.boolean().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().default(1)),
  limit: z.preprocess(
    (val) => (val ? Number(val) : 10),
    z.number().default(10)
  ),
});

export const TestAlertRequestDto = z.object({
  type: z.enum(["email", "webhook"]),
  target: z.string().min(1, "Target is required"),
  test_message: z.string().optional(),
});

export const BulkDeleteAlertsRequestDto = z.object({
  alert_ids: z.array(z.string().uuid()),
});

// Type exports
export type CreateAlertRequest = z.infer<typeof CreateAlertRequestDto>;
export type UpdateAlertRequest = z.infer<typeof UpdateAlertRequestDto>;
export type GetAlertsQuery = z.infer<typeof GetAlertsQueryDto>;
export type TestAlertRequest = z.infer<typeof TestAlertRequestDto>;
export type BulkDeleteAlertsRequest = z.infer<
  typeof BulkDeleteAlertsRequestDto
>;
