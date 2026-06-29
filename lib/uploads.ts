import fs from "node:fs/promises";
import path from "node:path";

/**
 * Дуальное хранилище:
 * - prod (есть BLOB_READ_WRITE_TOKEN): @vercel/blob
 * - dev:  локальная FS в /public/uploads
 *
 * USE_BLOB и IS_VERCEL читаем в момент вызова — env Vercel может меняться
 * между cold-старт-инвокациями функций.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type SavedUpload = {
  /** URL для отдачи через <img src> и redirect-навигации. */
  url: string;
  /** Имя файла без пути — используется в БД (`/uploads/${name}` или blob URL). */
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
    const res = await put(filename, bytes, {
      access: "public",
      contentType: mime,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return { url: res.url, storedPath: res.url };
  }

  if (isVercel()) {
    throw new Error(
      "Vercel: BLOB_READ_WRITE_TOKEN не задан. Подключите Vercel Blob: " +
        "Project → Storage → Create Database → Blob → Connect to Project. " +
        "После этого Settings → Deployments → … → Redeploy (без галки «Use existing Build Cache»)."
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
  const rel = `/uploads/${filename}`;
  return { url: rel, storedPath: rel };
}

export async function removeUpload(storedPath: string): Promise<void> {
  if (!storedPath) return;
  try {
    if (useBlob() && storedPath.startsWith("http")) {
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
  return p.startsWith("/uploads/") || p.includes(".blob.vercel-storage.com/");
}
