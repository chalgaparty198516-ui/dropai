import { Shirt, SprayCan, Sofa, Mouse, ToyBrick, Pill, Utensils, Coffee } from "lucide-react";

const CATEGORIES = [
  { label: "Одежда", icon: Shirt },
  { label: "Бытовая химия", icon: SprayCan },
  { label: "Товары для дома", icon: Sofa },
  { label: "Электроника", icon: Mouse },
  { label: "Игрушки", icon: ToyBrick },
  { label: "Лекарства", icon: Pill },
  { label: "Посуда", icon: Utensils },
  { label: "Еда", icon: Coffee },
];

export function Categories() {
  return (
    <section className="py-24 container mx-auto px-4 max-w-5xl">
      <div className="text-center mb-4">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Подходит для разных <span className="gradient-text">категорий</span>
        </h2>
      </div>
      <div className="text-center mb-14">
        <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
          Покажите нам товар — получите чистую, продающую карточку
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="glass flex flex-col items-center justify-center gap-3 p-6 aspect-[4/5] hover:border-white/20 transition-colors"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(217,70,239,0.08) 100%)",
                  border: "1px solid rgba(168,85,247,0.2)",
                }}
              >
                <Icon size={26} strokeWidth={1.75} style={{ color: "#c084fc" }} />
              </div>
              <span
                className="text-sm font-semibold text-center"
                style={{ color: "var(--text-primary)" }}
              >
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
