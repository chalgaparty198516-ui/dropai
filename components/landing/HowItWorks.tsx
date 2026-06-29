import Link from "next/link";
import { Upload, Wand2, Download } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Upload,
    title: "Загрузите фото товара",
    desc: "Подойдёт обычная фотография со смартфона. Не нужна студия или профессиональная техника.",
    tint: "rgba(168,85,247,0.14)",
    iconColor: "#c084fc",
  },
  {
    n: "02",
    icon: Wand2,
    title: "Выберите стиль",
    desc: "Студия, интерьер, инфографика и десятки сценариев. AI адаптирует фон под ваш товар.",
    tint: "rgba(217,70,239,0.14)",
    iconColor: "#f0abfc",
  },
  {
    n: "03",
    icon: Download,
    title: "Скачайте результат",
    desc: "Готовая карточка для маркетплейса за минуту. Несколько вариантов на выбор.",
    tint: "rgba(129,140,248,0.14)",
    iconColor: "#a5b4fc",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 container mx-auto px-4 max-w-5xl scroll-mt-20">
      <div className="text-center mb-16">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Просто
        </p>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          3 шага — и <span className="gradient-text">готово</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.n} className="glass flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: s.tint, color: s.iconColor }}
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.n}
                </span>
              </div>
              <div
                className="w-full aspect-[3/4] rounded-2xl flex items-center justify-center text-sm overflow-hidden relative"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(217,70,239,0.05) 100%)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(ellipse at center, rgba(168,85,247,0.2) 0%, transparent 70%)",
                  }}
                />
                <Icon size={56} strokeWidth={1.25} style={{ color: s.iconColor, opacity: 0.7, position: "relative" }} />
              </div>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <Link href="/login?tab=register" className="btn-gradient text-base px-7 py-3">
          Создать карточку →
        </Link>
      </div>
    </section>
  );
}
