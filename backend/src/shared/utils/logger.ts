import { config } from "@/config/environment";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = config.nodeEnv === "development";

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);

    // Add emojis for visual clarity
    const emoji = this.getLevelEmoji(level);

    let formatted = `${emoji} [${timestamp}] ${levelUpper} ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }

    return formatted;
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case "error":
        return "🚨";
      case "warn":
        return "⚠️";
      case "info":
        return "ℹ️";
      case "debug":
        return "🐛";
      default:
        return "ℹ️";
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formatted = this.formatMessage(level, message, context);

    switch (level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "debug":
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error && {
        error: error.message || error,
        stack: error.stack,
      }),
    };

    this.log("error", message, errorContext);
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  // Helper methods for specific use cases
  http(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number
  ): void {
    const emoji =
      statusCode >= 200 && statusCode < 300
        ? "✅"
        : statusCode >= 400
        ? "❌"
        : "🔄";
    this.info(`${emoji} ${method} ${url}`, {
      statusCode,
      responseTime: `${responseTime}ms`,
    });
  }

  monitor(
    monitorId: string,
    url: string,
    status: "success" | "failure",
    responseTime?: number,
    error?: string
  ): void {
    const level = status === "success" ? "info" : "warn";
    const emoji = status === "success" ? "🚀" : "💥";
    const message = `${emoji} Monitor check ${status}: ${url}`;

    const context: LogContext = { monitorId };
    if (responseTime) context.responseTime = `${responseTime}ms`;
    if (error) context.error = error;

    this.log(level, message, context);
  }

  alert(
    type: "sent" | "failed",
    target: string,
    monitorId: string,
    error?: string
  ): void {
    const level = type === "sent" ? "info" : "error";
    const emoji = type === "sent" ? "📧" : "📵";
    const message = `${emoji} Alert ${type}: ${target}`;

    const context: LogContext = { monitorId };
    if (error) context.error = error;

    this.log(level, message, context);
  }
}

export const logger = new Logger();
