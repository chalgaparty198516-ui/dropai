import Link from "next/link";
import { Sparkles, Home } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BackButton } from "@/components/studio/BackButton";

export function StudioHeader({
  clicks,
  userLabel,
}: {
  clicks: number;
  userLabel: string;
}) {
  return (
    <header className="border-b sticky top-0 z-40" style={{ borderColor: "var(--border-subtle)", background: "rgba(10,10,10,0.7)", backdropFilter: "blur(20px)" }}>
      <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-fuchsia) 0%, var(--accent-violet) 50%, var(--accent-indigo) 100%)",
              }}
            >
              <Sparkles size={14} strokeWidth={2.5} style={{ color: "#0a0a0a" }} />
            </div>
            <span className="font-semibold text-sm">
              DROP<span className="gradient-text">.AI</span>
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <BackButton />
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:text-white transition-colors inline-flex items-center gap-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <Home size={13} /> Домой
            </Link>
            <Link
              href="/studio"
              className="px-3 py-1.5 rounded-lg hover:text-white transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Студия
            </Link>
            <Link
              href="/projects"
              className="px-3 py-1.5 rounded-lg hover:text-white transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Проекты
            </Link>
            <Link
              href="/billing"
              className="px-3 py-1.5 rounded-lg hover:text-white transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Тарифы
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.25)",
              color: "#d8b4fe",
            }}
          >
            <span style={{ color: "#c084fc" }}>✦</span> {clicks} кликов
          </span>
          <span
            className="text-sm hidden md:inline truncate max-w-[160px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {userLabel}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
