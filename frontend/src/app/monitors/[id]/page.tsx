"use client";

import { useEffect } from "react";
import { useAuth } from "@/modules/auth/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AlertManager from "@/components/alerts/AlertManager";
import AlertLogs from "@/components/alerts/AlertLogs";
import type { Monitor, MonitorStats, MonitorCheck } from "@/types";
import {
  useMonitor,
  useMonitorChecks,
  useToggleMonitor,
  useTestMonitor,
  useDeleteMonitor,
  monitorKeys,
} from "../api/useMonitor";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Globe,
  Monitor as MonitorIcon,
  Settings,
  TrendingUp,
  Zap,
  Edit,
  ArrowLeft,
  RefreshCw,
  Eye,
  AlertCircle,
  Calendar,
  Server,
} from "lucide-react";
import { useQueryClient } from "react-query";

interface MonitorWithStats extends Monitor {
  stats: MonitorStats;
}

export default function MonitorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    data: monitor,
    isLoading: loading,
    isError,
    isFetching: refreshing,
    refetch: refetchMonitor,
  } = useMonitor(params.id);
  const {
    data: checks = [],
    isLoading: checksLoading,
    refetch: refetchChecks,
  } = useMonitorChecks(params.id);

  const { mutate: toggleMonitor } = useToggleMonitor();
  const { mutate: testMonitor } = useTestMonitor();
  const { mutate: deleteMonitor } = useDeleteMonitor();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isError) {
      router.push("/monitors");
    }
  }, [isError, router]);

  const handleToggleMonitor = () => {
    if (!monitor) return;
    toggleMonitor(monitor.id);
  };

  const handleTestMonitor = () => {
    if (!monitor) return;
    testMonitor(monitor.id);
  };

  const handleDeleteMonitor = () => {
    if (!monitor) return;
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    deleteMonitor(monitor.id, {
      onSuccess: () => router.push("/monitors"),
    });
  };

  const formatUptime = (uptime: number | null | undefined) => {
    if (uptime == null) return "0.00%";
    return `${(uptime * 100).toFixed(2)}%`;
  };

  const formatResponseTime = (time: number | null | undefined) => {
    if (time == null) return "0ms";
    return `${time.toFixed(0)}ms`;
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

  const getStatusColor = (isUp: boolean) => {
    return isUp ? "text-green-600" : "text-red-600";
  };

  const getStatusBg = (isUp: boolean) => {
    return isUp ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Loading monitor details...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated || !monitor) {
    return null;
  }

  const getStatusIcon = (isUp: boolean | undefined) => {
    return isUp ? (
      <CheckCircle className="h-6 w-6 text-green-500" />
    ) : (
      <AlertCircle className="h-6 w-6 text-red-500" />
    );
  };

  const getStatusBadge = (isUp: boolean | undefined) => {
    return isUp ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
        <CheckCircle className="h-4 w-4 mr-1" />
        Online
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        <AlertCircle className="h-4 w-4 mr-1" />
        Offline
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      POST: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      PATCH:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
          colors[method as keyof typeof colors] || colors.GET
        }`}
      >
        {method}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/30">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-60"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6">
              <Link
                href="/monitors"
                className="inline-flex items-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Monitors
              </Link>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-xl shadow-blue-500/25">
                    <MonitorIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                      {monitor.name}
                    </h1>
                    <div className="flex items-center space-x-3 mt-2">
                      {getStatusBadge(monitor.stats?.last_check?.is_up)}
                      {getMethodBadge(monitor.method)}
                      <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        <Clock className="h-3 w-3 mr-1" />
                        {monitor.interval_minutes}m interval
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-slate-400" />
                  <p className="text-lg text-slate-600 dark:text-slate-300 font-mono">
                    {monitor.url}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 ml-6">
                <Button
                  variant="outline"
                  onClick={handleTestMonitor}
                  className="flex items-center space-x-2"
                >
                  <Activity className="h-4 w-4" />
                  <span>Test Now</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    refetchMonitor();
                    refetchChecks();
                  }}
                  disabled={refreshing}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </Button>
                <Link href={`/monitors/${monitor.id}/edit` as any}>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 flex items-center space-x-2">
                    <Edit className="h-4 w-4" />
                    <span>Edit Monitor</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      24h Uptime
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {formatUptime(monitor.stats.uptime_24h)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      7d Uptime
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {formatUptime(monitor.stats.uptime_7d)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Avg Response
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {formatResponseTime(monitor.stats.avg_response_time_24h)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                    <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Total Checks
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {monitor.stats.total_checks ?? 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                    <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid Layout for Remaining Content */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Monitor Configuration */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    Configuration
                  </CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Monitor settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Method:
                  </span>
                  {getMethodBadge(monitor.method)}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Interval:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {monitor.interval_minutes}m
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Timeout:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {monitor.timeout_seconds}s
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Expected Status:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {monitor.expected_status_codes.join(", ")}
                  </span>
                </div>
                {monitor.keyword_validation && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Keyword:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      "{monitor.keyword_validation}"
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last Check */}
            {monitor.stats.last_check && (
              <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        monitor.stats.last_check.is_up
                          ? "bg-green-100 dark:bg-green-900/20"
                          : "bg-red-100 dark:bg-red-900/20"
                      }`}
                    >
                      {monitor.stats.last_check.is_up ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                      Last Check
                    </CardTitle>
                  </div>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Most recent monitoring result
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Status:
                    </span>
                    {getStatusBadge(monitor.stats.last_check.is_up)}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Status Code:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {monitor.stats.last_check.status_code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Response Time:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatResponseTime(
                        monitor.stats.last_check.response_time_ms
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Checked At:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatDate(monitor.stats.last_check.checked_at)}
                    </span>
                  </div>
                  {monitor.stats.last_check.error_message && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                        Error Message:
                      </p>
                      <p className="text-red-600 dark:text-red-400 text-sm break-words">
                        {monitor.stats.last_check.error_message}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Monitor Actions */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    Actions
                  </CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Manage your monitor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleToggleMonitor}
                  className={`w-full ${
                    monitor.is_active
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {monitor.is_active ? "Pause Monitor" : "Start Monitor"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteMonitor}
                  className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  Delete Monitor
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Management */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <AlertManager monitorId={monitor.id} monitorName={monitor.name} />
            <AlertLogs monitorId={monitor.id} />
          </div>

          {/* Recent Checks */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Recent Checks
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Latest monitoring results for this endpoint (Last 24 Hours)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checksLoading ? (
                <div className="text-center py-12">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Loading checks...
                  </p>
                </div>
              ) : checks.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-300 text-lg">
                    No checks available yet
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                    Monitor checks will appear here once monitoring begins
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checks.slice(0, 10).map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBg(
                            check.is_up
                          )}`}
                        >
                          {check.is_up ? "UP" : "DOWN"}
                        </span>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-slate-600 dark:text-slate-300">
                            Status:{" "}
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {check.status_code}
                            </span>
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            Response:{" "}
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {formatResponseTime(check.response_time_ms)}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {formatDate(check.checked_at)}
                        </p>
                        {check.error_message && (
                          <p className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate mt-1">
                            {check.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
