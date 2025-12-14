import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server config
  PORT: z.string().default("3001"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // JWT config
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Supabase config
  SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Supabase service role key is required"),

  // Email config
  SMTP_HOST: z.string().min(1, "SMTP host is required"),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().email("Invalid SMTP user email"),
  SMTP_PASS: z.string().min(1, "SMTP password is required"),
  FROM_EMAIL: z.string().email("Invalid from email"),
  FROM_NAME: z.string().default("API Monitor"),

  // Frontend config
  FRONTEND_URL: z
    .string()
    .url("Invalid frontend URL")
    .default("http://localhost:3000"),

  // Monitoring config
  DEFAULT_CHECK_INTERVAL: z.string().default("5"),
  MAX_CHECKS_PER_USER: z.string().default("50"),
  ALERT_COOLDOWN_MINUTES: z.string().default("30"),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Environment validation failed:");
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join(".")}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

const env = parseEnv();

// Export typed configuration
export const config = {
  // Server
  port: parseInt(env.PORT, 10),
  nodeEnv: env.NODE_ENV,

  // JWT
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,

  // Supabase
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Email
  email: {
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: {
      email: env.FROM_EMAIL,
      name: env.FROM_NAME,
    },
  },

  // URLs
  frontendUrl: env.FRONTEND_URL,

  // Monitoring
  monitoring: {
    defaultCheckInterval: parseInt(env.DEFAULT_CHECK_INTERVAL, 10),
    maxChecksPerUser: parseInt(env.MAX_CHECKS_PER_USER, 10),
    alertCooldownMinutes: parseInt(env.ALERT_COOLDOWN_MINUTES, 10),
  },

  // Feature flags for easy toggling
  features: {
    enableWebhookAlerts: true,
    enableKeywordValidation: true,
    enableMultiStepChecks: false, // Future feature
    enableCsvExport: true,
  },
} as const;

export type Config = typeof config;
