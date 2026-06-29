import Link from "next/link";
import { Sparkles, Menu } from "lucide-react";

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        background: "rgba(10, 10, 10, 0.55)",
        borderBottomColor: "var(--border-subtle)",
      }}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-3 max-w-6xl">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-fuchsia) 0%, var(--accent-violet) 50%, var(--accent-indigo) 100%)",
              boxShadow: "0 4px 16px -4px rgba(168, 85, 247, 0.5)",
            }}
          >
            <Sparkles size={14} strokeWidth={2.5} style={{ color: "#0a0a0a" }} />
          </div>
          <span className="font-semibold text-lg tracking-tight">
            DROP<span className="gradient-text">.AI</span>
          </span>
        </Link>

        <div
          className="hidden md:flex items-center gap-6 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          <a href="#how" className="hover:text-white transition-colors">Как это работает</a>
          <a href="#pricing" className="hover:text-white transition-colors">Тарифы</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">Войти</Link>
          <Link href="/login?tab=register" className="btn-gradient">Начать</Link>
          <button
            aria-label="Открыть меню"
            className="md:hidden shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <Menu size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
