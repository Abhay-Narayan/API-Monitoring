"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import apiClient from "@/lib/api";
import type { AlertLog, ApiResponse } from "@/types";
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  History,
} from "lucide-react";

interface AlertLogsProps {
  monitorId: string;
}

export default function AlertLogs({ monitorId }: AlertLogsProps) {
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertLogs();
  }, [monitorId]);

  const fetchAlertLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<ApiResponse<AlertLog[]>>(
        `/alerts/monitor/${monitorId}/logs?limit=50&hours=168` // Last 7 days
      );

      if (response.data.success && response.data.data) {
        setLogs(response.data.data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch alert logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Recent alert notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-slate-600 dark:text-slate-300">
              Loading alert history...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
            <History className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Alert History</CardTitle>
            <CardDescription>Recent alert notifications</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mx-auto mb-4">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No alert history available
            </p>
            <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Alert notifications will appear here once they are sent
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getStatusIcon(log.success)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {log.message}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                            log.success
                          )}`}
                        >
                          {log.success ? "Sent" : "Failed"}
                        </span>
                      </div>
                      {log.error_message && (
                        <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="truncate">{log.error_message}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Sent {formatDate(log.sent_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
