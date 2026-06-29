import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Прокси для приватного Vercel Blob.
 * Принимает /api/uploads/{filename} → находит blob с этим pathname → стримит клиенту.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const filename = decodeURIComponent(name).replace(/[^a-zA-Z0-9._-]/g, "");
  if (!filename) return new Response("bad name", { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response("blob not configured", { status: 503 });
  }

  try {
    const { list } = await import("@vercel/blob");
    // Ищем blob по prefix=filename (для приватных URL не угадаешь без list).
    const { blobs } = await list({ prefix: filename, limit: 5 });
    const match = blobs.find((b) => b.pathname === filename);
    if (!match) return new Response("not found", { status: 404 });

    const upstream = await fetch(match.url);
    if (!upstream.ok || !upstream.body) {
      return new Response("upstream error", { status: 502 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": match.contentType ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`proxy error: ${msg}`, { status: 500 });
  }
}
