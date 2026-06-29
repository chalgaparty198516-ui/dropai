import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export function StubPage({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle: string;
  body?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <header className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm hover:text-white transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} /> DROP.AI
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-3xl px-4 py-20">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(168,85,247,0.12)",
              color: "#c084fc",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
          >
            <Construction size={18} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            В разработке
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
          {subtitle}
        </p>
        {body && <div className="mt-10 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{body}</div>}
        <div className="mt-10">
          <Link href="/" className="btn-gradient">← На главную</Link>
        </div>
      </main>
    </div>
  );
}
