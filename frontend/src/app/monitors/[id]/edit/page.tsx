"use client";

import { useEffect, useState } from "react";
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
import type { UpdateMonitorRequest } from "@/types";
import { useMonitor } from "../../api/useMonitor";
import { useUpdateMonitor } from "../../api/useMonitorMutations";
import { toast } from "@/components/ui/toast";
import {
  Settings,
  Edit,
  ArrowLeft,
  Globe,
  Server,
  Activity,
} from "lucide-react";

export default function EditMonitorPage({
  params,
}: {
  params: { id: string };
}) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: monitor, isLoading: loading, isError } = useMonitor(params.id);
  const { mutate: updateMonitor, isLoading: updating } = useUpdateMonitor(
    params.id
  );
  const [formData, setFormData] = useState<UpdateMonitorRequest>({});

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

  useEffect(() => {
    if (monitor) {
      setFormData({
        name: monitor.name,
        url: monitor.url,
        method: monitor.method,
        headers: monitor.headers,
        body: monitor.body,
        interval_minutes: monitor.interval_minutes,
        timeout_seconds: monitor.timeout_seconds,
        expected_status_codes: monitor.expected_status_codes,
        keyword_validation: monitor.keyword_validation,
        is_active: monitor.is_active,
      });
    }
  }, [monitor]);

  const handleInputChange = (field: keyof UpdateMonitorRequest, value: any) => {
    setFormData((prev: UpdateMonitorRequest) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHeadersChange = (value: string) => {
    try {
      const headers = value ? JSON.parse(value) : {};
      handleInputChange("headers", headers);
    } catch {
      // keep invalid JSON as-is
    }
  };

  const handleStatusCodesChange = (value: string) => {
    try {
      const codes = value
        .split(",")
        .map((code) => parseInt(code.trim()))
        .filter((code) => !isNaN(code));
      handleInputChange("expected_status_codes", codes);
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url) {
      toast({
        title: "Validation Error",
        description: "Name and URL are required",
        variant: "destructive",
      });
      return;
    }

    updateMonitor(formData, {
      onSuccess: () => router.push(`/monitors/${params.id}`),
    });
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
              Loading...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated || !monitor) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/30">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-60"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href={`/monitors/${monitor.id}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-3">
                    <span>Edit Monitor</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      <Globe className="h-3 w-3 mr-1" />
                      {monitor.url}
                    </span>
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Configure your API endpoint monitoring settings
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-12 gap-8">
                  {/* Left Column - Basic Information */}
                  <div className="col-span-4 space-y-6">
                    <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          Basic Information
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Core settings for your monitor
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          handleInputChange("is_active", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          Active Monitor
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Enable or disable monitoring
                        </p>
                      </div>
                    </label>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Monitor Name *
                        </label>
                        <Input
                          value={formData.name || ""}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder="My API Monitor"
                          required
                          className="h-11"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          URL *
                        </label>
                        <Input
                          type="url"
                          value={formData.url || ""}
                          onChange={(e) =>
                            handleInputChange("url", e.target.value)
                          }
                          placeholder="https://api.example.com/health"
                          required
                          className="h-11 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          HTTP Method
                        </label>
                        <select
                          value={formData.method || "GET"}
                          onChange={(e) =>
                            handleInputChange("method", e.target.value)
                          }
                          className="w-full h-11 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                          <option value="PATCH">PATCH</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Request Configuration */}
                  <div className="col-span-4 space-y-6">
                    <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          Request Configuration
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Headers and body settings
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Headers (JSON)
                        </label>
                        <textarea
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono text-sm"
                          rows={3}
                          placeholder='{"Authorization": "Bearer token"}'
                          defaultValue={
                            formData.headers
                              ? JSON.stringify(formData.headers, null, 2)
                              : ""
                          }
                          onChange={(e) => handleHeadersChange(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          Enter headers as a JSON object
                        </p>
                      </div>

                      {(formData.method === "POST" ||
                        formData.method === "PUT" ||
                        formData.method === "PATCH") && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Request Body
                          </label>
                          <textarea
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono text-sm"
                            rows={4}
                            placeholder="Enter request body..."
                            value={formData.body || ""}
                            onChange={(e) =>
                              handleInputChange("body", e.target.value)
                            }
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            The request body to send
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Monitoring Settings */}
                  <div className="col-span-4 space-y-6">
                    <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                        <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          Monitoring Settings
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Intervals and validation
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Check Interval (minutes)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="1440"
                          value={formData.interval_minutes || 5}
                          onChange={(e) =>
                            handleInputChange(
                              "interval_minutes",
                              parseInt(e.target.value)
                            )
                          }
                          className="h-11"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          How often to check
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Timeout (seconds)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="300"
                          value={formData.timeout_seconds || 30}
                          onChange={(e) =>
                            handleInputChange(
                              "timeout_seconds",
                              parseInt(e.target.value)
                            )
                          }
                          className="h-11"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          Maximum wait time
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Expected Status Codes
                        </label>
                        <Input
                          placeholder="200, 201, 202, 204"
                          value={
                            formData.expected_status_codes?.join(", ") || ""
                          }
                          onChange={(e) =>
                            handleStatusCodesChange(e.target.value)
                          }
                          className="h-11 font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          Acceptable HTTP codes
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Keyword Validation
                        </label>
                        <Input
                          placeholder="success"
                          value={formData.keyword_validation || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "keyword_validation",
                              e.target.value
                            )
                          }
                          className="h-11 font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          Response keyword check
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Link href={`/monitors/${monitor.id}`}>
                    <Button variant="outline" type="button" className="px-8">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 px-8"
                  >
                    {updating ? "Updating..." : "Update Monitor"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
