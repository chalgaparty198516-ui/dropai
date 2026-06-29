import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <header className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="container mx-auto max-w-3xl px-4 h-14 flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm hover:text-white transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} /> DROP.AI
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
        <article
          className="prose prose-invert max-w-none mt-8 text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {children}
        </article>
      </main>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: "var(--text-primary)" }}>
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>;
}

export function DL({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 my-4">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {k}:
          </dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
