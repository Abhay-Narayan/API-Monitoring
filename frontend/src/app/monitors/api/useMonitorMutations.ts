import { useMutation, useQueryClient } from "react-query";
import apiClient from "@/lib/api";
import type {
  Monitor,
  ApiResponse,
  CreateMonitorRequest,
  UpdateMonitorRequest,
} from "@/types";
import { toast } from "@/components/ui/toast";
import { monitorKeys } from "./useMonitor";

// Create new monitor
export const useCreateMonitor = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: CreateMonitorRequest) => {
      const response = await apiClient.post<ApiResponse<Monitor>>(
        "/monitors",
        data
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to create monitor");
      }
      return response.data.data;
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Monitor created successfully",
        });
        // Invalidate monitors list
        queryClient.invalidateQueries(monitorKeys.all);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create monitor",
          variant: "destructive",
        });
      },
    }
  );
};

// Update monitor
export const useUpdateMonitor = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: UpdateMonitorRequest) => {
      const response = await apiClient.put<ApiResponse<Monitor>>(
        `/monitors/${id}`,
        data
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to update monitor");
      }
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        toast({
          title: "Success",
          description: "Monitor updated successfully",
        });
        // Update both the list and the detail view
        queryClient.invalidateQueries(monitorKeys.all);
        queryClient.invalidateQueries(monitorKeys.detail(id));
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update monitor",
          variant: "destructive",
        });
      },
    }
  );
};

// Create alert for monitor
export const useCreateMonitorAlert = (monitorId: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: { email: string }) => {
      const response = await apiClient.post<ApiResponse<any>>(`/alerts`, {
        monitor_id: monitorId,
        email: data.email,
      });
      if (!response.data.success) {
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
        // Invalidate alerts list for this monitor
        queryClient.invalidateQueries(["alerts", monitorId]);
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
