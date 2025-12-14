import { useQuery, useMutation, useQueryClient } from "react-query";
import apiClient from "@/lib/api";
import type { Monitor, MonitorStats, MonitorCheck, ApiResponse } from "@/types";
import { toast } from "@/components/ui/toast";

interface MonitorWithStats extends Monitor {
  stats: MonitorStats;
}

// Query keys
export const monitorKeys = {
  all: ["monitors"] as const,
  detail: (id: string) => [...monitorKeys.all, id] as const,
  checks: (id: string) => [...monitorKeys.detail(id), "checks"] as const,
};

// Fetch a single monitor with stats
export const useMonitor = (id: string) => {
  return useQuery(
    monitorKeys.detail(id),
    async () => {
      const response = await apiClient.get<ApiResponse<MonitorWithStats>>(
        `/monitors/${id}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch monitor");
      }
      return response.data.data;
    },
    {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch monitor details",
          variant: "destructive",
        });
      },
    }
  );
};

// Fetch monitor checks
export const useMonitorChecks = (id: string) => {
  return useQuery(
    monitorKeys.checks(id),
    async () => {
      const response = await apiClient.get<ApiResponse<MonitorCheck[]>>(
        `/monitors/${id}/checks?limit=50&hours=24`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch checks");
      }
      return response.data.data;
    },
    {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch monitor checks",
          variant: "destructive",
        });
      },
    }
  );
};

// Toggle monitor active status
export const useToggleMonitor = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      const response = await apiClient.post(`/monitors/${id}/toggle`);
      return response.data;
    },
    {
      onSuccess: (_, id) => {
        toast({
          title: "Success",
          description: "Monitor status updated",
        });
        queryClient.invalidateQueries(monitorKeys.detail(id));
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to toggle monitor",
          variant: "destructive",
        });
      },
    }
  );
};

// Test monitor
export const useTestMonitor = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      const response = await apiClient.post(`/monitors/${id}/test`);
      return response.data;
    },
    {
      onSuccess: (_, id) => {
        toast({
          title: "Success",
          description: "Monitor test initiated",
        });
        // Wait a bit for the test to complete before refreshing checks
        setTimeout(() => {
          queryClient.invalidateQueries(monitorKeys.checks(id));
        }, 2000);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to test monitor",
          variant: "destructive",
        });
      },
    }
  );
};

// Delete monitor
export const useDeleteMonitor = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      const response = await apiClient.delete(`/monitors/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Monitor deleted successfully",
        });
        queryClient.invalidateQueries(monitorKeys.all);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete monitor",
          variant: "destructive",
        });
      },
    }
  );
};

export const useMonitorStats = (id: string) => {
  return useQuery(
    [...monitorKeys.all, "stats"],
    async () => {
      const response = await apiClient.get<
        ApiResponse<{
          total: number;
          active: number;
          inactive: number;
        }>
      >(`/monitors/${id}/stats`);

      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch monitor stats");
      }

      return response.data.data;
    },
    {
      staleTime: 1000 * 60, // 1 minute
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch monitor stats",
          variant: "destructive",
        });
      },
    }
  );
};
