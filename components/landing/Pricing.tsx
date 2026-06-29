import Link from "next/link";
import { Check } from "lucide-react";

type Plan = {
  name: string;
  tagline: string;
  price: number;
  clicks: number;
  images: number;
  highlight?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  { name: "Старт", tagline: "Для пробы сервиса", price: 390, clicks: 36, images: 12 },
  { name: "Креатор", tagline: "Для серии товаров", price: 990, clicks: 105, images: 35 },
  {
    name: "Студия",
    tagline: "Оптимальный выбор",
    price: 2490,
    clicks: 300,
    images: 100,
    highlight: true,
    badge: "Выбирают 67%",
  },
  { name: "Бизнес", tagline: "Максимум возможностей", price: 6490, clicks: 900, images: 300 },
];

function formatRub(n: number) {
  return n.toLocaleString("ru-RU");
}

export function Pricing() {
  return (
    <section id="pricing" className="py-24 container mx-auto px-4 max-w-6xl scroll-mt-20">
      <div className="text-center mb-4">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Тарифы</h2>
      </div>
      <div className="text-center mb-14">
        <p
          className="text-base sm:text-lg italic"
          style={{ color: "var(--text-secondary)" }}
        >
          <span style={{ color: "#c084fc" }}>✦</span> Клик — валюта DROP.AI для создания контента
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((p) => (
          <div key={p.name} className="relative h-full">
            {p.badge && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap z-10"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-fuchsia) 0%, var(--accent-violet) 100%)",
                  color: "#0a0a0a",
                  boxShadow: "0 4px 16px -4px rgba(168, 85, 247, 0.55)",
                }}
              >
                {p.badge}
              </span>
            )}
            <div
              className={`${p.highlight ? "glass-strong" : "glass"} flex flex-col gap-5 p-6 h-full`}
              style={
                p.highlight
                  ? {
                      borderColor: "rgba(168,85,247,0.4)",
                      boxShadow: "0 0 0 1px rgba(168,85,247,0.15), 0 20px 40px -20px rgba(168,85,247,0.35)",
                    }
                  : undefined
              }
            >
              <div>
                <p className="font-bold text-xl italic">{p.name}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  {p.tagline}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-3xl font-extrabold">{formatRub(p.price)} ₽</p>
                <p className="inline-flex items-center gap-1.5 text-base font-semibold">
                  <span style={{ color: "#c084fc" }}>✦</span> {p.clicks} кликов
                </p>
              </div>
              <div className="h-px" style={{ background: "var(--border-subtle)" }} />
              <div>
                <p
                  className="text-xs uppercase tracking-widest mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  Хватит на
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(168,85,247,0.25)" }}
                  >
                    <Check size={11} strokeWidth={3} style={{ color: "#e9d5ff" }} />
                  </div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    ≈ {p.images} изображений
                  </span>
                </div>
              </div>
              <div className="flex-1" />
              <Link
                href="/billing"
                className={p.highlight ? "btn-gradient" : "btn-dark"}
                style={{ textAlign: "center" }}
              >
                Купить →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div
          className="rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(217,70,239,0.08) 100%)",
            border: "1px solid rgba(168,85,247,0.3)",
          }}
        >
          <div className="relative shrink-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: "rgba(255,255,255,0.06)", color: "#c084fc" }}
            >
              ✦
            </div>
            <span
              className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-fuchsia) 0%, var(--accent-violet) 100%)",
                color: "#0a0a0a",
              }}
            >
              +8
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg">Бесплатные клики для новых пользователей</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              8 кликов при регистрации — хватит, чтобы протестировать сервис. Без привязки карты.
            </p>
          </div>
          <Link
            href="/billing"
            className="btn-ghost whitespace-nowrap"
          >
            Давайте попробуем →
          </Link>
        </div>
      </div>
    </section>
  );
}
