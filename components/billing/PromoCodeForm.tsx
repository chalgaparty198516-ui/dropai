"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ticket, CheckCircle2 } from "lucide-react";

export function PromoCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ clicks: number; balance: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/billing/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const raw = await res.text();
      let data: { error?: string; clicksAdded?: number; balance?: number; ok?: boolean };
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Пустой ответ (HTTP ${res.status})`);
      }
      if (!res.ok || !data.ok) throw new Error(data.error || "Не удалось применить");
      setSuccess({ clicks: data.clicksAdded!, balance: data.balance! });
      setCode("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl p-5 mb-8 flex flex-col gap-3"
      style={{
        background: "rgba(168,85,247,0.08)",
        border: "1px solid rgba(168,85,247,0.25)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(168,85,247,0.18)", color: "#c084fc" }}
        >
          <Ticket size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold">Есть промокод?</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Введите код и получите бонусные клики на баланс.
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ДРОП20000"
          maxLength={64}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl text-sm font-mono uppercase tracking-wider outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : null}
          Применить
        </button>
      </div>

      {error && (
        <p
          className="text-xs rounded-lg px-3 py-2"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#fca5a5",
          }}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className="text-xs rounded-lg px-3 py-2 flex items-center gap-2"
          style={{
            background: "rgba(134,239,172,0.1)",
            border: "1px solid rgba(134,239,172,0.3)",
            color: "#86efac",
          }}
        >
          <CheckCircle2 size={14} />
          Начислено <b>+{success.clicks}</b> кликов. Новый баланс: <b>{success.balance}</b>.
        </p>
      )}
    </form>
  );
}
