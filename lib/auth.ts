import { betterAuth } from "better-auth";
import { getPgPool, getSqlite, IS_POSTGRES } from "./db";

/**
 * Better Auth с дуальной БД:
 * - prod: pg Pool (Postgres / Neon)
 * - dev:  better-sqlite3 instance
 *
 * Перед первым запуском в проде выполнить миграцию схемы Better Auth:
 *   npx @better-auth/cli@latest migrate
 * (создаст user/session/account/verification под Postgres).
 */
const database = IS_POSTGRES ? getPgPool()! : getSqlite()!;

export const auth = betterAuth({
  database,
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "dev-only-secret-please-replace-with-random-32-chars",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3010",
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  user: {
    additionalFields: {
      clicks: {
        type: "number",
        defaultValue: 8,
        input: false,
      },
    },
  },
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : undefined,
});

export type Session = typeof auth.$Infer.Session;
