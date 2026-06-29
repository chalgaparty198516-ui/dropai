"use client";

import { useState } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import type { Plan } from "@/lib/plans";

export function BillingPlanGrid({
  plans,
  configured,
}: {
  plans: Plan[];
  configured: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function buy(planId: string) {
    setBusy(planId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/billing/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      if (data.url) {
        window.location.href = data.url;
      } else {
        setNotice(data.message ?? "Платёж создан, но Robokassa не настроен.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {!configured && (
        <div
          className="rounded-2xl p-4 mb-6 flex items-start gap-3 text-sm"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            color: "#fcd34d",
          }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <b>Robokassa не подключена.</b> Кнопки создадут запись в БД (pending), но не пойдут на
            реальную оплату. Чтобы включить — добавьте в <code>.env</code>:{" "}
            <code>ROBOKASSA_MERCHANT_LOGIN</code>, <code>ROBOKASSA_PASSWORD1</code>,{" "}
            <code>ROBOKASSA_PASSWORD2</code>. В личном кабинете Robokassa укажите Result URL:{" "}
            <code>https://&lt;ваш домен&gt;/api/billing/robokassa/result</code>.
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-3 mb-4 text-sm flex items-start gap-2"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div
          className="rounded-xl p-3 mb-4 text-sm"
          style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#d8b4fe" }}
        >
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((p) => (
          <div key={p.id} className="relative h-full">
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
                <p className="text-3xl font-extrabold">{p.priceRub.toLocaleString("ru-RU")} ₽</p>
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
                    ≈ {Math.floor(p.clicks / 3)} изображений на OpenAI
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(168,85,247,0.25)" }}
                  >
                    <Check size={11} strokeWidth={3} style={{ color: "#e9d5ff" }} />
                  </div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    ≈ {p.clicks} изображений на Pollinations
                  </span>
                </div>
              </div>
              <div className="flex-1" />
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => buy(p.id)}
                className={`${p.highlight ? "btn-gradient" : "btn-dark"} w-full disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {busy === p.id ? <Loader2 size={14} className="animate-spin" /> : null}
                Купить →
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
