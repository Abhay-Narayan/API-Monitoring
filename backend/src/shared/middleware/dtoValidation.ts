import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiResponse, ValidationErrorResponse } from "@/dto/common";
import { logger } from "@/shared/utils/logger";

// DTO Validation middleware factory
export function validateDto<T extends z.ZodSchema>(
  schema: T,
  source: "body" | "query" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);

      if (!result.success) {
        const validationErrors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          value: err.path.reduce((obj, key) => obj?.[key], data),
        }));

        const errorResponse: ValidationErrorResponse = {
          success: false,
          error: "Validation Error",
          message: "Invalid request data",
          details: validationErrors,
          timestamp: new Date().toISOString(),
        };

        logger.warn("DTO validation failed", {
          source,
          errors: validationErrors,
          path: req.path,
          method: req.method,
        });

        return res.status(400).json(errorResponse);
      }

      // Replace the original data with the parsed and validated data
      req[source] = result.data;
      next();
    } catch (error: any) {
      logger.error("DTO validation middleware error", error, {
        path: req.path,
        method: req.method,
        source,
      });

      const errorResponse: ApiResponse = {
        success: false,
        error: "Internal Server Error",
        message: "Failed to validate request data",
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  };
}

// Shorthand validators for common use cases
export const validateBody = <T extends z.ZodSchema>(schema: T) =>
  validateDto(schema, "body");

export const validateQuery = <T extends z.ZodSchema>(schema: T) =>
  validateDto(schema, "query");

export const validateParams = <T extends z.ZodSchema>(schema: T) =>
  validateDto(schema, "params");

// Response formatter helper
export function formatApiResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string
): ApiResponse<T> {
  return {
    success,
    data,
    message,
    error,
    timestamp: new Date().toISOString(),
  };
}

// Success response helper
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return formatApiResponse(true, data, message);
}

// Error response helper
export function errorResponse(error: string, message?: string): ApiResponse {
  return formatApiResponse(false, undefined, message, error);
}

// Paginated response helper
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): ApiResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}> {
  const totalPages = Math.ceil(total / limit);

  return formatApiResponse(
    true,
    {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    message
  );
}
