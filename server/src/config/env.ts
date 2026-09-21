import dotenv from "dotenv";
import { logger } from "./logger.js";
import { z } from "zod";

import path from "path";

// Load .env file from root or server directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z
    .string()
    .min(1, { message: "MONGODB_URI is required" })
    .default("mongodb://localhost:27017/shipyard"),
  CLIENT_URL: z
    .string()
    .url({ message: "CLIENT_URL must be a valid URL" })
    .default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, { message: "JWT_ACCESS_SECRET must be at least 16 characters" }),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, { message: "JWT_REFRESH_SECRET must be at least 16 characters" }),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_DOMAIN: z.string().optional().default(""),
  ADMIN_EMAIL: z
    .string()
    .email({ message: "ADMIN_EMAIL must be a valid email address" })
    .default("admin@shipyard.dev"),
  ADMIN_PASSWORD: z
    .string()
    .min(8, { message: "ADMIN_PASSWORD must be at least 8 characters" })
    .default("AdminSecurePassword123!"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error("❌ Invalid environment variables configuration:");
  parsed.error.issues.forEach((issue) => {
    logger.error(` - ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
