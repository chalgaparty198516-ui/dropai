import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserClicks } from "@/lib/db";
import { StudioHeader } from "@/components/studio/StudioHeader";

export const metadata = { title: "Платёж принят — DROP.AI" };

export default async function BillingSuccessPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const clicks = await getUserClicks(session.user.id);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <StudioHeader clicks={clicks} userLabel={session.user.name || session.user.email} />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-20 text-center">
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "rgba(134,239,172,0.15)", border: "1px solid rgba(134,239,172,0.3)" }}
        >
          <CheckCircle2 size={28} style={{ color: "#86efac" }} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Платёж принят</h1>
        <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
          Клики уже на балансе: <b>{clicks}</b>. Готово к работе.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/studio" className="btn-gradient">Открыть студию →</Link>
          <Link href="/billing" className="btn-ghost">К тарифам</Link>
        </div>
        <p className="text-xs mt-10" style={{ color: "var(--text-muted)" }}>
          Чек на e-mail отправит Robokassa автоматически.
        </p>
      </main>
    </div>
  );
}
