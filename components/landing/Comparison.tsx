import Link from "next/link";
import { X, Check, Camera, Sparkles } from "lucide-react";

const TRADITIONAL = [
  "Съёмка, локация, свет, реквизит",
  "Ретушь и обработка — много итераций",
  "Стоимость от 5 000 ₽ за товар",
];

const DROP = [
  "Загрузка фото + выбор стиля — 2 клика",
  "Бесконечное количество вариантов",
  "От 3 кликов за карточку",
];

export function Comparison() {
  return (
    <section className="py-24" style={{ background: "rgba(255,255,255,0.015)" }}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Профессиональный визуал <span className="gradient-text">за пару минут</span>
          </h2>
        </div>
        <div className="text-center mb-14">
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Традиционный путь — фотограф + ретушёр — занимает дни и стоит дорого.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Традиционная съёмка
                </p>
                <p className="font-bold text-xl">3–7 дней</p>
              </div>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}
              >
                <Camera size={20} strokeWidth={1.75} />
              </div>
            </div>
            <ul className="flex flex-col gap-3">
              {TRADITIONAL.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: "rgba(239,68,68,0.12)" }}
                  >
                    <X size={11} strokeWidth={2.5} style={{ color: "#f87171" }} />
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t}</p>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(217,70,239,0.08) 100%)",
              border: "1px solid rgba(168,85,247,0.3)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "#d8b4fe" }}
                >
                  DROP.AI
                </p>
                <p className="font-bold text-xl">~1 минута</p>
              </div>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-fuchsia) 0%, var(--accent-violet) 100%)",
                  color: "#0a0a0a",
                  boxShadow: "0 4px 20px -4px rgba(168, 85, 247, 0.6)",
                }}
              >
                <Sparkles size={20} strokeWidth={2.25} />
              </div>
            </div>
            <ul className="flex flex-col gap-3">
              {DROP.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: "rgba(168,85,247,0.3)" }}
                  >
                    <Check size={11} strokeWidth={3} style={{ color: "#e9d5ff" }} />
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/login?tab=register" className="btn-gradient text-base px-7 py-3">
            Попробовать сейчас →
          </Link>
        </div>
      </div>
    </section>
  );
}
