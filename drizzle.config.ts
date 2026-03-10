import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const env = (globalThis as any).process?.env ?? {};

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: env.CLOUDFLARE_DATABASE_ID!,
    token: env.CLOUDFLARE_D1_TOKEN!,
  },
});
