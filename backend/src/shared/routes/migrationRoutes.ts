import { Router, Request, Response } from "express";
import { MigrationRunner } from "@/shared/database/migrationRunner";
import { asyncHandler } from "@/shared/middleware/errorHandler";
import { logger } from "@/shared/utils/logger";

const router = Router();
const migrationRunner = new MigrationRunner();

// Migration endpoint (for free tier without shell access)
// Call this once via: POST https://your-backend.onrender.com/api/migrations/run
router.post(
  "/run",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      logger.info("Running migrations via API endpoint...");

      await migrationRunner.runMigrations();

      logger.info("Migrations completed successfully via API");

      res.json({
        success: true,
        message: "Migrations completed successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("Migration failed via API", error);
      res.status(500).json({
        success: false,
        message: "Migration failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  })
);

// Check migration status
router.get(
  "/status",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const migrations = await (migrationRunner as any).loadMigrations();
      const executedMigrations = await (
        migrationRunner as any
      ).getExecutedMigrations();

      const pendingMigrations = migrations.filter(
        (migration: any) => !executedMigrations.includes(migration.id)
      );

      res.json({
        success: true,
        data: {
          total: migrations.length,
          executed: executedMigrations.length,
          pending: pendingMigrations.length,
          pendingMigrations: pendingMigrations.map((m: any) => ({
            id: m.id,
            name: m.name,
            module: m.module,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("Failed to get migration status", error);
      res.status(500).json({
        success: false,
        message: "Failed to get migration status",
        error: error.message,
      });
    }
  })
);

export { router as migrationRoutes };
