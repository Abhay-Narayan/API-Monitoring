"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/modules/auth/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "@/components/ui/toast";
import type { Monitor } from "@/types";
import { useMonitorsList } from "./api/useMonitorsList";
import {
  useToggleMonitor,
  useTestMonitor,
  useDeleteMonitor,
} from "./api/useMonitor";
import {
  usePrefetchMonitor,
  useOptimisticMonitorToggle,
} from "@/lib/queryUtils";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Monitor as MonitorIcon,
  Plus,
  Search,
  Settings,
  Trash2,
  Eye,
  PlayCircle,
  PauseCircle,
  Edit,
  TrendingUp,
  Zap,
  RefreshCw,
} from "lucide-react";

interface MonitorsResponse {
  items: Monitor[];
  total: number;
  page: number;
  limit: number;
}

export default function MonitorsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const {
    data: monitorsData,
    isLoading: loading,
    isFetching: refreshing,
    refetch,
  } = useMonitorsList({
    page,
    search,
  });

  const prefetchMonitor = usePrefetchMonitor();

  const { mutate: toggleMonitor } = useToggleMonitor();
  const optimisticToggle = useOptimisticMonitorToggle();
  const { mutate: testMonitor } = useTestMonitor();
  const { mutate: deleteMonitor } = useDeleteMonitor();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleRefresh = () => {
    refetch();
  };

  const handleToggleMonitor = (monitorId: string) => {
    optimisticToggle(monitorId);
    toggleMonitor(monitorId);
  };

  const handleTestMonitor = (monitorId: string) => {
    testMonitor(monitorId);
  };

  const handleDeleteMonitor = (monitorId: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    deleteMonitor(monitorId);
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <PauseCircle className="h-5 w-5 text-gray-400" />
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
        Inactive
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
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          colors[method as keyof typeof colors] || colors.GET
        }`}
      >
        {method}
      </span>
    );
  };

  if (authLoading || !isAuthenticated) {
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
              Loading monitors...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/30">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-60"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-3">
                  <MonitorIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <span>API Monitors</span>
                </h1>
              </div>
              <Link href="/monitors/create">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Monitor
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <div className="relative flex items-center mb-8">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search monitors by name or URL..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 text-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-4 h-12 px-6"
            >
              <RefreshCw
                className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          {/* Monitors List */}
          {loading ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Loading monitors...
              </p>
            </div>
          ) : !monitorsData?.items || monitorsData.items.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-2xl shadow-blue-500/25">
                    <MonitorIcon className="h-10 w-10" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
                  {search ? "No monitors found" : "Start monitoring your APIs"}
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  {search
                    ? "No monitors match your search criteria. Try adjusting your search terms."
                    : "Create your first monitor to track API uptime, performance, and receive instant alerts when issues occur."}
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
          ) : (
            <div className="space-y-4">
              {monitorsData?.items.map((monitor) => (
                <div key={monitor.id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-blue-50/20 dark:from-slate-800/50 dark:to-blue-900/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Card className="relative border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm group-hover:border-blue-200/50 dark:group-hover:border-blue-800/50 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="relative flex-shrink-0">
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                  monitor.is_active
                                    ? "bg-green-500 shadow-sm shadow-green-500/50"
                                    : "bg-slate-300 dark:bg-slate-600"
                                }`}
                              >
                                {monitor.is_active && (
                                  <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75"></div>
                                )}
                              </div>
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white truncate">
                              {monitor.name}
                            </h3>
                            {getMethodBadge(monitor.method)}
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                              <Globe className="h-4 w-4 text-slate-400" />
                              <span className="font-mono truncate">
                                {monitor.url}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{monitor.interval_minutes}m interval</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Zap className="h-4 w-4" />
                              <span>{monitor.timeout_seconds}s timeout</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4" />
                              <span>
                                Status{" "}
                                {monitor.expected_status_codes.join(", ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                          <Button
                            variant="outline"
                            onClick={() => handleTestMonitor(monitor.id)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            <span>Test</span>
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleToggleMonitor(monitor.id)}
                            className={
                              monitor.is_active
                                ? "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50"
                                : "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50"
                            }
                          >
                            {monitor.is_active ? (
                              <>
                                <PauseCircle className="h-4 w-4 mr-2" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                <span>Start</span>
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(`/monitors/${monitor.id}`)
                            }
                            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            <span>View</span>
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(`/monitors/${monitor.id}/edit`)
                            }
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleDeleteMonitor(monitor.id)}
                            className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {(monitorsData?.total ?? 0) > 10 && (
            <div className="mt-12 flex items-center justify-center">
              <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-300 px-4">
                      Page {page} of{" "}
                      {Math.ceil((monitorsData?.total ?? 0) / 10)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={
                        page >= Math.ceil((monitorsData?.total ?? 0) / 10)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
