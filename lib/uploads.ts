import fs from "node:fs/promises";
import path from "node:path";

/**
 * Дуальное хранилище для загружаемых/сгенерированных картинок:
 * - prod (есть BLOB_READ_WRITE_TOKEN): @vercel/blob
 * - dev:  локальная FS в /public/uploads
 *
 * Возвращает абсолютный URL (blob) или относительный путь (/uploads/...).
 */

export const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type SavedUpload = {
  /** URL для отдачи через <img src> и redirect-навигации. */
  url: string;
  /** Имя файла без пути — используется в БД (`/uploads/${name}` или blob URL). */
  storedPath: string;
};

export async function saveUpload(
  bytes: Buffer,
  filename: string,
  mime: string
): Promise<SavedUpload> {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const res = await put(filename, bytes, {
      access: "public",
      contentType: mime,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return { url: res.url, storedPath: res.url };
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
  const rel = `/uploads/${filename}`;
  return { url: rel, storedPath: rel };
}

export async function removeUpload(storedPath: string): Promise<void> {
  if (!storedPath) return;
  try {
    if (USE_BLOB) {
      if (storedPath.startsWith("http")) {
        const { del } = await import("@vercel/blob");
        await del(storedPath);
      }
      return;
    }
    if (storedPath.startsWith("/uploads/")) {
      await fs.unlink(path.join(UPLOAD_DIR, storedPath.slice("/uploads/".length)));
    }
  } catch {
    /* ignore */
  }
}

/** Проверяет, является ли путь нашим upload-URL (для middleware/viewer). */
export function isStoredUploadPath(p: string): boolean {
  return p.startsWith("/uploads/") || p.includes(".blob.vercel-storage.com/");
}
