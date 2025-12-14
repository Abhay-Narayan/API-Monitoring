import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { logger } from "@/shared/utils/logger";
import {
  successResponse,
  errorResponse,
} from "@/shared/middleware/dtoValidation";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
} from "@/dto/auth";
import { ApiResponse } from "@/dto/common";
import type { User } from "@/types";

export class AuthController {
  static async register(
    req: Request<{}, ApiResponse<AuthResponse>, RegisterRequest>,
    res: Response<ApiResponse<AuthResponse>>
  ): Promise<void> {
    const { email, password, name } = req.body;

    logger.info("User registration attempt", { email });

    const result = await AuthService.register(email, password, name);

    logger.info("User registered successfully", {
      userId: result.user.id,
      email: result.user.email,
    });

    res.status(201).json(successResponse(result, "Registration successful"));
  }

  static async login(
    req: Request<{}, ApiResponse<AuthResponse>, LoginRequest>,
    res: Response<ApiResponse<AuthResponse>>
  ): Promise<void> {
    const { email, password } = req.body;

    logger.info("User login attempt", { email });

    const result = await AuthService.login(email, password);

    logger.info("User logged in successfully", {
      userId: result.user.id,
      email: result.user.email,
    });

    res.json(successResponse(result, "Login successful"));
  }

  static async getProfile(
    req: Request,
    res: Response<ApiResponse<User>>
  ): Promise<void> {
    const userId = req.userId!;

    const user = await AuthService.getUserProfile(userId);

    res.json({
      success: true,
      data: user,
    });
  }

  static async updateProfile(
    req: Request,
    res: Response<ApiResponse<User>>
  ): Promise<void> {
    const userId = req.userId!;
    const updates = req.body;

    logger.info("User profile update", { userId, updates });

    const user = await AuthService.updateUserProfile(userId, updates);

    res.json({
      success: true,
      data: user,
      message: "Profile updated successfully",
    });
  }

  static async logout(req: Request, res: Response<ApiResponse>): Promise<void> {
    const userId = req.userId!;

    logger.info("User logout", { userId });

    // In a real app, you might want to blacklist the JWT token
    // For now, we'll just log the logout

    res.json({
      success: true,
      message: "Logout successful",
    });
  }

  static async refreshToken(
    req: Request,
    res: Response<ApiResponse<{ token: string }>>
  ): Promise<void> {
    const userId = req.userId!;
    const userEmail = req.userEmail!;

    const token = await AuthService.refreshToken(userId, userEmail);

    res.json({
      success: true,
      data: { token },
      message: "Token refreshed successfully",
    });
  }
}
