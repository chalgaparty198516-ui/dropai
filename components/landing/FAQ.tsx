"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "Подходит ли сервис для Wildberries, Ozon и Яндекс Маркета?",
    a: "Да. Мы генерируем карточки под стандарты всех популярных российских маркетплейсов — WB, Ozon, Яндекс Маркет. Вы можете выбрать фон, стиль и соотношение сторон под требования нужной площадки.",
  },
  {
    q: "Есть ли бесплатная версия? Какие ограничения?",
    a: "При регистрации вы получаете 8 кликов бесплатно — этого хватит, чтобы протестировать сервис. Дальше можно пополнить баланс на любой удобный тариф — от 390 ₽.",
  },
  {
    q: "Как создать инфографику с характеристиками товара?",
    a: "В режиме «Карточка товара» введите ключевые характеристики в поле для текста — AI сам разместит их в виде аккуратной инфографики поверх изображения.",
  },
  {
    q: "Можно ли создать несколько вариантов карточки?",
    a: "Да. Сервис поддерживает генерацию серий из нескольких карточек за один запрос. Вы можете одобрить первую карточку и продолжить серию или запустить повторную генерацию.",
  },
  {
    q: "Какие форматы изображений поддерживаются?",
    a: "Поддерживаются JPG и PNG. Рекомендуемый минимальный размер — 800×800 пикселей. Чем лучше исходное фото, тем выше качество результата.",
  },
  {
    q: "Это сложно? Нужны навыки дизайна?",
    a: "Нет. Интерфейс максимально прост: загрузите фото, опишите товар и нажмите «Сгенерировать». Навыки дизайна и ретуши не нужны.",
  },
  {
    q: "Сколько времени занимает генерация?",
    a: "Обычно 20–40 секунд на карточку в зависимости от выбранного качества и нагрузки серверов.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 scroll-mt-20" style={{ background: "rgba(255,255,255,0.015)" }}>
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            FAQ
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Частые вопросы</h2>
          <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
            Если не нашли вопрос — напишите нам на{" "}
            <a
              href="mailto:hello@drop.ai"
              style={{ color: "#c084fc" }}
              className="hover:underline"
            >
              hello@drop.ai
            </a>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {ITEMS.map((it, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--bg-glass)",
                  border: `1px solid ${isOpen ? "rgba(168,85,247,0.3)" : "var(--border-subtle)"}`,
                  transition: "border-color 0.15s ease",
                }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 cursor-pointer"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{ color: "var(--text-primary)" }}
                >
                  <span className="font-medium text-sm">{it.q}</span>
                  <span
                    className="shrink-0 transition-transform"
                    style={{
                      color: "var(--text-muted)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                    }}
                  >
                    <ChevronDown size={16} />
                  </span>
                </button>
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? 400 : 0,
                    opacity: isOpen ? 1 : 0,
                    transition: "max-height 0.25s ease, opacity 0.2s ease",
                  }}
                >
                  <p
                    className="px-6 pb-5 text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {it.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
