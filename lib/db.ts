import Database from "better-sqlite3";
import { Kysely, PostgresDialect, SqliteDialect, sql } from "kysely";
import { Pool } from "pg";
import path from "node:path";

const dbPath = process.env.DROPAI_DB_PATH ?? path.join(process.cwd(), "dropai.db");
const DATABASE_URL = process.env.DATABASE_URL;
export const IS_POSTGRES = Boolean(DATABASE_URL);

/**
 * Дуальный DB-слой:
 * - prod (есть DATABASE_URL): Postgres через pg + Kysely
 * - dev (нет URL): SQLite через better-sqlite3 + Kysely
 *
 * Better Auth получает соответствующий «сырой» драйвер через rawDb / rawDialect.
 */

export interface Tables {
  generations: {
    id: string;
    user_id: string;
    style: string;
    prompt: string;
    input_path: string;
    output_path: string | null;
    status: string;
    error: string | null;
    cost_clicks: number;
    demo: number;
    created_at: number;
  };
  payments: {
    id: number;
    user_id: string;
    plan_id: string;
    amount_rub: number;
    clicks: number;
    status: string;
    created_at: number;
    paid_at: number | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean | number;
    image: string | null;
    clicks: number;
    createdAt: Date | number;
    updatedAt: Date | number;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __dropaiKysely: Kysely<Tables> | undefined;
  // eslint-disable-next-line no-var
  var __dropaiSqlite: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __dropaiPgPool: Pool | undefined;
}

function ensureDrivers(): { kysely: Kysely<Tables> } {
  // Идемпотентно создаём драйверы и Kysely. Все хранятся в global, чтобы
  // переживать HMR в dev. Не используем local `let`, иначе при HMR теряется
  // ссылка на raw-инстансы для Better Auth.
  if (IS_POSTGRES) {
    if (!global.__dropaiPgPool) {
      global.__dropaiPgPool = new Pool({
        connectionString: DATABASE_URL,
        max: 5,
        ssl: { rejectUnauthorized: false },
      });
    }
    if (!global.__dropaiKysely) {
      global.__dropaiKysely = new Kysely<Tables>({
        dialect: new PostgresDialect({ pool: global.__dropaiPgPool }),
      });
    }
  } else {
    if (!global.__dropaiSqlite) {
      global.__dropaiSqlite = new Database(dbPath);
    }
    if (!global.__dropaiKysely) {
      global.__dropaiKysely = new Kysely<Tables>({
        dialect: new SqliteDialect({ database: global.__dropaiSqlite }),
      });
    }
  }
  return { kysely: global.__dropaiKysely! };
}

export const db = ensureDrivers().kysely;

/** Сырой Postgres pool — для Better Auth когда мы в проде. */
export function getPgPool(): Pool | null {
  ensureDrivers();
  return global.__dropaiPgPool ?? null;
}

/** Сырой SQLite instance — для Better Auth когда мы в дев. */
export function getSqlite(): Database.Database | null {
  ensureDrivers();
  return global.__dropaiSqlite ?? null;
}

/**
 * Применить миграции наших custom-таблиц (generations, payments).
 * Better Auth таблицы (user/session/account/verification) создаются через
 * `npx @better-auth/cli migrate`.
 */
let migrationsRan = false;
export async function ensureMigrations(): Promise<void> {
  if (migrationsRan) return;
  migrationsRan = true;

  if (IS_POSTGRES) {
    await sql`
      CREATE TABLE IF NOT EXISTS generations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        style TEXT NOT NULL,
        prompt TEXT NOT NULL,
        input_path TEXT NOT NULL,
        output_path TEXT,
        status TEXT NOT NULL DEFAULT 'done',
        error TEXT,
        cost_clicks INTEGER NOT NULL DEFAULT 3,
        demo INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL
      )
    `.execute(db);
    await sql`CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id, created_at DESC)`.execute(
      db
    );
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        amount_rub INTEGER NOT NULL,
        clicks INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at BIGINT NOT NULL,
        paid_at BIGINT
      )
    `.execute(db);
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC)`.execute(
      db
    );
  } else {
    await sql`
      CREATE TABLE IF NOT EXISTS generations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        style TEXT NOT NULL,
        prompt TEXT NOT NULL,
        input_path TEXT NOT NULL,
        output_path TEXT,
        status TEXT NOT NULL DEFAULT 'done',
        error TEXT,
        cost_clicks INTEGER NOT NULL DEFAULT 3,
        demo INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `.execute(db);
    await sql`CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id, created_at DESC)`.execute(
      db
    );
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        amount_rub INTEGER NOT NULL,
        clicks INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        paid_at INTEGER
      )
    `.execute(db);
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC)`.execute(
      db
    );
  }
}

/** Удобный helper для получения баланса. */
export async function getUserClicks(userId: string): Promise<number> {
  const row = await db
    .selectFrom("user")
    .select("clicks")
    .where("id", "=", userId)
    .executeTakeFirst();
  return row?.clicks ?? 0;
}

/** Удобный helper для списания/начисления кликов атомарно. */
export async function adjustUserClicks(userId: string, delta: number): Promise<void> {
  await sql`UPDATE "user" SET clicks = clicks + ${delta} WHERE id = ${userId}`.execute(db);
}

export type GenerationRow = Tables["generations"];
export type PaymentRow = Tables["payments"];
