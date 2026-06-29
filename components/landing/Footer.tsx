import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer
      className="border-t py-14"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
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
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              AI-фотостудия для товаров — быстро, без команды продакшна
            </p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Продукт</p>
            <ul className="flex flex-col gap-2">
              <li><Link className="text-sm hover:text-white transition-colors" style={{ color: "var(--text-muted)" }} href="/">Главная</Link></li>
              <li><Link className="text-sm hover:text-white transition-colors" style={{ color: "var(--text-muted)" }} href="/studio">Студия</Link></li>
              <li><Link className="text-sm hover:text-white transition-colors" style={{ color: "var(--text-muted)" }} href="/projects">Проекты</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Поддержка</p>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="mailto:hello@drop.ai"
                  className="text-sm hover:text-white transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  hello@drop.ai
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Документы</p>
            <ul className="flex flex-col gap-2">
              <li><Link className="text-sm hover:text-white transition-colors" style={{ color: "var(--text-muted)" }} href="/privacy">Политика конфиденциальности</Link></li>
              <li><Link className="text-sm hover:text-white transition-colors" style={{ color: "var(--text-muted)" }} href="/terms">Условия использования</Link></li>
              <li><Link className="text-sm hover:text-white transition-colors" style={{ color: "var(--text-muted)" }} href="/offer">Публичная оферта</Link></li>
            </ul>
          </div>
        </div>
        <div
          className="pt-6 border-t flex items-center justify-center"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © 2026 DROP.AI. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
