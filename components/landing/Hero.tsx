import Link from "next/link";

const PILLS = [
  "AI ГЕНЕРАЦИЯ",
  "ЛЕГКО РАЗОБРАТЬСЯ",
  "БЕЗ СТУДИИ",
  "В ПАРУ КЛИКОВ",
  "БЕЗ СЛОЖНЫХ НАСТРОЕК",
  "ДЛЯ WB И OZON",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden flex flex-col min-h-[calc(100dvh-3.5rem)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          style={{
            position: "absolute", top: "-10%", right: "-6%",
            width: 760, height: 760, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.28) 0%, rgba(168,85,247,0) 65%)",
            filter: "blur(90px)",
          }}
        />
        <div
          style={{
            position: "absolute", top: "28%", left: "-10%",
            width: 580, height: 580, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(217,70,239,0.22) 0%, rgba(217,70,239,0) 65%)",
            filter: "blur(100px)",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: "0%", right: "20%",
            width: 420, height: 420, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(129,140,248,0.2) 0%, rgba(129,140,248,0) 65%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-6xl flex-1 flex flex-col justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.3)",
              color: "#d8b4fe",
            }}
          >
            <span>✦</span> Карточки с CTR выше на 40%
          </span>

          <h1 className="text-3xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
            Продающая карточка<br />товара за <span className="gradient-text">56 секунд</span>
          </h1>

          <p
            className="text-sm sm:text-xl mt-6 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            DROP.AI — AI-фотостудия для маркетплейсов. Загрузите обычное фото — получите готовую карточку для Wildberries, Ozon и Яндекс Маркета.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
            <Link href="/login?tab=register" className="btn-gradient text-base px-7 py-3">
              Создать карточку →
            </Link>
            <Link href="#how" className="btn-dark text-base px-7 py-3">
              Как это работает
            </Link>
          </div>
          <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
            Карту привязывать не нужно · 8 бесплатных кликов при регистрации
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <div
          className="overflow-hidden py-5 border-y"
          style={{
            borderColor: "var(--border-subtle)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="marquee-track">
            {[...PILLS, ...PILLS, ...PILLS].map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest whitespace-nowrap"
                style={{
                  background:
                    i % 2 === 0
                      ? "linear-gradient(135deg, rgba(168,85,247,0.14) 0%, rgba(217,70,239,0.1) 100%)"
                      : "rgba(255,255,255,0.04)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                ✦ {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
