"use client";

import { useState } from "react";
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
import type { CreateMonitorRequest } from "@/types";
import { useCreateMonitor } from "../api/useMonitorMutations";
import { useCreateAlert } from "@/components/alerts/api/useAlerts";
import { Plus, Globe, Settings, Bell } from "lucide-react";

export default function CreateMonitorPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<CreateMonitorRequest>({
    name: "",
    url: "",
    method: "GET",
    headers: {},
    body: "",
    interval_minutes: 5,
    timeout_seconds: 30,
    expected_status_codes: [200, 201, 202, 204],
    keyword_validation: "",
  });
  const [alertEmail, setAlertEmail] = useState("");
  const [createAlert, setCreateAlert] = useState(false);

  // Mutations
  const { mutateAsync: createMonitor, isLoading: creating } =
    useCreateMonitor();

  const handleInputChange = (field: keyof CreateMonitorRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHeadersChange = (value: string) => {
    try {
      const headers = value ? JSON.parse(value) : {};
      handleInputChange("headers", headers);
    } catch (error) {
      // Invalid JSON, keep as string for now
    }
  };

  const handleStatusCodesChange = (value: string) => {
    try {
      const codes = value
        .split(",")
        .map((code) => parseInt(code.trim()))
        .filter((code) => !isNaN(code));
      handleInputChange("expected_status_codes", codes);
    } catch (error) {
      // Invalid format
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url) {
      toast({
        title: "Validation Error",
        description: "Name and URL are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create monitor
      const monitor = await createMonitor(formData);

      // Create alert if requested
      if (createAlert && alertEmail.trim() && monitor) {
        try {
          const { mutateAsync: createAlertMutation } = useCreateAlert(
            monitor.id
          );
          await createAlertMutation({
            type: "email",
            target: alertEmail.trim(),
          });
          toast({
            title: "Success",
            description: "Monitor and email alert created successfully",
          });
        } catch {
          toast({
            title: "Monitor Created",
            description:
              "Monitor created, but failed to create alert. You can add alerts from the monitor details page.",
            variant: "destructive",
          });
        }
      }

      router.push("/monitors");
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create monitor",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
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

  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/30">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] opacity-60"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-xl shadow-blue-500/25">
                  <Plus className="h-6 w-6" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent sm:text-5xl">
                Create Monitor
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Set up monitoring for a new API endpoint with customizable
                alerts and performance tracking
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Monitor Configuration
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Configure your API endpoint monitoring settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        Basic Information
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Monitor Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="My API Monitor"
                        required
                        className="bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        URL *
                      </label>
                      <Input
                        type="url"
                        value={formData.url}
                        onChange={(e) =>
                          handleInputChange("url", e.target.value)
                        }
                        placeholder="https://api.example.com/health"
                        required
                        className="bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        HTTP Method
                      </label>
                      <select
                        value={formData.method}
                        onChange={(e) =>
                          handleInputChange("method", e.target.value)
                        }
                        className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </div>
                  </div>

                  {/* Request Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        Request Configuration
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Headers (JSON)
                      </label>
                      <textarea
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        rows={3}
                        placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                        onChange={(e) => handleHeadersChange(e.target.value)}
                      />
                    </div>

                    {(formData.method === "POST" ||
                      formData.method === "PUT" ||
                      formData.method === "PATCH") && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Request Body
                        </label>
                        <textarea
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          rows={4}
                          placeholder="Request body content"
                          value={formData.body}
                          onChange={(e) =>
                            handleInputChange("body", e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Monitoring Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        Monitoring Settings
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Check Interval (minutes)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="1440"
                          value={formData.interval_minutes}
                          onChange={(e) =>
                            handleInputChange(
                              "interval_minutes",
                              parseInt(e.target.value)
                            )
                          }
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Timeout (seconds)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="300"
                          value={formData.timeout_seconds}
                          onChange={(e) =>
                            handleInputChange(
                              "timeout_seconds",
                              parseInt(e.target.value)
                            )
                          }
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Expected Status Codes
                      </label>
                      <Input
                        placeholder="200, 201, 202, 204"
                        value={formData.expected_status_codes?.join(", ")}
                        onChange={(e) =>
                          handleStatusCodesChange(e.target.value)
                        }
                        className="bg-white dark:bg-slate-800"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        Comma-separated list of acceptable HTTP status codes
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Keyword Validation (optional)
                      </label>
                      <Input
                        placeholder="success"
                        value={formData.keyword_validation}
                        onChange={(e) =>
                          handleInputChange(
                            "keyword_validation",
                            e.target.value
                          )
                        }
                        className="bg-white dark:bg-slate-800"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        Check if response contains this keyword
                      </p>
                    </div>
                  </div>

                  {/* Alert Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        Email Alerts (Optional)
                      </h3>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={createAlert}
                          onChange={(e) => setCreateAlert(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Create email alert for this monitor
                        </span>
                      </label>
                    </div>

                    {createAlert && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          value={alertEmail}
                          onChange={(e) => setAlertEmail(e.target.value)}
                          placeholder="your-email@example.com"
                          className="bg-white dark:bg-slate-800"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          You'll receive notifications when this monitor goes
                          down
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Link href="/monitors">
                    <Button
                      variant="outline"
                      type="button"
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
                  >
                    {creating ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Create Monitor</span>
                      </div>
                    )}
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
