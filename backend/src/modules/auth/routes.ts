import { Router } from "express";
import { AuthController } from "./handlers/AuthController";
import { asyncHandler } from "@/shared/middleware/errorHandler";
import { authRateLimiter } from "@/shared/middleware/rateLimiter";
import { authenticate } from "@/shared/middleware/auth";
import { validateBody } from "@/shared/middleware/dtoValidation";
import {
  LoginRequestDto,
  RegisterRequestDto,
  UpdateProfileRequestDto,
} from "@/dto/auth";

const router = Router();

// Routes with DTO validation

// Public routes with rate limiting
router.post(
  "/register",
  authRateLimiter,
  validateBody(RegisterRequestDto),
  asyncHandler(AuthController.register)
);

router.post(
  "/login",
  authRateLimiter,
  validateBody(LoginRequestDto),
  asyncHandler(AuthController.login)
);

// Protected routes
router.get("/me", authenticate, asyncHandler(AuthController.getProfile));

router.put(
  "/me",
  authenticate,
  validateBody(UpdateProfileRequestDto),
  asyncHandler(AuthController.updateProfile)
);

router.post("/logout", authenticate, asyncHandler(AuthController.logout));

router.post(
  "/refresh",
  authenticate,
  asyncHandler(AuthController.refreshToken)
);

export { router as authRoutes };
