import { config } from "dotenv";

// Local dev uses .env.local; Vercel injects vars into process.env directly.
config({ path: ".env.local" });
config({ path: ".env" });

import { defineConfig } from "prisma/config";

// prisma generate does not connect to the DB — a placeholder is enough for install.
// migrate deploy / runtime require the real DATABASE_URL (set in Vercel env).
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
