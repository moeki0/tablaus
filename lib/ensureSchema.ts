import { Pool } from "pg";

let ensured = false;
let warnedMissingConnection = false;

export async function ensureSchema(pool: Pool) {
  if (ensured) return;
  const connectionString =
    (
      (pool as unknown as { options?: { connectionString?: string } }).options
        ?.connectionString ?? ""
    ).trim() ||
    (process.env.DATABASE_URL ?? "").trim() ||
    (process.env.POSTGRES_URL ?? "").trim() ||
    (process.env.POSTGRES_PRISMA_URL ?? "").trim();

  if (!connectionString) {
    if (!warnedMissingConnection) {
      console.warn("Skipping ensureSchema: no database connection string configured.");
      warnedMissingConnection = true;
    }
    return;
  }

  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TABLE IF NOT EXISTS tables (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id text NOT NULL,
        name text NOT NULL,
        csv text NOT NULL,
        query_spec text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE tables ADD COLUMN IF NOT EXISTS query_spec text NOT NULL DEFAULT '';
    `);
    ensured = true;
  } catch (err) {
    if (!warnedMissingConnection) {
      console.warn("Skipping ensureSchema: failed to connect", err);
      warnedMissingConnection = true;
    }
  }
}
