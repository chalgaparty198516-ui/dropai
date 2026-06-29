import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, ensureMigrations } from "@/lib/db";
import { findPlan } from "@/lib/plans";
import { buildPaymentUrl, getRobokassaEnv } from "@/lib/robokassa";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await ensureMigrations();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = findPlan(String(body.planId ?? ""));
  if (!plan) return NextResponse.json({ error: "Неизвестный тариф" }, { status: 400 });

  const env = getRobokassaEnv();
  const inserted = await db
    .insertInto("payments")
    .values({
      user_id: session.user.id,
      plan_id: plan.id,
      amount_rub: plan.priceRub,
      clicks: plan.clicks,
      status: "pending",
      created_at: Date.now(),
    } as never)
    .returning("id")
    .executeTakeFirstOrThrow();
  const invId = Number(inserted.id);

  if (!env.isConfigured) {
    return NextResponse.json({
      invId,
      configured: false,
      message:
        "Robokassa не настроен. Платёж создан в БД (pending). Чтобы запустить редирект, добавьте ROBOKASSA_MERCHANT_LOGIN/PASSWORD1/PASSWORD2 в .env",
    });
  }

  try {
    const url = buildPaymentUrl(env, {
      outSum: plan.priceRub,
      invId,
      description: `DROP.AI · ${plan.name} · ${plan.clicks} кликов`,
      shpPlanId: plan.id,
      shpUserId: session.user.id,
    });
    return NextResponse.json({ invId, url, configured: true, isTest: env.isTest });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка подписи Robokassa" },
      { status: 500 }
    );
  }
}
