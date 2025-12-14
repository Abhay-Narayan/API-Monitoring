"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User, LoginRequest, RegisterRequest } from "@/types";
import {
  useCurrentUser,
  useLogin,
  useRegister,
  useLogout,
} from "../api/useAuth";
import { usePrefetchDashboard } from "@/lib/queryUtils";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const prefetchDashboard = usePrefetchDashboard();

  // Get current user
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
  } = useCurrentUser();

  // Auth mutations
  const { mutateAsync: loginMutation, isLoading: loginLoading } = useLogin();
  const { mutateAsync: registerMutation, isLoading: registerLoading } =
    useRegister();
  const { mutate: logoutMutation } = useLogout();

  // Redirect on auth error (only if we had a token but it's invalid)
  useEffect(() => {
    if (userError) {
      const token = localStorage.getItem("token");
      // Only redirect if we had a token (meaning it expired/invalid)
      // Don't redirect if there was no token (user just not logged in)
      if (token) {
        localStorage.removeItem("token");
        router.push("/auth/login");
      }
    }
  }, [userError, router]);

  const login = async (credentials: LoginRequest) => {
    await loginMutation(credentials);
    // Prefetch dashboard data before navigation
    prefetchDashboard();
    router.push("/dashboard");
  };

  const register = async (userData: RegisterRequest) => {
    await registerMutation(userData);
    router.push("/dashboard");
  };

  const logout = () => {
    logoutMutation();
    router.push("/auth/login");
  };

  const value: AuthContextType = {
    user: user ?? null,
    loading: userLoading || loginLoading || registerLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
