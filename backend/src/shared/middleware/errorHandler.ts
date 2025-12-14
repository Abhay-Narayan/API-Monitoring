import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "@/shared/utils/logger";
import { config } from "@/config/environment";

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Custom error classes
export class ValidationError extends Error {
  public statusCode = 400;
  public isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  public statusCode = 404;
  public isOperational = true;

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  public statusCode = 401;
  public isOperational = true;

  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  public statusCode = 403;
  public isOperational = true;

  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  public statusCode = 409;
  public isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends Error {
  public statusCode = 429;
  public isOperational = true;

  constructor(message: string = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
}

// Main error handler middleware
export function errorHandler(
  error: ApiError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = "Internal Server Error";
  let details: any = undefined;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    details = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
  }
  // Handle custom API errors
  else if (error instanceof Error && "statusCode" in error) {
    statusCode = (error as ApiError).statusCode || 500;
    message = error.message;
  }
  // Handle other known errors
  else if (error instanceof Error) {
    message = error.message;
  }

  // Log error (but don't log expected 401s on /auth/me as errors)
  const isExpectedAuthError =
    statusCode === 401 &&
    req.path === "/api/auth/me" &&
    (message.includes("Authorization header missing") ||
      message.includes("Token missing") ||
      message.includes("Invalid token"));

  if (isExpectedAuthError) {
    // Log as debug instead of error for expected auth failures
    logger.debug(
      `${req.method} ${req.path} - ${message} (expected when user is not authenticated)`,
      {
        statusCode,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      }
    );
  } else {
    logger.error(`${req.method} ${req.path} - ${message}`, error, {
      statusCode,
      userId: (req as any).userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: error.name || "Error",
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Add details for validation errors
  if (details) {
    errorResponse.details = details;
  }

  // Don't expose stack traces in production
  if (config.nodeEnv === "development" && error.stack) {
    (errorResponse as any).stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
}

// Async error wrapper utility
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler for unmatched routes
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}
