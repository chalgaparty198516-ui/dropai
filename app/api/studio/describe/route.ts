import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/studio/describe
 * Принимает FormData с image. Через Gemini vision (text-модель) описывает товар
 * на фото — используется для авто-заполнения поля «Описание товара».
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI-описание требует GEMINI_API_KEY в .env" },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл не загружен или слишком большой" }, { status: 400 });
  }
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    return NextResponse.json({ error: "Поддерживаются JPG, PNG, WebP" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const { describeWithGeminiVisionExported } = await import("@/lib/providers");
  try {
    const text = await describeWithGeminiVisionExported(
      bytes,
      file.type,
      process.env.GEMINI_API_KEY,
      "ru"
    );
    return NextResponse.json({ description: text });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gemini vision не сработал" },
      { status: 502 }
    );
  }
}
