#!/usr/bin/env tsx

import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import { MigrationRunner } from "@/shared/database/migrationRunner";
import { logger } from "@/shared/utils/logger";
import { config } from "@/config/environment";

async function main() {
  const command = process.argv[2];
  const moduleOrParam = process.argv[3];
  const migrationRunner = new MigrationRunner();

  try {
    switch (command) {
      case "up":
      case "run":
        if (moduleOrParam && moduleOrParam.startsWith("--module=")) {
          const module = moduleOrParam.replace("--module=", "");
          console.log(`🚀 Running migrations for module: ${module}...\n`);
          await migrationRunner.runMigrations(module);
        } else if (moduleOrParam && !moduleOrParam.startsWith("-")) {
          // Treat as module name for backward compatibility
          console.log(
            `🚀 Running migrations for module: ${moduleOrParam}...\n`
          );
          await migrationRunner.runMigrations(moduleOrParam);
        } else {
          console.log("🚀 Running all database migrations...\n");
          await migrationRunner.runMigrations();
        }
        console.log("✅ Migrations completed successfully!\n");
        break;

      case "status":
        if (moduleOrParam && moduleOrParam.startsWith("--module=")) {
          const module = moduleOrParam.replace("--module=", "");
          await migrationRunner.status(module);
        } else if (moduleOrParam && !moduleOrParam.startsWith("-")) {
          // Treat as module name for backward compatibility
          await migrationRunner.status(moduleOrParam);
        } else {
          await migrationRunner.status();
        }
        break;

      case "modules":
      case "list":
        await migrationRunner.listModules();
        break;

      case "rollback":
      case "down":
        const migrationId = process.argv[3];
        if (migrationId === "all" || migrationId === undefined) {
          console.log("🔄 Rolling back ALL migrations...\n");
          await migrationRunner.rollback();
        } else {
          console.log(`🔄 Rolling back migration: ${migrationId}...\n`);
          await migrationRunner.rollback(migrationId);
        }
        console.log("✅ Rollback completed successfully!\n");
        break;

      default:
        console.log(`
📋 Migration Commands:

🚀 UP MIGRATIONS:
  npm run migrate up [module]           - Run all pending migrations (or for specific module)
  npm run migrate up --module=auth      - Run migrations for specific module

🔄 DOWN MIGRATIONS:
  npm run migrate down                  - Rollback ALL migrations (DESTRUCTIVE!)
  npm run migrate down all              - Rollback ALL migrations (DESTRUCTIVE!)
  npm run migrate down [migration_id]   - Rollback specific migration and all after it
  npm run migrate rollback [id]         - Alias for 'down' command

📊 STATUS & INFO:
  npm run migrate status [module]       - Show migration status (all or specific module)
  npm run migrate modules               - List all available modules

Examples:
  npm run migrate up                    - Run all pending migrations
  npm run migrate up auth               - Run only auth module migrations
  npm run migrate up --module=alerts   - Run only alerts module migrations
  npm run migrate status                - Show all migration status
  npm run migrate status monitoring     - Show monitoring module status
  npm run migrate modules               - List available modules
  
  npm run migrate down                  - ⚠️  DANGER: Rollback ALL migrations
  npm run migrate down auth_001_create_users_table - Rollback from specific migration

Environment: ${config.nodeEnv}
Database: ${config.supabase.url}
        `);
        break;
    }
  } catch (error: any) {
    logger.error("Migration command failed", error);
    console.error(`❌ Migration failed: ${error.message}`);
    process.exit(1);
  }
}

main();
