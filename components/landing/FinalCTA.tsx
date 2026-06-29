import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          style={{
            position: "absolute",
            top: "-25%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 1000,
            height: 600,
            background:
              "radial-gradient(ellipse, rgba(168,85,247,0.22) 0%, rgba(217,70,239,0.16) 45%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
      </div>
      <div className="relative z-10 container mx-auto px-4 max-w-3xl text-center">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-6"
          style={{ color: "var(--text-muted)" }}
        >
          Всё ещё не уверены?
        </p>
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-7">
          <span className="block">Попробуйте</span>
          <span className="block sm:whitespace-nowrap">несколько карточек</span>
          <span className="block gradient-text">бесплатно</span>
        </h2>
        <p
          className="text-lg sm:text-xl mb-10 max-w-xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          Привязывать карту не нужно. 8 кликов сразу после регистрации.
        </p>
        <Link href="/login?tab=register" className="btn-gradient text-lg px-9 py-4">
          Давайте попробуем →
        </Link>
      </div>
    </section>
  );
}
