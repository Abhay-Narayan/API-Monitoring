import { useMutation, useQuery, useQueryClient } from "react-query";
import apiClient from "@/lib/api";
import type { Alert, AlertLog, ApiResponse, CreateAlertRequest } from "@/types";
import { toast } from "@/components/ui/toast";

// Query keys
export const alertKeys = {
  all: ["alerts"] as const,
  lists: () => [...alertKeys.all, "list"] as const,
  list: (monitorId: string) => [...alertKeys.lists(), monitorId] as const,
  logs: (monitorId: string) => [...alertKeys.all, "logs", monitorId] as const,
};

// Get monitor alerts
export const useMonitorAlerts = (monitorId: string) => {
  return useQuery(
    alertKeys.list(monitorId),
    async () => {
      const response = await apiClient.get<ApiResponse<Alert[]>>(
        `/alerts/monitor/${monitorId}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch alerts");
      }
      return response.data.data;
    },
    {
      staleTime: 1000 * 60, // 1 minute
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch alerts",
          variant: "destructive",
        });
      },
    }
  );
};

// Get alert logs
export const useAlertLogs = (monitorId: string) => {
  return useQuery(
    alertKeys.logs(monitorId),
    async () => {
      const response = await apiClient.get<ApiResponse<AlertLog[]>>(
        `/alerts/monitor/${monitorId}/logs`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch alert logs");
      }
      return response.data.data;
    },
    {
      staleTime: 1000 * 30, // 30 seconds
      refetchInterval: 1000 * 30, // Refetch every 30 seconds
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch alert logs",
          variant: "destructive",
        });
      },
    }
  );
};

// Create alert
export const useCreateAlert = (monitorId: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: CreateAlertRequest) => {
      const response = await apiClient.post<ApiResponse<Alert>>(
        `/alerts/monitor/${monitorId}`,
        {
          monitor_id: monitorId,
          ...data,
        }
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to create alert");
      }
      return response.data.data;
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Alert created successfully",
        });
        queryClient.invalidateQueries(alertKeys.list(monitorId));
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create alert",
          variant: "destructive",
        });
      },
    }
  );
};

// Update alert
export const useUpdateAlert = (monitorId: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({
      id,
      ...data
    }: { id: string; is_active?: boolean } & Partial<CreateAlertRequest>) => {
      const response = await apiClient.put<ApiResponse<Alert>>(
        `/alerts/${id}`,
        data
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to update alert");
      }
      return response.data.data;
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Alert updated successfully",
        });
        queryClient.invalidateQueries(alertKeys.list(monitorId));
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update alert",
          variant: "destructive",
        });
      },
    }
  );
};

// Delete alert
export const useDeleteAlert = (monitorId: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      const response = await apiClient.delete<ApiResponse<void>>(
        `/alerts/${id}`
      );
      if (!response.data.success) {
        throw new Error("Failed to delete alert");
      }
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Alert deleted successfully",
        });
        queryClient.invalidateQueries(alertKeys.list(monitorId));
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete alert",
          variant: "destructive",
        });
      },
    }
  );
};

// Test alert
export const useTestAlert = (monitorId: string) => {
  return useMutation(
    async (id: string) => {
      const response = await apiClient.post<ApiResponse<void>>(
        `/alerts/${id}/test`
      );
      if (!response.data.success) {
        throw new Error("Failed to test alert");
      }
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Test alert sent successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to send test alert",
          variant: "destructive",
        });
      },
    }
  );
};
