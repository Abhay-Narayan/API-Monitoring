import { useMutation, useQuery, useQueryClient } from "react-query";
import apiClient from "@/lib/api";
import type { ApiResponse, User, LoginRequest, RegisterRequest } from "@/types";
import { toast } from "@/components/ui/toast";

// Helper function to extract user-friendly error messages
function getErrorMessage(error: any): string {
  const statusCode = error.response?.status;
  const errorData = error.response?.data;

  // Handle validation errors (400)
  if (statusCode === 400) {
    // If there are validation details, show the first one in a user-friendly way
    if (
      errorData?.details &&
      Array.isArray(errorData.details) &&
      errorData.details.length > 0
    ) {
      const firstError = errorData.details[0];
      const field = firstError.field || "";
      const message = firstError.message || "";

      // Format field name to be more readable
      const fieldName =
        field
          .split(".")
          .pop()
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase()) || "field";

      // Return user-friendly message
      return message.includes("required")
        ? `Please provide ${fieldName}`
        : message.includes("invalid") || message.includes("Invalid")
        ? `Invalid ${fieldName.toLowerCase()}`
        : message.includes("email")
        ? "Please enter a valid email address"
        : message.includes("password")
        ? "Password does not meet requirements"
        : `${fieldName}: ${message}`;
    }
    // Generic validation error message
    return "Please check your input and try again";
  }

  // Handle authentication errors (401)
  if (statusCode === 401) {
    const message = errorData?.message || "";
    if (message.includes("email") || message.includes("password")) {
      return "Invalid email or password";
    }
    return "Authentication failed. Please try again";
  }

  // Handle server errors (500+)
  if (statusCode >= 500) {
    return "Something went wrong. Please try again later";
  }

  // Handle network errors
  if (!error.response) {
    return "Unable to connect to the server. Please check your connection";
  }

  // For other errors, try to use the message from the response
  // but fall back to a generic message if it's too technical
  const message = errorData?.message || "An error occurred";

  // If the message looks technical, return a generic one
  if (
    message.includes("Invalid request data") ||
    message.includes("Validation failed") ||
    message.includes("Validation Error")
  ) {
    return "Please check your input and try again";
  }

  return message;
}

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  session: () => [...authKeys.all, "session"] as const,
};

// Get current user
export const useCurrentUser = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return useQuery(
    authKeys.user(),
    async () => {
      const response = await apiClient.get<ApiResponse<User>>("/auth/me");
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch user");
      }
      return response.data.data;
    },
    {
      enabled: !!token, // Only run query if token exists
      retry: false,
      staleTime: Infinity, // User data doesn't change often
      cacheTime: Infinity,
      onError: () => {
        // Clear token on auth error
        localStorage.removeItem("token");
      },
    }
  );
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: LoginRequest) => {
      const response = await apiClient.post<ApiResponse<{ token: string }>>(
        "/auth/login",
        data
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Login failed");
      }
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        // Save token
        localStorage.setItem("token", data.token);
        // Invalidate user query to refetch with new token
        queryClient.invalidateQueries(authKeys.user());
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
      },
      onError: (error: any) => {
        const errorMessage = getErrorMessage(error);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000, // Show error for 5 seconds
        });
      },
    }
  );
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: RegisterRequest) => {
      const response = await apiClient.post<ApiResponse<{ token: string }>>(
        "/auth/register",
        data
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Registration failed");
      }
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        // Save token
        localStorage.setItem("token", data.token);
        // Invalidate user query to fetch new user
        queryClient.invalidateQueries(authKeys.user());
        toast({
          title: "Success",
          description: "Registration successful",
        });
      },
      onError: (error: any) => {
        const errorMessage = getErrorMessage(error);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 3000, // Show error for 3 seconds
        });
      },
    }
  );
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async () => {
      const response = await apiClient.post<ApiResponse<void>>("/auth/logout");
      if (!response.data.success) {
        throw new Error("Logout failed");
      }
    },
    {
      onSuccess: () => {
        // Clear token
        localStorage.removeItem("token");
        // Reset user query
        queryClient.setQueryData(authKeys.user(), null);
        // Reset all queries to avoid stale data
        queryClient.resetQueries();
        toast({
          title: "Success",
          description: "Logged out successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to logout",
          variant: "destructive",
        });
      },
      // Always clear local state even if API call fails
      onSettled: () => {
        localStorage.removeItem("token");
        queryClient.setQueryData(authKeys.user(), null);
        queryClient.resetQueries();
      },
    }
  );
};
