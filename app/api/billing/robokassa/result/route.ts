import { NextRequest } from "next/server";
import { db, ensureMigrations, adjustUserClicks } from "@/lib/db";
import { getRobokassaEnv, verifyResultSignature } from "@/lib/robokassa";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handle(req);
}
export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  await ensureMigrations();
  const params = await readParams(req);
  const outSum = String(params.get("OutSum") ?? "");
  const invId = String(params.get("InvId") ?? "");
  const signature = String(params.get("SignatureValue") ?? "");
  const shpPlanId = String(params.get("Shp_planId") ?? "");
  const shpUserId = String(params.get("Shp_userId") ?? "");

  if (!outSum || !invId || !signature) {
    return new Response("bad request", { status: 400 });
  }

  const env = getRobokassaEnv();
  if (!env.isConfigured) {
    return new Response("robokassa not configured", { status: 503 });
  }

  if (!verifyResultSignature(env, { outSum, invId, signature, shpPlanId, shpUserId })) {
    return new Response("bad signature", { status: 400 });
  }

  const invIdNum = Number(invId);
  const payment = await db
    .selectFrom("payments")
    .selectAll()
    .where("id", "=", invIdNum)
    .executeTakeFirst();

  if (!payment) return new Response("unknown invoice", { status: 404 });
  if (payment.user_id !== shpUserId || payment.plan_id !== shpPlanId) {
    return new Response("mismatch", { status: 400 });
  }
  if (Number(outSum.replace(",", ".")) !== payment.amount_rub) {
    return new Response("amount mismatch", { status: 400 });
  }

  if (payment.status !== "paid") {
    await db
      .updateTable("payments")
      .set({ status: "paid", paid_at: Date.now() })
      .where("id", "=", payment.id)
      .execute();
    await adjustUserClicks(payment.user_id, payment.clicks);
  }

  return new Response(`OK${invId}`, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

async function readParams(req: NextRequest): Promise<URLSearchParams> {
  if (req.method === "GET") return req.nextUrl.searchParams;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return new URLSearchParams(
      Object.entries(json).map(([k, v]) => [k, String(v ?? "")])
    );
  }
  const text = await req.text();
  return new URLSearchParams(text);
}
