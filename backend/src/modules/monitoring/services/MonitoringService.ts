import * as cron from "node-cron";
import axios from "axios";
import { supabase } from "@/config/database";
import { logger } from "@/shared/utils/logger";
import { AlertService } from "../../alerts/services/AlertService";
import type { Monitor, MonitorCheck } from "@/types";

interface ScheduledJob {
  monitorId: string;
  job: cron.ScheduledTask;
  interval: number;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async startScheduler(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Monitoring scheduler already running");
      return;
    }

    this.isRunning = true;
    logger.info("Starting monitoring scheduler...");

    // Load all active monitors
    await this.loadActiveMonitors();

    logger.info(
      `Monitoring scheduler started with ${this.scheduledJobs.size} active monitors`
    );
  }

  stopScheduler(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info("Stopping monitoring scheduler...");

    // Stop all scheduled jobs
    for (const [monitorId, scheduledJob] of this.scheduledJobs) {
      scheduledJob.job.stop();
      // scheduledJob.job.destroy(); // destroy method doesn't exist on ScheduledTask
    }

    this.scheduledJobs.clear();
    this.isRunning = false;

    logger.info("Monitoring scheduler stopped");
  }

  async addMonitor(monitor: Monitor): Promise<void> {
    if (!monitor.is_active) {
      logger.debug("Skipping inactive monitor", { monitorId: monitor.id });
      return;
    }

    // Remove existing job if any
    await this.removeMonitor(monitor.id);

    try {
      // Create cron expression for the interval
      const cronExpression = this.createCronExpression(
        monitor.interval_minutes
      );

      // Schedule the monitor check
      const job = cron.schedule(
        cronExpression,
        async () => {
          await this.performCheck(monitor);
        },
        {
          scheduled: false,
        }
      );

      // Start the job
      job.start();

      // Store the scheduled job
      this.scheduledJobs.set(monitor.id, {
        monitorId: monitor.id,
        job,
        interval: monitor.interval_minutes,
      });

      logger.info("Monitor scheduled", {
        monitorId: monitor.id,
        name: monitor.name,
        interval: monitor.interval_minutes,
        cronExpression,
      });

      // Perform initial check
      setImmediate(() => this.performCheck(monitor));
    } catch (error) {
      logger.error("Failed to schedule monitor", error, {
        monitorId: monitor.id,
      });
    }
  }

  async updateMonitor(monitor: Monitor): Promise<void> {
    if (!monitor.is_active) {
      await this.removeMonitor(monitor.id);
      return;
    }

    // Check if interval changed
    const existing = this.scheduledJobs.get(monitor.id);
    if (existing && existing.interval === monitor.interval_minutes) {
      logger.debug("Monitor interval unchanged, no update needed", {
        monitorId: monitor.id,
      });
      return;
    }

    // Re-add monitor with new schedule
    await this.addMonitor(monitor);
  }

  async removeMonitor(monitorId: string): Promise<void> {
    const scheduledJob = this.scheduledJobs.get(monitorId);

    if (scheduledJob) {
      scheduledJob.job.stop();
      // scheduledJob.job.destroy(); // destroy method doesn't exist on ScheduledTask
      this.scheduledJobs.delete(monitorId);

      logger.info("Monitor removed from scheduler", { monitorId });
    }
  }

  async performCheck(monitor: Monitor): Promise<MonitorCheck> {
    const startTime = Date.now();
    let result: MonitorCheck;

    logger.monitor(monitor.id, monitor.url, "success", undefined, undefined);

    try {
      // Prepare request configuration
      const config: any = {
        method: monitor.method.toLowerCase(),
        url: monitor.url,
        timeout: monitor.timeout_seconds * 1000,
        headers: {
          "User-Agent": "API-Monitor/1.0",
          ...monitor.headers,
        },
        validateStatus: () => true, // Accept any status code
        maxRedirects: 5,
      };

      // Add body for POST/PUT/PATCH requests
      if (monitor.body && ["POST", "PUT", "PATCH"].includes(monitor.method)) {
        config.data = monitor.body;

        // Set content-type if not already set
        if (
          !config.headers["Content-Type"] &&
          !config.headers["content-type"]
        ) {
          config.headers["Content-Type"] = "application/json";
        }
      }

      // Perform the HTTP request
      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      // Check if status code is expected
      const isExpectedStatus = monitor.expected_status_codes.includes(
        response.status
      );

      // Check keyword validation if specified
      let isKeywordValid = true;
      if (monitor.keyword_validation && response.data) {
        const responseText =
          typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data);
        isKeywordValid = responseText.includes(monitor.keyword_validation);
      }

      const isUp = isExpectedStatus && isKeywordValid;

      // Create check result
      result = {
        id: crypto.randomUUID(),
        monitor_id: monitor.id,
        status_code: response.status,
        response_time_ms: responseTime,
        is_up: isUp,
        error_message: !isUp
          ? !isExpectedStatus
            ? `Unexpected status code: ${response.status}`
            : "Keyword validation failed"
          : undefined,
        response_snippet: this.getResponseSnippet(response.data),
        checked_at: new Date().toISOString(),
      };

      logger.monitor(
        monitor.id,
        monitor.url,
        isUp ? "success" : "failure",
        responseTime,
        result.error_message
      );
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      let errorMessage = "Unknown error";
      if (error.code === "ECONNABORTED") {
        errorMessage = `Request timeout after ${monitor.timeout_seconds}s`;
      } else if (error.code === "ENOTFOUND") {
        errorMessage = "Domain not found";
      } else if (error.code === "ECONNREFUSED") {
        errorMessage = "Connection refused";
      } else if (error.code === "ETIMEDOUT") {
        errorMessage = "Connection timeout";
      } else if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      result = {
        id: crypto.randomUUID(),
        monitor_id: monitor.id,
        status_code: error.response?.status || 0,
        response_time_ms: responseTime,
        is_up: false,
        error_message: errorMessage,
        response_snippet: error.response
          ? this.getResponseSnippet(error.response.data)
          : undefined,
        checked_at: new Date().toISOString(),
      };

      logger.monitor(
        monitor.id,
        monitor.url,
        "failure",
        responseTime,
        errorMessage
      );
    }

    // Store check result in database
    await this.storeCheckResult(result);

    // Trigger alerts if needed
    if (!result.is_up) {
      const alertService = AlertService.getInstance();
      await alertService.handleMonitorFailure(monitor.id);
    } else {
      // Reset alert state on successful check
      const alertService = AlertService.getInstance();
      await alertService.handleMonitorRecovery(monitor.id);
    }

    return result;
  }

  private async loadActiveMonitors(): Promise<void> {
    try {
      const { data: monitors, error } = await supabase
        .from("monitors")
        .select("*")
        .eq("is_active", true);

      if (error) {
        logger.error("Failed to load active monitors", error);
        return;
      }

      // Schedule each active monitor
      for (const monitor of monitors || []) {
        await this.addMonitor(monitor);
      }

      logger.info(`Loaded ${monitors?.length || 0} active monitors`);
    } catch (error) {
      logger.error("Failed to load active monitors", error);
    }
  }

  private createCronExpression(intervalMinutes: number): string {
    if (intervalMinutes < 1) {
      throw new Error("Interval must be at least 1 minute");
    }

    // For intervals that divide evenly into 60 minutes, use minute-based cron
    if (60 % intervalMinutes === 0) {
      return `*/${intervalMinutes} * * * *`;
    }

    // For other intervals, run every minute and use a counter approach
    // This is a simplified version - in production you might want more sophisticated scheduling
    return `*/${Math.max(1, Math.floor(intervalMinutes))} * * * *`;
  }

  private async storeCheckResult(result: MonitorCheck): Promise<void> {
    try {
      const { error } = await supabase.from("monitor_checks").insert([
        {
          id: result.id,
          monitor_id: result.monitor_id,
          status_code: result.status_code,
          response_time_ms: result.response_time_ms,
          is_up: result.is_up,
          error_message: result.error_message,
          response_snippet: result.response_snippet,
          checked_at: result.checked_at,
        },
      ]);

      if (error) {
        logger.error("Failed to store check result", error, {
          monitorId: result.monitor_id,
        });
      }
    } catch (error) {
      logger.error("Failed to store check result", error, {
        monitorId: result.monitor_id,
      });
    }
  }

  private getResponseSnippet(data: any): string | undefined {
    if (!data) return undefined;

    try {
      const text = typeof data === "string" ? data : JSON.stringify(data);
      // Return first 500 characters
      return text.length > 500 ? text.substring(0, 500) + "..." : text;
    } catch {
      return "[Unable to parse response]";
    }
  }

  // Public methods for statistics
  getActiveMonitorCount(): number {
    return this.scheduledJobs.size;
  }

  getScheduledJobs(): string[] {
    return Array.from(this.scheduledJobs.keys());
  }

  isMonitorScheduled(monitorId: string): boolean {
    return this.scheduledJobs.has(monitorId);
  }
}
