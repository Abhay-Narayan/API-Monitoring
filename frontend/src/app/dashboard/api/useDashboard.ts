import { useQuery } from "react-query";
import apiClient from "@/lib/api";
import type {
  ApiResponse,
  DashboardData,
  RecentActivity,
  SystemStats,
} from "@/types";
import { toast } from "@/components/ui/toast";

// Query keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
  recentActivity: () => [...dashboardKeys.all, "recent-activity"] as const,
  systemStats: () => [...dashboardKeys.all, "system-stats"] as const,
};

// Get dashboard overview (monitors with stats)
export const useDashboardOverview = () => {
  return useQuery(
    dashboardKeys.overview(),
    async () => {
      const response = await apiClient.get<ApiResponse<DashboardData>>(
        "/dashboard/overview"
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch dashboard overview");
      }
      return response.data.data;
    },
    {
      staleTime: 1000 * 60, // 1 minute
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch dashboard overview",
          variant: "destructive",
        });
      },
    }
  );
};

// Get recent activity
export const useRecentActivity = () => {
  return useQuery(
    dashboardKeys.recentActivity(),
    async () => {
      const response = await apiClient.get<ApiResponse<RecentActivity[]>>(
        "/dashboard/activity"
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch recent activity");
      }
      return response.data.data;
    },
    {
      staleTime: 1000 * 30, // 30 seconds
      refetchInterval: 1000 * 30, // Refetch every 30 seconds
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch recent activity",
          variant: "destructive",
        });
      },
    }
  );
};

// Get system stats
export const useSystemStats = () => {
  return useQuery(
    dashboardKeys.systemStats(),
    async () => {
      const response = await apiClient.get<ApiResponse<SystemStats>>(
        "/dashboard/stats"
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch system stats");
      }
      return response.data.data;
    },
    {
      staleTime: 1000 * 60, // 1 minute
      refetchInterval: 1000 * 60, // Refetch every minute
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch system stats",
          variant: "destructive",
        });
      },
    }
  );
};
