import bcrypt from "bcryptjs";
import { supabase } from "@/config/database";
import { AuthService as AuthMiddleware } from "@/shared/middleware/auth";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "@/shared/middleware/errorHandler";
import { logger } from "@/shared/utils/logger";
import type { User, AuthResponse } from "@/types";

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static async register(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user in Supabase auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email confirmation for MVP
      });

    if (authError || !authData.user) {
      logger.error("Failed to create user in Supabase auth", authError);
      throw new Error("Failed to create user account");
    }

    // Create user record in our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user.id,
          email,
          name: name || null,
        },
      ])
      .select()
      .single();

    if (userError || !userData) {
      // Clean up auth user if user record creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      logger.error("Failed to create user record", userError);
      throw new Error("Failed to create user profile");
    }

    // Generate JWT token
    const token = AuthMiddleware.generateToken(userData.id, userData.email);

    return {
      user: userData,
      token,
    };
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    // Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData) {
      logger.error("User profile not found", {
        userId: authData.user.id,
        error: userError,
      });
      throw new NotFoundError("User profile not found");
    }

    // Generate JWT token
    const token = AuthMiddleware.generateToken(userData.id, userData.email);

    return {
      user: userData,
      token,
    };
  }

  static async getUserProfile(userId: string): Promise<User> {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  static async updateUserProfile(
    userId: string,
    updates: Partial<Pick<User, "name" | "email">>
  ): Promise<User> {
    // If email is being updated, validate it's not taken
    if (updates.email) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", updates.email)
        .neq("id", userId)
        .single();

      if (existingUser) {
        throw new ConflictError("Email already in use");
      }

      // Update email in Supabase auth as well
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          email: updates.email,
        }
      );

      if (authError) {
        logger.error("Failed to update user email in auth", authError);
        throw new Error("Failed to update email");
      }
    }

    // Update user profile
    const { data: user, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error || !user) {
      logger.error("Failed to update user profile", error);
      throw new Error("Failed to update profile");
    }

    return user;
  }

  static async refreshToken(userId: string, email: string): Promise<string> {
    // Verify user still exists
    await this.getUserProfile(userId);

    // Generate new token
    return AuthMiddleware.generateToken(userId, email);
  }

  static async deleteUser(userId: string): Promise<void> {
    // Delete from Supabase auth (this will cascade to our users table)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      logger.error("Failed to delete user", error);
      throw new Error("Failed to delete user account");
    }
  }
}
