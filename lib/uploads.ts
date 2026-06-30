import fs from "node:fs/promises";
import path from "node:path";

/**
 * Дуальное хранилище:
 * - prod (есть BLOB_READ_WRITE_TOKEN): @vercel/blob (private store), отдаём
 *   клиенту через прокси /api/uploads/{name} — это работает и с public, и с
 *   private store.
 * - dev: локальная FS в /public/uploads, отдаём напрямую как /uploads/{name}
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type SavedUpload = {
  /** URL для отдачи через <img src> и redirect-навигации. */
  url: string;
  /** Имя файла без пути — используется в БД (`/uploads/${name}` или /api/uploads/${name}). */
  storedPath: string;
};

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isVercel(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

/** Совместимый старый экспорт (используется в /p/[name] для UI). */
export const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function saveUpload(
  bytes: Buffer,
  filename: string,
  mime: string
): Promise<SavedUpload> {
  if (useBlob()) {
    const { put } = await import("@vercel/blob");
    // Пробуем сначала public (работает быстрее, прямой CDN-URL). Если store
    // private — fallback на private и проксируем через наш роут.
    let blobUrl: string;
    try {
      const res = await put(filename, bytes, {
        access: "public",
        contentType: mime,
        addRandomSuffix: false,
        allowOverwrite: false,
      });
      blobUrl = res.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/private/i.test(msg)) throw e;
      // Store сконфигурирован private — кладём как private, отдаём через прокси.
      const res = await put(filename, bytes, {
        // @ts-expect-error access:'private' для приватных store, новые SDK имеют тип
        access: "private",
        contentType: mime,
        addRandomSuffix: false,
        allowOverwrite: false,
      });
      blobUrl = res.url;
    }
    // Для public store URL уже прямой; для private — отдадим через прокси.
    const isDirectPublic = /\.public\.blob\.vercel-storage\.com\//.test(blobUrl);
    if (isDirectPublic) {
      return { url: blobUrl, storedPath: blobUrl };
    }
    const proxy = `/api/uploads/${encodeURIComponent(filename)}`;
    return { url: proxy, storedPath: proxy };
  }

  if (isVercel()) {
    throw new Error(
      "Vercel: BLOB_READ_WRITE_TOKEN не задан. Подключите Vercel Blob в Storage и сделайте Redeploy без кэша."
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), safe);
  const rel = `/uploads/${filename}`;
  return { url: rel, storedPath: rel };
}

function toCleanBuffer(input: Buffer | Uint8Array): Buffer {
  const ab = new ArrayBuffer(input.byteLength);
  new Uint8Array(ab).set(input);
  return Buffer.from(ab);
}

export async function removeUpload(storedPath: string): Promise<void> {
  if (!storedPath) return;
  try {
    if (useBlob() && (storedPath.startsWith("http") || storedPath.startsWith("/api/uploads/"))) {
      const { del } = await import("@vercel/blob");
      await del(storedPath);
      return;
    }
    if (storedPath.startsWith("/uploads/")) {
      await fs.unlink(path.join(UPLOAD_DIR, storedPath.slice("/uploads/".length)));
    }
  } catch {
    /* ignore */
  }
}

export function isStoredUploadPath(p: string): boolean {
  return (
    p.startsWith("/uploads/") ||
    p.startsWith("/api/uploads/") ||
    p.includes(".blob.vercel-storage.com/")
  );
}
