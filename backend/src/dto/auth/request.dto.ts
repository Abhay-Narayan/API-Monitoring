import { z } from "zod";

// Authentication Request DTOs
export const LoginRequestDto = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterRequestDto = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
});

export const UpdateProfileRequestDto = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
});

export const RefreshTokenRequestDto = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const ChangePasswordRequestDto = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// Type exports
export type LoginRequest = z.infer<typeof LoginRequestDto>;
export type RegisterRequest = z.infer<typeof RegisterRequestDto>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestDto>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestDto>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestDto>;
