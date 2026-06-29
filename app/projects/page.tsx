import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ImageOff, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { db, ensureMigrations, getUserClicks } from "@/lib/db";
import { STYLES } from "@/lib/styles";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { ProjectCard } from "@/components/projects/ProjectCard";

export const metadata = { title: "Проекты — DROP.AI" };

export default async function ProjectsPage() {
  await ensureMigrations();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const clicks = await getUserClicks(session.user.id);

  const generations = await db
    .selectFrom("generations")
    .selectAll()
    .where("user_id", "=", session.user.id)
    .orderBy("created_at", "desc")
    .limit(100)
    .execute();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <StudioHeader clicks={clicks} userLabel={session.user.name || session.user.email} />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Мои <span className="gradient-text">проекты</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              История ваших генераций. Всего: {generations.length}
            </p>
          </div>
          <Link href="/studio" className="btn-gradient">
            <Sparkles size={14} /> Новая карточка
          </Link>
        </div>

        {generations.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center gap-3 p-16 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(168,85,247,0.12)", color: "#c084fc" }}
            >
              <ImageOff size={24} />
            </div>
            <p className="font-semibold text-lg">Пока пусто</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Сгенерируйте первую карточку — она появится здесь.
            </p>
            <Link href="/studio" className="btn-gradient mt-3">
              Перейти в студию →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {generations.map((g) => {
              const style = STYLES.find((s) => s.id === g.style);
              const date = new Date(Number(g.created_at));
              const dateLabel = date.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });
              const src = g.output_path ?? g.input_path;
              return (
                <ProjectCard
                  key={g.id}
                  src={src}
                  styleLabel={style?.label ?? g.style}
                  dateLabel={dateLabel}
                  demo={g.demo === 1}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
