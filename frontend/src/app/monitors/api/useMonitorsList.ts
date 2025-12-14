import { useQuery } from "react-query";
import apiClient from "@/lib/api";
import type { Monitor, ApiResponse } from "@/types";
import { toast } from "@/components/ui/toast";
import { monitorKeys } from "./useMonitor";

interface MonitorsResponse {
  items: Monitor[];
  total: number;
  page: number;
  limit: number;
}

interface UseMonitorsListOptions {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
}

// Get monitors list with pagination and search
export const useMonitorsList = ({
  page = 1,
  limit = 10,
  search = "",
  activeOnly = false,
}: UseMonitorsListOptions = {}) => {
  return useQuery(
    [...monitorKeys.all, { page, limit, search, activeOnly }],
    async () => {
      const response = await apiClient.get<ApiResponse<MonitorsResponse>>(
        `/monitors?page=${page}&limit=${limit}&search=${search}&active_only=${activeOnly}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch monitors");
      }

      return response.data.data;
    },
    {
      keepPreviousData: true,
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch monitors",
          variant: "destructive",
        });
      },
    }
  );
};
