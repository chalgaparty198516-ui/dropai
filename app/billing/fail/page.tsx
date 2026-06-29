import Link from "next/link";
import { XCircle } from "lucide-react";

export const metadata = { title: "Платёж не прошёл — DROP.AI" };

export default function BillingFailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: "var(--bg-base)" }}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "rgba(252,165,165,0.15)", border: "1px solid rgba(252,165,165,0.3)" }}
      >
        <XCircle size={28} style={{ color: "#fca5a5" }} />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">Платёж не прошёл</h1>
      <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
        Деньги не списаны. Можно попробовать ещё раз или выбрать другой способ.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/billing" className="btn-gradient">Назад к тарифам</Link>
        <Link href="/" className="btn-ghost">На главную</Link>
      </div>
    </div>
  );
}
