import nodemailer from "nodemailer";
import { supabase } from "@/config/database";
import { config } from "@/config/environment";
import { logger } from "@/shared/utils/logger";
import type { Alert, AlertLog, Monitor } from "@/types";

interface AlertState {
  monitorId: string;
  consecutiveFailures: number;
  lastAlertSent: Date | null;
  isInAlertState: boolean;
}

export class AlertService {
  private static instance: AlertService;
  private alertStates: Map<string, AlertState> = new Map();
  private emailTransporter: nodemailer.Transporter;

  private constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  async handleMonitorFailure(monitorId: string): Promise<void> {
    try {
      // Get or initialize alert state
      let alertState = this.alertStates.get(monitorId);
      if (!alertState) {
        alertState = {
          monitorId,
          consecutiveFailures: 0,
          lastAlertSent: null,
          isInAlertState: false,
        };
        this.alertStates.set(monitorId, alertState);
      }

      // Increment consecutive failures
      alertState.consecutiveFailures++;

      // Check if we should trigger alerts (after 3 consecutive failures)
      const failureThreshold = 3;
      if (alertState.consecutiveFailures >= failureThreshold) {
        // Check cooldown period
        const now = new Date();
        const cooldownMs = config.monitoring.alertCooldownMinutes * 60 * 1000;

        if (
          !alertState.lastAlertSent ||
          now.getTime() - alertState.lastAlertSent.getTime() >= cooldownMs
        ) {
          await this.triggerAlerts(monitorId);
          alertState.lastAlertSent = now;
          alertState.isInAlertState = true;

          logger.info("Alerts triggered for monitor failure", {
            monitorId,
            consecutiveFailures: alertState.consecutiveFailures,
          });
        } else {
          logger.debug("Alert cooldown active, skipping", {
            monitorId,
            cooldownRemainingMs:
              cooldownMs - (now.getTime() - alertState.lastAlertSent.getTime()),
          });
        }
      }
    } catch (error) {
      logger.error("Failed to handle monitor failure", error, { monitorId });
    }
  }

  async handleMonitorRecovery(monitorId: string): Promise<void> {
    const alertState = this.alertStates.get(monitorId);

    if (alertState) {
      const wasInAlertState = alertState.isInAlertState;

      // Reset failure count and alert state
      alertState.consecutiveFailures = 0;
      alertState.isInAlertState = false;

      // Send recovery notification if we were in alert state
      if (wasInAlertState) {
        await this.triggerRecoveryAlerts(monitorId);

        logger.info("Recovery alerts sent for monitor", { monitorId });
      }
    }
  }

  private async triggerAlerts(monitorId: string): Promise<void> {
    try {
      // Get monitor details
      const { data: monitor, error: monitorError } = await supabase
        .from("monitors")
        .select("*")
        .eq("id", monitorId)
        .single();

      if (monitorError || !monitor) {
        logger.error("Failed to get monitor for alerts", monitorError, {
          monitorId,
        });
        return;
      }

      // Get active alerts for this monitor
      const { data: alerts, error: alertsError } = await supabase
        .from("alerts")
        .select("*")
        .eq("monitor_id", monitorId)
        .eq("is_active", true);

      if (alertsError) {
        logger.error("Failed to get alerts for monitor", alertsError, {
          monitorId,
        });
        return;
      }

      // Send alerts
      for (const alert of alerts || []) {
        await this.sendAlert(alert, monitor, "failure");
      }
    } catch (error) {
      logger.error("Failed to trigger alerts", error, { monitorId });
    }
  }

  private async triggerRecoveryAlerts(monitorId: string): Promise<void> {
    try {
      // Get monitor details
      const { data: monitor, error: monitorError } = await supabase
        .from("monitors")
        .select("*")
        .eq("id", monitorId)
        .single();

      if (monitorError || !monitor) {
        logger.error(
          "Failed to get monitor for recovery alerts",
          monitorError,
          { monitorId }
        );
        return;
      }

      // Get active alerts for this monitor
      const { data: alerts, error: alertsError } = await supabase
        .from("alerts")
        .select("*")
        .eq("monitor_id", monitorId)
        .eq("is_active", true);

      if (alertsError) {
        logger.error("Failed to get alerts for monitor", alertsError, {
          monitorId,
        });
        return;
      }

      // Send recovery alerts
      for (const alert of alerts || []) {
        await this.sendAlert(alert, monitor, "recovery");
      }
    } catch (error) {
      logger.error("Failed to trigger recovery alerts", error, { monitorId });
    }
  }

  private async sendAlert(
    alert: Alert,
    monitor: Monitor,
    type: "failure" | "recovery"
  ): Promise<void> {
    const alertState = this.alertStates.get(monitor.id);
    const consecutiveFailures = alertState?.consecutiveFailures || 0;

    let success = false;
    let errorMessage: string | undefined;

    try {
      if (alert.type === "email") {
        await this.sendEmailAlert(alert, monitor, type, consecutiveFailures);
        success = true;
      } else if (alert.type === "webhook") {
        await this.sendWebhookAlert(alert, monitor, type, consecutiveFailures);
        success = true;
      }

      logger.alert("sent", alert.target, monitor.id);
    } catch (error: any) {
      errorMessage = error.message || "Unknown error";
      logger.alert("failed", alert.target, monitor.id, errorMessage);
    }

    // Log alert attempt
    await this.logAlert(alert.id, monitor.id, type, success, errorMessage);
  }

  private async sendEmailAlert(
    alert: Alert,
    monitor: Monitor,
    type: "failure" | "recovery",
    consecutiveFailures: number
  ): Promise<void> {
    const subject =
      type === "failure"
        ? `🚨 API Monitor Alert: ${monitor.name} is DOWN`
        : `✅ API Monitor Recovery: ${monitor.name} is UP`;

    const message =
      type === "failure"
        ? this.createFailureEmailMessage(monitor, consecutiveFailures)
        : this.createRecoveryEmailMessage(monitor);

    await this.emailTransporter.sendMail({
      from: `"${config.email.from.name}" <${config.email.from.email}>`,
      to: alert.target,
      subject,
      html: message,
    });
  }

  private async sendWebhookAlert(
    alert: Alert,
    monitor: Monitor,
    type: "failure" | "recovery",
    consecutiveFailures: number
  ): Promise<void> {
    const axios = require("axios");

    const payload = {
      event: type === "failure" ? "monitor.down" : "monitor.up",
      monitor: {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        method: monitor.method,
      },
      timestamp: new Date().toISOString(),
      consecutive_failures: consecutiveFailures,
    };

    await axios.post(alert.target, payload, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "API-Monitor-Webhook/1.0",
      },
    });
  }

  private createFailureEmailMessage(
    monitor: Monitor,
    consecutiveFailures: number
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Monitor Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; }
        .monitor-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .status { font-weight: bold; color: #dc2626; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 API Monitor Alert</h1>
        <p>Your API endpoint is experiencing issues</p>
    </div>
    <div class="content">
        <div class="monitor-info">
            <h3>${monitor.name}</h3>
            <p><strong>URL:</strong> ${monitor.url}</p>
            <p><strong>Method:</strong> ${monitor.method}</p>
            <p><strong>Status:</strong> <span class="status">DOWN</span></p>
            <p><strong>Consecutive Failures:</strong> ${consecutiveFailures}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>We detected that your API endpoint is not responding as expected. Please check your service and resolve any issues.</p>
        <p>You will receive a recovery notification once the endpoint is back online.</p>
    </div>
    <div class="footer">
        <p>This alert was sent by your API Monitoring service.</p>
    </div>
</body>
</html>
    `.trim();
  }

  private createRecoveryEmailMessage(monitor: Monitor): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Monitor Recovery</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; }
        .monitor-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .status { font-weight: bold; color: #16a34a; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ API Monitor Recovery</h1>
        <p>Your API endpoint is back online</p>
    </div>
    <div class="content">
        <div class="monitor-info">
            <h3>${monitor.name}</h3>
            <p><strong>URL:</strong> ${monitor.url}</p>
            <p><strong>Method:</strong> ${monitor.method}</p>
            <p><strong>Status:</strong> <span class="status">UP</span></p>
            <p><strong>Recovery Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>Great news! Your API endpoint is now responding normally again.</p>
        <p>We'll continue monitoring and will alert you if any issues occur.</p>
    </div>
    <div class="footer">
        <p>This recovery notification was sent by your API Monitoring service.</p>
    </div>
</body>
</html>
    `.trim();
  }

  private async logAlert(
    alertId: string,
    monitorId: string,
    type: "failure" | "recovery",
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const message =
        type === "failure"
          ? "Monitor failure alert sent"
          : "Monitor recovery alert sent";

      await supabase.from("alert_logs").insert([
        {
          alert_id: alertId,
          monitor_id: monitorId,
          message,
          sent_at: new Date().toISOString(),
          success,
          error_message: errorMessage,
        },
      ]);
    } catch (error) {
      logger.error("Failed to log alert", error, { alertId, monitorId });
    }
  }

  // Public methods for managing alerts
  async createAlert(
    monitorId: string,
    type: "email" | "webhook",
    target: string
  ): Promise<Alert> {
    const { data: alert, error } = await supabase
      .from("alerts")
      .insert([
        {
          monitor_id: monitorId,
          type,
          target,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error || !alert) {
      logger.error("Failed to create alert", error);
      throw new Error("Failed to create alert");
    }

    return alert;
  }

  async getMonitorAlerts(monitorId: string): Promise<Alert[]> {
    const { data: alerts, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("monitor_id", monitorId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to get monitor alerts", error);
      throw new Error("Failed to get alerts");
    }

    return alerts || [];
  }

  async deleteAlert(alertId: string): Promise<void> {
    const { error } = await supabase.from("alerts").delete().eq("id", alertId);

    if (error) {
      logger.error("Failed to delete alert", error);
      throw new Error("Failed to delete alert");
    }
  }

  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<Alert> {
    const { data: alert, error } = await supabase
      .from("alerts")
      .update(updates)
      .eq("id", alertId)
      .select()
      .single();

    if (error || !alert) {
      logger.error("Failed to update alert", error);
      throw new Error("Failed to update alert");
    }

    return alert;
  }

  async getAlertLogs(
    monitorId: string,
    options: { limit?: number; hours?: number } = {}
  ): Promise<AlertLog[]> {
    const { limit = 50, hours = 24 } = options;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: logs, error } = await supabase
      .from("alert_logs")
      .select(
        `
        *,
        alerts!inner(monitor_id)
      `
      )
      .eq("alerts.monitor_id", monitorId)
      .gte("sent_at", since)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Failed to get alert logs", error);
      throw new Error("Failed to get alert logs");
    }

    return logs || [];
  }

  async testAlert(alertId: string): Promise<void> {
    // Get alert details
    const { data: alert, error: alertError } = await supabase
      .from("alerts")
      .select(
        `
        *,
        monitors!inner(*)
      `
      )
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      logger.error("Failed to get alert for testing", alertError);
      throw new Error("Failed to get alert details");
    }

    // Send test alert
    await this.sendAlert(alert, alert.monitors, "test" as any);

    logger.info("Test alert sent", { alertId, target: alert.target });
  }

  async testEmailConfiguration(): Promise<boolean> {
    try {
      await this.emailTransporter.verify();
      return true;
    } catch (error) {
      logger.error("Email configuration test failed", error);
      return false;
    }
  }
}
