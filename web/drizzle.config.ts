import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// drizzle-kit does not load .env on its own — do it explicitly so
// `npm run db:push` works straight after copying .env.example.
loadEnv({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.");
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
} satisfies Config;
