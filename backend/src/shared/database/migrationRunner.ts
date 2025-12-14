import { supabase } from "@/config/database";
import { logger } from "@/shared/utils/logger";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

interface Migration {
  id: string;
  name: string;
  sql: string;
  module: string;
  timestamp: Date;
  downSql?: string;
}

export class MigrationRunner {
  private migrationsTable = "schema_migrations";

  async initialize(): Promise<void> {
    // Create migrations tracking table
    await this.createMigrationsTable();
  }

  private async createMigrationsTable(): Promise<void> {
    // Try to check if the table exists
    const { error, data } = await supabase
      .from(this.migrationsTable)
      .select("count")
      .limit(1);

    // If no error, table exists - we're good
    if (!error && data !== null) {
      return;
    }

    // Table doesn't exist or there's an error - try to create it
    const tableDoesNotExist =
      error?.message?.includes("does not exist") ||
      error?.message?.includes("relation") ||
      error?.code === "PGRST116" ||
      error?.code === "42P01";

    if (tableDoesNotExist || error) {
      // Table doesn't exist, create it using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          module VARCHAR(100) NOT NULL,
          executed_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      try {
        const { error: createError } = await supabase.rpc("exec_sql", {
          sql: createTableSQL,
        });

        if (createError) {
          // Check if exec_sql function doesn't exist
          if (
            createError.message?.includes("function exec_sql") ||
            createError.message?.includes("does not exist") ||
            createError.code === "42883"
          ) {
            const bootstrapSQL = `
-- Create exec_sql function for running migrations
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Create migrations table
${createTableSQL}
`;
            throw new Error(
              `❌ The exec_sql function is not available in your Supabase database.\n\n` +
                `📋 Please run this SQL in your Supabase SQL Editor first:\n\n` +
                `---\n${bootstrapSQL}\n---\n\n` +
                `Steps:\n` +
                `1. Go to your Supabase dashboard\n` +
                `2. Click on "SQL Editor" in the left sidebar\n` +
                `3. Click "New query"\n` +
                `4. Paste the SQL above\n` +
                `5. Click "Run" (or press Cmd/Ctrl + Enter)\n` +
                `6. Then run migrations again: npm run migrate up\n`
            );
          }

          logger.error("Failed to create migrations table", createError);
          throw new Error(
            `Failed to create migrations table: ${createError.message}`
          );
        }

        logger.info("Created schema_migrations table successfully");
      } catch (rpcError: any) {
        // If it's already our custom error, re-throw it
        if (rpcError.message?.includes("❌")) {
          throw rpcError;
        }

        // Otherwise, provide helpful error
        const bootstrapSQL = `
-- Create exec_sql function for running migrations
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Create migrations table
${createTableSQL}
`;
        throw new Error(
          `❌ The exec_sql function is not available in your Supabase database.\n\n` +
            `📋 Please run this SQL in your Supabase SQL Editor first:\n\n` +
            `---\n${bootstrapSQL}\n---\n\n` +
            `Steps:\n` +
            `1. Go to your Supabase dashboard\n` +
            `2. Click on "SQL Editor" in the left sidebar\n` +
            `3. Click "New query"\n` +
            `4. Paste the SQL above\n` +
            `5. Click "Run" (or press Cmd/Ctrl + Enter)\n` +
            `6. Then run migrations again: npm run migrate up\n`
        );
      }
    }
  }

  async runMigrations(moduleFilter?: string): Promise<void> {
    await this.initialize();

    const migrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();

    let pendingMigrations = migrations.filter(
      (migration) => !executedMigrations.includes(migration.id)
    );

    // Filter by module if specified
    if (moduleFilter) {
      const originalCount = pendingMigrations.length;
      pendingMigrations = pendingMigrations.filter(
        (migration) => migration.module === moduleFilter
      );

      if (pendingMigrations.length === 0 && originalCount > 0) {
        logger.info(`No pending migrations for module: ${moduleFilter}`);
        return;
      } else if (pendingMigrations.length === 0) {
        logger.info(`No migrations found for module: ${moduleFilter}`);
        return;
      }

      logger.info(
        `Running ${pendingMigrations.length} pending migrations for module: ${moduleFilter}`
      );
    } else {
      if (pendingMigrations.length === 0) {
        logger.info("No pending migrations");
        return;
      }

      logger.info(`Running ${pendingMigrations.length} pending migrations`);
    }

    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }

    const completionMessage = moduleFilter
      ? `All migrations completed for module: ${moduleFilter}`
      : "All migrations completed successfully";

    logger.info(completionMessage);
  }

  async loadMigrations(): Promise<Migration[]> {
    const migrations: Migration[] = [];
    const modulesPath = join(__dirname, "../../modules");

    // Define module execution order to respect dependencies
    // auth -> monitoring -> alerts
    const moduleOrder: Record<string, number> = {
      auth: 1,
      monitoring: 2,
      alerts: 3,
    };

    try {
      const modules = readdirSync(modulesPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        // Sort modules by dependency order
        .sort((a, b) => {
          const orderA = moduleOrder[a] || 999;
          const orderB = moduleOrder[b] || 999;
          return orderA - orderB;
        });

      for (const module of modules) {
        const migrationsPath = join(modulesPath, module, "migrations");

        try {
          const migrationFiles = readdirSync(migrationsPath)
            .filter(
              (file) => file.endsWith(".sql") && !file.endsWith(".down.sql")
            )
            .sort(); // Ensure chronological order within module

          for (const file of migrationFiles) {
            const filePath = join(migrationsPath, file);
            const sql = readFileSync(filePath, "utf-8");
            const id = `${module}_${file.replace(".sql", "")}`;

            // Check for corresponding down migration
            const downFile = file.replace(".sql", ".down.sql");
            const downFilePath = join(migrationsPath, downFile);
            let downSql: string | undefined;

            try {
              downSql = readFileSync(downFilePath, "utf-8");
            } catch (error) {
              // Down migration doesn't exist, which is okay
            }

            migrations.push({
              id,
              name: file.replace(".sql", ""),
              sql,
              module,
              timestamp: this.extractTimestamp(file),
              downSql,
            });
          }
        } catch (error) {
          // Module doesn't have migrations folder, skip
          continue;
        }
      }

      // Sort by module order first, then by timestamp within each module
      return migrations.sort((a, b) => {
        const orderA = moduleOrder[a.module] || 999;
        const orderB = moduleOrder[b.module] || 999;

        // If different modules, sort by module order
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // If same module, sort by timestamp (migration number)
        return a.timestamp.getTime() - b.timestamp.getTime();
      });
    } catch (error) {
      logger.error("Failed to load migrations", error);
      throw new Error("Failed to load migration files");
    }
  }

  private extractTimestamp(filename: string): Date {
    // Extract timestamp from filename like: 001_create_users_table.sql
    const match = filename.match(/^(\d{3})_/);
    if (!match) {
      throw new Error(
        `Invalid migration filename format: ${filename}. Use format: 001_description.sql`
      );
    }

    // Use the number as a simple ordering mechanism
    const order = parseInt(match[1], 10);
    return new Date(2024, 0, 1, 0, 0, order); // Fake timestamp for ordering
  }

  async getExecutedMigrations(): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.migrationsTable)
      .select("id");

    if (error) {
      logger.error("Failed to get executed migrations", error);
      throw new Error("Failed to check migration status");
    }

    return (data || []).map((row) => row.id);
  }

  private async executeMigration(migration: Migration): Promise<void> {
    logger.info(`Executing migration: ${migration.id}`);

    try {
      // Execute the migration SQL
      const { error: sqlError } = await supabase.rpc("exec_sql", {
        sql: migration.sql,
      });

      if (sqlError) {
        throw sqlError;
      }

      // Record successful execution
      const { error: recordError } = await supabase
        .from(this.migrationsTable)
        .insert([
          {
            id: migration.id,
            name: migration.name,
            module: migration.module,
          },
        ]);

      if (recordError) {
        throw recordError;
      }

      logger.info(`Migration completed: ${migration.id}`);
    } catch (error: any) {
      logger.error(`Migration failed: ${migration.id}`, error);
      throw new Error(`Migration ${migration.id} failed: ${error.message}`);
    }
  }

  async rollback(migrationId?: string): Promise<void> {
    await this.initialize();

    const allMigrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();

    // Get executed migrations in reverse order for rollback
    const executedMigrationObjects = allMigrations
      .filter((migration) => executedMigrations.includes(migration.id))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Reverse order

    if (migrationId) {
      // Rollback specific migration and all migrations after it
      const targetIndex = executedMigrationObjects.findIndex(
        (m) => m.id === migrationId
      );

      if (targetIndex === -1) {
        throw new Error(`Migration ${migrationId} not found or not executed`);
      }

      const migrationsToRollback = executedMigrationObjects.slice(
        0,
        targetIndex + 1
      );

      if (migrationsToRollback.length === 0) {
        logger.info(`No migrations to rollback for: ${migrationId}`);
        return;
      }

      logger.info(
        `Rolling back ${migrationsToRollback.length} migrations down to: ${migrationId}`
      );

      for (const migration of migrationsToRollback) {
        await this.executeDownMigration(migration);
      }
    } else {
      // Rollback all migrations
      if (executedMigrationObjects.length === 0) {
        logger.info("No migrations to rollback");
        return;
      }

      logger.info(
        `Rolling back all ${executedMigrationObjects.length} migrations`
      );

      for (const migration of executedMigrationObjects) {
        await this.executeDownMigration(migration);
      }
    }

    logger.info("Rollback completed successfully");
  }

  private async executeDownMigration(migration: Migration): Promise<void> {
    if (!migration.downSql) {
      throw new Error(
        `Down migration not found for: ${migration.id}. Please create ${migration.name}.down.sql`
      );
    }

    logger.info(`Rolling back migration: ${migration.id}`);

    try {
      // Execute the down migration SQL
      const { error: sqlError } = await supabase.rpc("exec_sql", {
        sql: migration.downSql,
      });

      if (sqlError) {
        throw sqlError;
      }

      // Remove from executed migrations
      const { error: deleteError } = await supabase
        .from(this.migrationsTable)
        .delete()
        .eq("id", migration.id);

      if (deleteError) {
        throw deleteError;
      }

      logger.info(`Migration rolled back: ${migration.id}`);
    } catch (error: any) {
      logger.error(`Rollback failed: ${migration.id}`, error);
      throw new Error(`Rollback ${migration.id} failed: ${error.message}`);
    }
  }

  async listModules(): Promise<void> {
    const migrations = await this.loadMigrations();
    const modules = [...new Set(migrations.map((m) => m.module))].sort();

    console.log("\n📁 Available Modules:");
    console.log("==================");

    if (modules.length === 0) {
      console.log("No modules with migrations found\n");
      return;
    }

    for (const module of modules) {
      const moduleMigrations = migrations.filter((m) => m.module === module);
      console.log(`📦 ${module} (${moduleMigrations.length} migrations)`);
    }

    console.log(`\nTotal: ${modules.length} modules\n`);
  }

  // Public method to get migration status data (for API endpoints)
  async getMigrationStatus(moduleFilter?: string): Promise<{
    total: number;
    executed: number;
    pending: number;
    pendingMigrations: Array<{ id: string; name: string; module: string }>;
  }> {
    const migrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();

    let filteredMigrations = migrations;

    if (moduleFilter) {
      filteredMigrations = migrations.filter((m) => m.module === moduleFilter);
    }

    const pendingMigrations = filteredMigrations.filter(
      (m) => !executedMigrations.includes(m.id)
    );

    return {
      total: filteredMigrations.length,
      executed: executedMigrations.filter((id) =>
        filteredMigrations.some((m) => m.id === id)
      ).length,
      pending: pendingMigrations.length,
      pendingMigrations: pendingMigrations.map((m) => ({
        id: m.id,
        name: m.name,
        module: m.module,
      })),
    };
  }

  async status(moduleFilter?: string): Promise<void> {
    const migrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();

    let filteredMigrations = migrations;

    if (moduleFilter) {
      filteredMigrations = migrations.filter((m) => m.module === moduleFilter);

      if (filteredMigrations.length === 0) {
        console.log(`\n❌ No migrations found for module: ${moduleFilter}\n`);
        return;
      }
    }

    const title = moduleFilter
      ? `📋 Migration Status (${moduleFilter} module):`
      : "📋 Migration Status:";

    console.log(`\n${title}`);
    console.log("==================");

    // Group by module for better readability
    const moduleGroups = filteredMigrations.reduce((groups, migration) => {
      if (!groups[migration.module]) {
        groups[migration.module] = [];
      }
      groups[migration.module].push(migration);
      return groups;
    }, {} as Record<string, Migration[]>);

    for (const [module, moduleMigrations] of Object.entries(moduleGroups)) {
      if (!moduleFilter) {
        console.log(`\n📁 ${module.toUpperCase()}`);
        console.log("─".repeat(module.length + 2));
      }

      for (const migration of moduleMigrations) {
        const status = executedMigrations.includes(migration.id)
          ? "✅ EXECUTED"
          : "⏳ PENDING";
        const displayName = moduleFilter ? migration.name : migration.id;
        console.log(`${status} ${displayName}`);
      }
    }

    const totalPending = filteredMigrations.filter(
      (m) => !executedMigrations.includes(m.id)
    ).length;
    const summary = moduleFilter
      ? `Module: ${filteredMigrations.length} migrations, ${totalPending} pending`
      : `Total: ${filteredMigrations.length} migrations, ${totalPending} pending`;

    console.log(`\n${summary}\n`);
  }
}
