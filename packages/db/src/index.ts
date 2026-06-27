// DeLaw database package — Drizzle ORM schema + client.
// Schema follows spec §3 (tables, enums, indexes in infrastructure/scripts).
export * from "./schema";
export { db, schema, type Database } from "./client";
