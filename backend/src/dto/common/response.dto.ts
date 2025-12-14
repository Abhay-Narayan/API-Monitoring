import { z } from "zod";

// Common Response DTOs
export const ApiResponseDto = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
});

export const ErrorResponseDto = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.string(),
});

export const SuccessResponseDto = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
  timestamp: z.string(),
});

export const PaginationMetaDto = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

export const PaginatedResponseDto = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(z.any()),
    meta: PaginationMetaDto,
  }),
  message: z.string().optional(),
  timestamp: z.string(),
});

export const ValidationErrorResponseDto = z.object({
  success: z.literal(false),
  error: z.literal("Validation Error"),
  message: z.string(),
  details: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      value: z.any().optional(),
    })
  ),
  timestamp: z.string(),
});

export const HealthCheckResponseDto = z.object({
  success: z.boolean(),
  data: z.object({
    status: z.enum(["healthy", "degraded", "unhealthy"]),
    timestamp: z.string(),
    uptime: z.number(),
    version: z.string(),
    services: z.object({
      database: z.enum(["connected", "disconnected", "error"]),
      email: z.enum(["configured", "not_configured", "error"]),
      scheduler: z.enum(["running", "stopped", "error"]),
    }),
  }),
  message: z.string().optional(),
});

// Type exports
export type ApiResponse<T = any> = z.infer<typeof ApiResponseDto> & {
  data?: T;
};
export type ErrorResponse = z.infer<typeof ErrorResponseDto>;
export type SuccessResponse<T = any> = z.infer<typeof SuccessResponseDto> & {
  data: T;
};
export type PaginationMeta = z.infer<typeof PaginationMetaDto>;
export type PaginatedResponse<T = any> = z.infer<
  typeof PaginatedResponseDto
> & {
  data: { items: T[]; meta: PaginationMeta };
};
export type ValidationErrorResponse = z.infer<
  typeof ValidationErrorResponseDto
>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseDto>;
