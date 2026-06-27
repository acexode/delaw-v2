import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Migration runner. pgvector must already be enabled on the database:
//   CREATE EXTENSION IF NOT EXISTS vector;
// (see infrastructure/scripts/indexes.sql). It is intentionally NOT part of the
// generated migrations.

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const migrationClient = postgres(connectionString, { max: 1 });

async function main() {
  await migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
  await migrationClient.end();
  // eslint-disable-next-line no-console
  console.log("Migrations applied successfully.");
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Migration failed:", error);
  process.exit(1);
});
