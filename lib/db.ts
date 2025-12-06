import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ensureSchema } from "./ensureSchema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

export const pool = new Pool({
  connectionString,
  ssl:
    connectionString.includes("neon.tech") || connectionString.includes("vercel.pub")
      ? { rejectUnauthorized: false }
      : undefined,
});

export const db = drizzle(pool);

// サーバー起動時にスキーマを確認
ensureSchema(pool).catch((err) => {
  console.error("Failed to ensure schema", err);
});
