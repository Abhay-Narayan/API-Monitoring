import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "@/config/environment";
import { supabase } from "@/config/database";
import { UnauthorizedError } from "./errorHandler";
import { logger } from "@/shared/utils/logger";

interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      user?: any;
    }
  }
}

export class AuthService {
  // Generate JWT token
  static generateToken(userId: string, email: string): string {
    if (!config.jwtSecret) {
      throw new Error("JWT secret is not defined in config");
    }

    const payload = { userId, email };
    const options: SignOptions = {
      expiresIn: (config.jwtExpiresIn as jwt.SignOptions["expiresIn"]) || "1h",
    };

    return jwt.sign(payload, config.jwtSecret, options);
  }

  // Verify JWT token
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError("Token expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError("Invalid token");
      }
      throw new UnauthorizedError("Token verification failed");
    }
  }

  // Get user from database
  static async getUser(userId: string) {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedError("User not found");
    }

    return user;
  }
}

// Middleware to authenticate requests
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError("Authorization header missing");
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      throw new UnauthorizedError("Token missing");
    }

    // Verify and decode token
    const payload = AuthService.verifyToken(token);

    // Add user info to request
    req.userId = payload.userId;
    req.userEmail = payload.email;

    logger.debug("User authenticated", {
      userId: payload.userId,
      email: payload.email,
    });

    next();
  } catch (error) {
    next(error);
  }
}

// Middleware to optionally authenticate requests (doesn't fail if no token)
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return next();
    }

    // Try to verify token, but don't fail if invalid
    try {
      const payload = AuthService.verifyToken(token);
      req.userId = payload.userId;
      req.userEmail = payload.email;
    } catch (error: any) {
      // Continue without authentication
      logger.debug("Optional auth failed", { error: error.message });
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Middleware to load full user data
export async function loadUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.userId) {
      return next();
    }

    const user = await AuthService.getUser(req.userId);
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}
