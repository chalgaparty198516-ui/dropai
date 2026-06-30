import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { db, ensureMigrations, getUserClicks, adjustUserClicks } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { addLuxuryOverlay } from "@/lib/composer";
import { STYLES } from "@/lib/styles";
import { generate, enhancePrompt, pickProvider, COSTS, MAX_VARIANTS } from "@/lib/providers";
import { getQualityPreset } from "@/lib/quality";

export const runtime = "nodejs";
// Vercel Hobby tier limit. Если апгрейднешься на Pro — можно поднять до 300.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error("[/api/studio/generate] FATAL", e);
    return NextResponse.json(
      { error: `Внутренняя ошибка: ${msg.slice(0, 500)}` },
      { status: 500 }
    );
  }
}

async function handle(req: NextRequest) {
  await ensureMigrations();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image");
  const styleId = String(formData.get("style") ?? "");
  const extraPrompt = String(formData.get("prompt") ?? "").slice(0, 500);
  const variantsRaw = Number(formData.get("variants") ?? 1);
  const variants = Math.max(1, Math.min(MAX_VARIANTS, isNaN(variantsRaw) ? 1 : variantsRaw));
  const quality = getQualityPreset(formData.get("quality")?.toString());
  const productTitle = String(formData.get("title") ?? "").slice(0, 80).trim();
  const benefits = String(formData.get("benefits") ?? "").slice(0, 400).trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });
  }
  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Размер фото должен быть до 10 МБ" }, { status: 400 });
  }
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    return NextResponse.json({ error: "Поддерживаются JPG, PNG, WebP" }, { status: 400 });
  }

  const style = STYLES.find((s) => s.id === styleId);
  if (!style) {
    return NextResponse.json({ error: "Неизвестный стиль" }, { status: 400 });
  }

  const provider = pickProvider();
  const perVariantCost = COSTS[provider] * quality.costMultiplier;
  const totalCost = perVariantCost * variants;

  const balance = await getUserClicks(session.user.id);
  if (totalCost > 0 && balance < totalCost) {
    return NextResponse.json(
      {
        error: `Недостаточно кликов. Нужно ${totalCost} (${variants} × ${perVariantCost}), на балансе ${balance}.`,
      },
      { status: 402 }
    );
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const baseId = crypto.randomUUID();
  const inputName = `${baseId}-in.${ext}`;
  const inputBytes = Buffer.from(await file.arrayBuffer());
  const inputSaved = await saveUpload(inputBytes, inputName, file.type);

  // Публичный URL для image-to-image моделей (включая ситуацию когда мы на проде с blob).
  const publicBase = process.env.PUBLIC_BASE_URL;
  let inputPublicUrl: string | undefined;
  if (inputSaved.url.startsWith("http")) {
    inputPublicUrl = inputSaved.url; // blob — сам уже публичный
  } else if (publicBase && /^https:\/\//.test(publicBase)) {
    inputPublicUrl = `${publicBase.replace(/\/$/, "")}${inputSaved.url}`;
  }

  const baseFinal = await enhancePrompt(extraPrompt, style.prompt);
  // Текст на премиум-карточке накладываем через sharp ПОСЛЕ генерации (см. ниже),
  // а AI просим просто оставить правую половину пустой и сохранить товар как есть.
  const luxuryBullets =
    style.id === "luxury-card" && benefits
      ? benefits
          .split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
      : [];
  const finalPrompt = (baseFinal + quality.promptBoost).slice(0, 2000);

  const seeds = Array.from({ length: variants }, (_, i) =>
    Math.floor(Math.random() * 1_000_000) + i * 31
  );

  const results: PromiseSettledResult<Awaited<ReturnType<typeof generate>>>[] = [];
  for (let i = 0; i < seeds.length; i++) {
    try {
      const value = await generate({
        promptText: finalPrompt,
        inputBytes,
        inputMime: file.type,
        inputPublicUrl,
        seed: seeds[i],
        size: quality.size,
        enhance: quality.enhance,
      });
      value.cost = value.cost * quality.costMultiplier;
      results.push({ status: "fulfilled", value });
    } catch (reason) {
      results.push({ status: "rejected", reason });
    }
    if (i < seeds.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }

  const outputs: Array<{
    id: string;
    outputUrl: string;
    provider: string;
    cost: number;
    usedImg2Img?: boolean;
    debug?: string;
  }> = [];
  let actualCost = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status !== "fulfilled") continue;
    const id = `${baseId}-${i}`;
    const outName = `${id}-out.png`;
    // Для премиум-стиля накладываем реальный SVG-overlay с заголовком/буллетами
    let finalBytes = r.value.bytes;
    if (style.id === "luxury-card" && (productTitle || luxuryBullets.length)) {
      try {
        finalBytes = await addLuxuryOverlay(r.value.bytes, productTitle, luxuryBullets);
      } catch (e) {
        // Sharp может падать на edge runtime с разными причинами. Главное —
        // не валить весь запрос: отдаём AI-картинку без overlay-текста.
        console.warn("[luxury overlay] fail (returning image without overlay):", e);
      }
    }
    const outSaved = await saveUpload(finalBytes, outName, "image/png");
    outputs.push({
      id,
      outputUrl: outSaved.url,
      provider: r.value.provider,
      cost: r.value.cost,
      usedImg2Img: r.value.usedImg2Img,
      debug: r.value.debug,
    });
    actualCost += r.value.cost;
  }

  if (outputs.length === 0) {
    const first = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
    const msg = first?.reason instanceof Error ? first.reason.message : "Все варианты упали";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const now = Date.now();
  if (actualCost > 0) {
    await adjustUserClicks(session.user.id, -actualCost);
  }
  for (const out of outputs) {
    const isDemo = out.provider === "demo" ? 1 : 0;
    await db
      .insertInto("generations")
      .values({
        id: out.id,
        user_id: session.user.id,
        style: style.id,
        prompt: `[${out.provider}] ${finalPrompt}`.slice(0, 2000),
        input_path: inputSaved.storedPath,
        output_path: out.outputUrl,
        status: "done",
        error: null,
        cost_clicks: out.cost,
        demo: isDemo,
        created_at: now,
      })
      .execute();
  }

  const newBalance = await getUserClicks(session.user.id);

  return NextResponse.json({
    inputUrl: inputSaved.url,
    variants: outputs,
    provider,
    quality: quality.id,
    size: quality.size,
    enhancedPrompt: finalPrompt,
    usedKontext: Boolean(inputPublicUrl),
    cost: actualCost,
    balance: newBalance,
  });
}
