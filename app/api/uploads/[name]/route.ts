import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Прокси для приватного Vercel Blob.
 * /api/uploads/{filename} → находим blob, фетчим, стримим клиенту.
 *
 * Сначала пробуем head(pathname) — для большинства случаев у нас точное имя.
 * Если head не нашёл — fallback на list({prefix}).
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
    const blob = await import("@vercel/blob");

    let url: string | null = null;
    let contentType: string | null = null;

    // Способ 1: head() по точному имени
    try {
      const h = await blob.head(filename);
      url = ("downloadUrl" in h && typeof h.downloadUrl === "string" && h.downloadUrl) || h.url;
      contentType = h.contentType ?? null;
    } catch {
      /* fallback */
    }

    // Способ 2: list по префиксу
    if (!url) {
      const { blobs } = await blob.list({ prefix: filename, limit: 10 });
      const match = blobs.find((b) => b.pathname === filename) ?? blobs[0];
      if (match) {
        url = ("downloadUrl" in match && typeof (match as { downloadUrl?: string }).downloadUrl === "string"
          ? (match as { downloadUrl: string }).downloadUrl
          : match.url);
      }
    }

    if (!url) return new Response("not found", { status: 404 });

    const upstream = await fetch(url, {
      headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text().catch(() => "");
      return new Response(
        `upstream ${upstream.status} from blob: ${t.slice(0, 200)}`,
        { status: 502 }
      );
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") || contentType || "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`proxy error: ${msg}`, { status: 500 });
  }
}
