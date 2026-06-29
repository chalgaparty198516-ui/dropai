import { notFound } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserClicks, ensureMigrations } from "@/lib/db";
import { USE_BLOB } from "@/lib/uploads";
import { ViewerHeader } from "@/components/viewer/ViewerHeader";
import { ViewerActions } from "@/components/viewer/ViewerActions";

export const metadata = { title: "Просмотр карточки — DROP.AI" };

export default async function ViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  await ensureMigrations();
  const { name } = await params;
  const { src: srcParam } = await searchParams;

  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safeName) notFound();

  let src: string;
  if (USE_BLOB && srcParam && /^https:\/\//.test(srcParam)) {
    src = srcParam;
  } else {
    const filePath = path.join(process.cwd(), "public", "uploads", safeName);
    try {
      await fs.stat(filePath);
    } catch {
      notFound();
    }
    src = `/uploads/${safeName}`;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  let clicks = 0;
  let userLabel: string | null = null;
  if (session) {
    clicks = await getUserClicks(session.user.id);
    userLabel = session.user.name || session.user.email;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <ViewerHeader clicks={clicks} userLabel={userLabel} />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-10">
        <div className="glass p-3 sm:p-5 flex flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Карточка"
            className="w-full h-auto rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-mono truncate" style={{ color: "var(--text-muted)" }}>
              {safeName}
            </p>
            <ViewerActions src={src} filename={safeName} />
          </div>
        </div>
      </main>
    </div>
  );
}
