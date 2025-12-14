"use client";

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
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import type { DashboardData } from "@/types";
import {
  useDashboardOverview,
  useRecentActivity,
  useSystemStats,
} from "./api/useDashboard";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Globe,
  Monitor,
  Plus,
  RefreshCw,
  TrendingUp,
  Zap,
  ArrowUpRight,
  Eye,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    data: dashboardData,
    isLoading: dashLoading,
    refetch: refetchDashboard,
  } = useDashboardOverview();

  const {
    data: recentActivity = [],
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useRecentActivity();

  const { data: systemStats } = useSystemStats();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleRefresh = () => {
    refetchDashboard();
    refetchActivity();
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(1)}%`;
  };

  const formatResponseTime = (time: number) => {
    return `${time}ms`;
  };

  const getStatusColor = (isUp: boolean) => {
    return isUp ? "text-green-600" : "text-red-600";
  };

  const getStatusBg = (isUp: boolean) => {
    return isUp
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

  if (authLoading || dashLoading || activityLoading) {
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
              Loading your dashboard...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/30">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-60"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-2xl shadow-blue-500/25">
                  <Activity className="h-8 w-8" />
                </div>
              </div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent sm:text-6xl">
                Welcome back, {user?.email?.split("@")[0]}
              </h1>
              <p className="mt-6 text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Your comprehensive API monitoring dashboard providing real-time
                insights, performance metrics, and health status across all your
                endpoints
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <Link href="/monitors/create" className="group">
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <Card className="relative h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden group-hover:bg-white/90 dark:group-hover:bg-slate-900/90 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25">
                            <Plus className="h-6 w-6 text-white" />
                          </div>
                          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                            <ArrowUpRight className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                          Add Monitor
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                          Start monitoring a new API endpoint with uptime
                          tracking and alerts
                        </p>
                        <div className="mt-auto">
                          <div className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium">
                            Create Monitor
                            <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </Link>

              <Link href="/monitors" className="group">
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 dark:from-emerald-500/10 dark:to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <Card className="relative h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden group-hover:bg-white/90 dark:group-hover:bg-slate-900/90 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg shadow-emerald-500/25">
                            <Monitor className="h-6 w-6 text-white" />
                          </div>
                          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                            <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                          View Monitors
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                          Manage and track all your API monitoring endpoints in
                          one place
                        </p>
                        <div className="mt-auto">
                          <div className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                            View All
                            <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </Link>

              <div className="group">
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <Card className="relative h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden group-hover:bg-white/90 dark:group-hover:bg-slate-900/90 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                            <RefreshCw
                              className={`h-6 w-6 text-white ${
                                dashLoading || activityLoading
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                          </div>
                          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                            <ArrowUpRight className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                          Refresh Data
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                          Get the latest monitoring data and check results
                        </p>
                        <div className="mt-auto">
                          <button
                            onClick={handleRefresh}
                            disabled={dashLoading || activityLoading}
                            className="inline-flex items-center text-purple-600 dark:text-purple-400 font-medium disabled:opacity-60"
                          >
                            {dashLoading || activityLoading
                              ? "Refreshing..."
                              : "Refresh Now"}
                            <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {dashboardData && dashboardData.monitors.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Recent Monitors */}
              <div className="lg:col-span-2">
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 rounded-2xl blur-xl"></div>
                  <Card className="relative h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25">
                            <Activity className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                              Monitor Overview
                            </CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-300">
                              Real-time status of your API endpoints
                            </CardDescription>
                          </div>
                        </div>
                        <Link href="/monitors">
                          <Button
                            variant="outline"
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View All</span>
                            <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent className="h-[calc(100vh-24rem)] overflow-y-auto px-4">
                      <div className="space-y-3">
                        {dashboardData.monitors.map((monitor) => (
                          <div
                            key={monitor.id}
                            className="group p-4 bg-gradient-to-br from-slate-50 to-blue-50/10 dark:from-slate-800/50 dark:to-blue-900/10 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative flex items-center justify-center">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      monitor.stats.last_check?.is_up
                                        ? "bg-green-500 shadow-lg shadow-green-500/50"
                                        : "bg-red-500 shadow-lg shadow-red-500/50"
                                    }`}
                                  >
                                    {monitor.stats.last_check?.is_up && (
                                      <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-slate-900 dark:text-white">
                                      {monitor.name}
                                    </p>
                                    <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                                    {monitor.url}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {formatUptime(monitor.stats.uptime_24h)}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {formatResponseTime(
                                    monitor.stats.avg_response_time_24h
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5 rounded-2xl blur-xl"></div>
                  <Card className="relative h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                            Recent Activity
                          </CardTitle>
                          <CardDescription className="text-slate-600 dark:text-slate-300">
                            Latest monitoring check results
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="h-[calc(100vh-24rem)] overflow-y-auto px-4">
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 mx-auto mb-6">
                            <Clock className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                          </div>
                          <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                            No Recent Activity
                          </p>
                          <p className="text-slate-600 dark:text-slate-300">
                            Activity will appear here as your monitors run
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentActivity.map((activity) => (
                            <div
                              key={activity.id}
                              className="group p-3 bg-gradient-to-br from-slate-50 to-purple-50/10 dark:from-slate-800/50 dark:to-purple-900/10 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`px-2 py-1 text-xs font-medium rounded-lg ${
                                      activity.is_up
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                                  >
                                    <div className="flex items-center space-x-1">
                                      <div
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          activity.is_up
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                        }`}
                                      />
                                      <span>
                                        {activity.is_up ? "UP" : "DOWN"}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                                        {activity.monitor_name}
                                      </p>
                                      <ArrowUpRight className="h-3 w-3 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                                      <span className="font-medium">
                                        {activity.status_code}
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {formatResponseTime(
                                          activity.response_time_ms
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatDate(activity.checked_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            /* Welcome Message for New Users */
            <div className="text-center py-20">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-2xl shadow-blue-500/25">
                    <Monitor className="h-10 w-10" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
                  Start Monitoring Your APIs
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  Create your first monitor to track API uptime, performance,
                  and receive instant alerts when issues occur.
                </p>
                <Link href="/monitors/create">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 text-lg px-8 py-6"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    Create Your First Monitor
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
