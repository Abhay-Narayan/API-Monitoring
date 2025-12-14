"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Mail,
  Globe,
  PlayCircle,
  PauseCircle,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import type { CreateAlertRequest } from "@/types";
import {
  useMonitorAlerts,
  useCreateAlert,
  useUpdateAlert,
  useDeleteAlert,
  useTestAlert,
} from "./api/useAlerts";

interface AlertManagerProps {
  monitorId: string;
  monitorName: string;
}

export default function AlertManager({
  monitorId,
  monitorName,
}: AlertManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateAlertRequest>({
    type: "email",
    target: "",
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: loading } = useMonitorAlerts(monitorId);

  // Alert mutations
  const { mutate: createAlert, isLoading: creating } =
    useCreateAlert(monitorId);
  const { mutate: updateAlert } = useUpdateAlert(monitorId);
  const { mutate: deleteAlert } = useDeleteAlert(monitorId);
  const { mutate: testAlert, isLoading: testing } = useTestAlert(monitorId);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.target.trim()) {
      return;
    }

    // Validate email format for email alerts
    if (formData.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.target)) {
        return;
      }
    }

    // Validate URL format for webhook alerts
    if (formData.type === "webhook") {
      try {
        new URL(formData.target);
      } catch {
        return;
      }
    }

    createAlert(formData, {
      onSuccess: () => {
        setFormData({ type: "email", target: "" });
        setShowCreateForm(false);
      },
    });
  };

  const handleDeleteAlert = (alertId: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;
    deleteAlert(alertId);
  };

  const handleToggleAlert = (alertId: string, isActive: boolean) => {
    updateAlert({ id: alertId, is_active: !isActive });
  };

  const handleTestAlert = (alertId: string) => {
    testAlert(alertId);
  };

  const getAlertTypeIcon = (type: string) => {
    return type === "email" ? (
      <Mail className="h-5 w-5" />
    ) : (
      <Globe className="h-5 w-5" />
    );
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

  const getAlertTypeLabel = (type: string) => {
    return type === "email" ? "Email" : "Webhook";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Loading alerts...
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
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>
              Configure email and webhook alerts for {monitorName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Alert Form */}
        {showCreateForm ? (
          <form
            onSubmit={handleCreateAlert}
            className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <Plus className="h-4 w-4" />
              </div>
              <h4 className="text-lg font-medium">Create New Alert</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Alert Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "email" | "webhook",
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="email">Email</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {formData.type === "email" ? "Email Address" : "Webhook URL"}
                </label>
                <Input
                  type={formData.type === "email" ? "email" : "url"}
                  value={formData.target}
                  onChange={(e) =>
                    setFormData({ ...formData, target: e.target.value })
                  }
                  placeholder={
                    formData.type === "email"
                      ? "your-email@example.com"
                      : "https://your-webhook-url.com/endpoint"
                  }
                  required
                  className="bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Alert
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ type: "email", target: "" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-4">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Alert
            </Button>
          </div>
        )}

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mx-auto mb-4">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No alerts configured
            </p>
            <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Add an email or webhook alert to get notified when this monitor
              goes down or recovers.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                      {getAlertTypeIcon(alert.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {getAlertTypeLabel(alert.type)}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            alert.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {alert.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                        {alert.target}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Created {formatDate(alert.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestAlert(alert.id)}
                      disabled={testing}
                      className="bg-white dark:bg-slate-800"
                    >
                      {testing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>Test</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleAlert(alert.id, alert.is_active)
                      }
                      className={`bg-white dark:bg-slate-800 ${
                        alert.is_active
                          ? "text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                          : "text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                      }`}
                    >
                      {alert.is_active ? (
                        <>
                          <PauseCircle className="h-4 w-4 mr-2" />
                          <span>Disable</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          <span>Enable</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="bg-white dark:bg-slate-800 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alert Information */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">
                  How Alerts Work
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Learn about alert triggers and notifications
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>
                    Alerts trigger after 3 consecutive monitor failures
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>Email alerts require valid SMTP configuration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>
                    Webhook alerts send POST requests with monitor data
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>
                    There's a 30-minute cooldown between alert notifications
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>
                    Recovery notifications are sent when monitors come back
                    online
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
