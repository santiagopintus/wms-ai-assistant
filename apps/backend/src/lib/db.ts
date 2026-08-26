import { Pool } from "pg";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// Direct Postgres connection (transaction pooler), same approach as
// scripts/seed.ts — no Data API/PostgREST configured for this project, so
// tools query the database directly instead of through supabase-js.
export const db = new Pool({
  host: requireEnv("SUPABASE_DB_HOST"),
  port: Number(process.env.SUPABASE_DB_PORT ?? 6543),
  database: process.env.SUPABASE_DB_NAME ?? "postgres",
  user: requireEnv("SUPABASE_DB_USER"),
  password: requireEnv("SUPABASE_DB_PASS"),
  ssl: { rejectUnauthorized: false },
});
