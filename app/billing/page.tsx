import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db, ensureMigrations, getUserClicks } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { getRobokassaEnv } from "@/lib/robokassa";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { BillingPlanGrid } from "@/components/billing/BillingPlanGrid";
import { PromoCodeForm } from "@/components/billing/PromoCodeForm";

export const metadata = { title: "Тарифы и оплата — DROP.AI" };

export default async function BillingPage() {
  await ensureMigrations();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?tab=register");

  const clicks = await getUserClicks(session.user.id);

  const payments = await db
    .selectFrom("payments")
    .selectAll()
    .where("user_id", "=", session.user.id)
    .orderBy("created_at", "desc")
    .limit(20)
    .execute();

  const env = getRobokassaEnv();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <StudioHeader clicks={clicks} userLabel={session.user.name || session.user.email} />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Пополнить <span className="gradient-text">баланс</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            На балансе: <b>{clicks}</b> кликов. Оплата через Robokassa.
            {env.isConfigured && env.isTest && (
              <>
                {" · "}
                <span style={{ color: "#fcd34d" }}>Тестовый режим (IsTest=1)</span>
              </>
            )}
            {!env.isConfigured && (
              <>
                {" · "}
                <span style={{ color: "#fca5a5" }}>
                  Robokassa не настроен — реальной оплаты не будет
                </span>
              </>
            )}
          </p>
        </div>

        <PromoCodeForm />

        <BillingPlanGrid plans={PLANS} configured={env.isConfigured} />

        <section className="mt-14">
          <h2 className="text-xl font-bold mb-4">История платежей</h2>
          {payments.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Пока пусто.
            </p>
          ) : (
            <div className="glass overflow-hidden">
              <table className="w-full text-sm">
                <thead style={{ background: "rgba(255,255,255,0.03)" }}>
                  <tr style={{ color: "var(--text-muted)" }}>
                    <Th>№</Th>
                    <Th>Тариф</Th>
                    <Th>Сумма</Th>
                    <Th>Кликов</Th>
                    <Th>Статус</Th>
                    <Th>Создан</Th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const plan = PLANS.find((x) => x.id === p.plan_id);
                    const status =
                      p.status === "paid"
                        ? { label: "Оплачен", color: "#86efac" }
                        : p.status === "failed"
                        ? { label: "Ошибка", color: "#fca5a5" }
                        : { label: "Ожидание", color: "#fcd34d" };
                    return (
                      <tr key={p.id} className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                        <Td>{p.id}</Td>
                        <Td>{plan?.name ?? p.plan_id}</Td>
                        <Td>{p.amount_rub} ₽</Td>
                        <Td>✦ {p.clicks}</Td>
                        <Td>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${status.color}1a`, color: status.color }}
                          >
                            {status.label}
                          </span>
                        </Td>
                        <Td>{new Date(Number(p.created_at)).toLocaleString("ru-RU")}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs mt-10" style={{ color: "var(--text-muted)" }}>
          Оплачивая, вы соглашаетесь с{" "}
          <Link href="/offer" className="underline">публичной офертой</Link>.
        </p>
      </main>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold text-xs uppercase tracking-widest px-4 py-3">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
