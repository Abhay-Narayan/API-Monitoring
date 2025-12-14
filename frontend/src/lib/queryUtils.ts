import { useQueryClient } from "react-query";
import { monitorKeys } from "@/app/monitors/api/useMonitor";
import { dashboardKeys } from "@/app/dashboard/api/useDashboard";
import { alertKeys } from "@/components/alerts/api/useAlerts";
import type { Monitor } from "@/types";

// Prefetch monitor details
export const usePrefetchMonitor = () => {
  const queryClient = useQueryClient();

  return (monitorId: string) => {
    // Prefetch monitor details
    queryClient.prefetchQuery(monitorKeys.detail(monitorId));
    // Prefetch monitor checks
    queryClient.prefetchQuery(monitorKeys.checks(monitorId));
    // Prefetch monitor alerts
    queryClient.prefetchQuery(alertKeys.list(monitorId));
  };
};

// Prefetch dashboard data
export const usePrefetchDashboard = () => {
  const queryClient = useQueryClient();

  return () => {
    // Prefetch overview
    queryClient.prefetchQuery(dashboardKeys.overview());
    // Prefetch recent activity
    queryClient.prefetchQuery(dashboardKeys.recentActivity());
    // Prefetch system stats
    queryClient.prefetchQuery(dashboardKeys.systemStats());
  };
};

// Optimistic updates for monitor toggle
export const useOptimisticMonitorToggle = () => {
  const queryClient = useQueryClient();

  return (monitorId: string) => {
    // Get current monitor data
    const monitor = queryClient.getQueryData<Monitor>(
      monitorKeys.detail(monitorId)
    );
    if (!monitor) return;

    // Optimistically update monitor status
    queryClient.setQueryData(monitorKeys.detail(monitorId), {
      ...monitor,
      is_active: !monitor.is_active,
    });

    // Update monitors list
    queryClient.setQueriesData(monitorKeys.all, (old: any) => {
      if (!old?.items) return old;
      return {
        ...old,
        items: old.items.map((m: Monitor) =>
          m.id === monitorId ? { ...m, is_active: !m.is_active } : m
        ),
      };
    });
  };
};

// Optimistic updates for alert creation
export const useOptimisticAlertCreate = () => {
  const queryClient = useQueryClient();

  return (monitorId: string, email: string) => {
    // Get current alerts
    const alerts =
      queryClient.getQueryData<any[]>(alertKeys.list(monitorId)) || [];

    // Create temporary alert
    const tempAlert = {
      id: "temp-" + Date.now(),
      monitor_id: monitorId,
      email,
      created_at: new Date().toISOString(),
    };

    // Optimistically add new alert
    queryClient.setQueryData(alertKeys.list(monitorId), [...alerts, tempAlert]);
  };
};

// Error retry configuration
export const errorRetryConfig = {
  retries: 2,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Cache configuration for different types of data
export const cacheConfig = {
  // User data - cache forever until logout
  user: {
    staleTime: Infinity,
    cacheTime: Infinity,
  },
  // Monitor data - cache for 1 minute
  monitor: {
    staleTime: 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  },
  // Real-time data - cache for 30 seconds
  realtime: {
    staleTime: 30 * 1000,
    cacheTime: 60 * 1000,
  },
};
