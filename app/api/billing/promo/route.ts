import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { sql } from "kysely";
import { auth } from "@/lib/auth";
import { db, ensureMigrations, adjustUserClicks, getUserClicks } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/billing/promo  { code: string }
 *
 * Алгоритм:
 *  1. Нормализуем код (upper-case, trim).
 *  2. Атомарно увеличиваем used_count при условии used_count < max_uses
 *     — это блокирует двойное применение даже при гонке.
 *  3. Если 1 строка обновлена — начисляем клики и логируем redemption.
 *  4. UNIQUE(code, user_id) в redemptions не даёт одному юзеру применить
 *     промокод повторно даже если max_uses > 1.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureMigrations();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const raw = String(body.code ?? "").trim();
    if (!raw) return NextResponse.json({ error: "Введите промокод" }, { status: 400 });

    const code = raw.toUpperCase();

    // Заранее проверим что промокод существует, чтобы вернуть осмысленный текст.
    const promo = await db
      .selectFrom("promo_codes")
      .selectAll()
      .where("code", "=", code)
      .executeTakeFirst();
    if (!promo) {
      return NextResponse.json({ error: "Промокод не найден" }, { status: 404 });
    }

    // Юзер уже использовал?
    const already = await db
      .selectFrom("promo_redemptions")
      .select("id")
      .where("code", "=", code)
      .where("user_id", "=", session.user.id)
      .executeTakeFirst();
    if (already) {
      return NextResponse.json({ error: "Этот промокод уже использован" }, { status: 409 });
    }

    // Атомарный инкремент used_count при условии что лимит не исчерпан.
    const upd = await sql<{ used_count: number }>`
      UPDATE promo_codes
      SET used_count = used_count + 1
      WHERE code = ${code} AND used_count < max_uses
      RETURNING used_count
    `.execute(db);
    const ok = (upd.rows?.length ?? 0) > 0;
    if (!ok) {
      return NextResponse.json(
        { error: "Промокод уже исчерпан" },
        { status: 410 }
      );
    }

    // Логируем redemption — UNIQUE(code,user_id) защищает от двойной записи.
    try {
      await db
        .insertInto("promo_redemptions")
        .values({
          code,
          user_id: session.user.id,
          clicks: promo.clicks,
          created_at: Date.now(),
        } as never)
        .execute();
    } catch {
      // Если упало на UNIQUE — значит другая параллельная запись успела, откатим used_count.
      await sql`UPDATE promo_codes SET used_count = used_count - 1 WHERE code = ${code}`.execute(
        db
      );
      return NextResponse.json({ error: "Этот промокод уже использован" }, { status: 409 });
    }

    await adjustUserClicks(session.user.id, promo.clicks);
    const balance = await getUserClicks(session.user.id);

    return NextResponse.json({
      ok: true,
      code,
      clicksAdded: promo.clicks,
      balance,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/billing/promo] FATAL", e);
    return NextResponse.json(
      { error: `Внутренняя ошибка: ${msg.slice(0, 300)}` },
      { status: 500 }
    );
  }
}
