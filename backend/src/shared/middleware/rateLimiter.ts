import { Request, Response, NextFunction } from "express";
import { RateLimitError } from "./errorHandler";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private maxRequests: number = 100 // 100 requests per window
  ) {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  private getKey(req: Request): string {
    // Use IP address and user ID (if authenticated) as the key
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const userId = (req as any).userId || "";
    return `${ip}:${userId}`;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = this.getKey(req);
      const now = Date.now();

      // Initialize or get existing rate limit data
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 0,
          resetTime: now + this.windowMs,
        };
      }

      const current = this.store[key];

      // Check if limit exceeded
      if (current.count >= this.maxRequests) {
        const resetIn = Math.ceil((current.resetTime - now) / 1000);
        res.set({
          "X-RateLimit-Limit": this.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": current.resetTime.toString(),
          "Retry-After": resetIn.toString(),
        });

        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${resetIn} seconds.`
        );
      }

      // Increment counter
      current.count++;

      // Set rate limit headers
      const remaining = Math.max(0, this.maxRequests - current.count);
      res.set({
        "X-RateLimit-Limit": this.maxRequests.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": current.resetTime.toString(),
      });

      next();
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Different rate limiters for different endpoints
const generalLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 req/15min
const authLimiter = new RateLimiter(15 * 60 * 1000, 10); // 10 req/15min for auth
const apiLimiter = new RateLimiter(60 * 1000, 60); // 60 req/min for API calls

export const rateLimiter = generalLimiter.middleware();
export const authRateLimiter = authLimiter.middleware();
export const apiRateLimiter = apiLimiter.middleware();
