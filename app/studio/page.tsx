import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ensureMigrations, getUserClicks } from "@/lib/db";
import { pickProvider, COSTS } from "@/lib/providers";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { StudioEditor } from "@/components/studio/StudioEditor";

export const metadata = { title: "Студия — DROP.AI" };

export default async function StudioPage() {
  await ensureMigrations();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const clicks = await getUserClicks(session.user.id);
  const provider = pickProvider();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <StudioHeader clicks={clicks} userLabel={session.user.name || session.user.email} />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Студия <span className="gradient-text">генерации</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Загрузите фото товара, выберите стиль — получите карточку для маркетплейса.
          </p>
        </div>
        <StudioEditor initialClicks={clicks} provider={provider} cost={COSTS[provider]} />
      </main>
    </div>
  );
}
