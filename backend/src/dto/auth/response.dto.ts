import { z } from "zod";

// Authentication Response DTOs
export const UserResponseDto = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AuthResponseDto = z.object({
  user: UserResponseDto,
  token: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().optional(),
});

export const TokenResponseDto = z.object({
  token: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number(),
});

export const LoginResponseDto = z.object({
  success: z.boolean(),
  data: AuthResponseDto,
  message: z.string().optional(),
});

export const RegisterResponseDto = z.object({
  success: z.boolean(),
  data: AuthResponseDto,
  message: z.string().optional(),
});

export const ProfileResponseDto = z.object({
  success: z.boolean(),
  data: UserResponseDto,
  message: z.string().optional(),
});

// Type exports
export type UserResponse = z.infer<typeof UserResponseDto>;
export type AuthResponse = z.infer<typeof AuthResponseDto>;
export type TokenResponse = z.infer<typeof TokenResponseDto>;
export type LoginResponse = z.infer<typeof LoginResponseDto>;
export type RegisterResponse = z.infer<typeof RegisterResponseDto>;
export type ProfileResponse = z.infer<typeof ProfileResponseDto>;
