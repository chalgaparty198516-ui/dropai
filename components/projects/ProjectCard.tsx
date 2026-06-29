"use client";

import { Download, ExternalLink } from "lucide-react";

export function ProjectCard({
  src,
  styleLabel,
  dateLabel,
  demo,
}: {
  src: string;
  styleLabel: string;
  dateLabel: string;
  demo: boolean;
}) {
  async function download() {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = src.split("/").pop() ?? "drop-ai.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(src, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="glass flex flex-col gap-3 p-3 group hover:border-violet-500/40 transition-colors">
      <div className="relative aspect-square rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={styleLabel} className="w-full h-full object-cover" loading="lazy" />
        {demo && (
          <span
            className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(251,191,36,0.85)", color: "#0a0a0a" }}
          >
            DEMO
          </span>
        )}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <button
            type="button"
            onClick={download}
            className="btn-gradient !py-2 !px-3 text-xs"
            title="Скачать"
          >
            <Download size={13} /> Скачать
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark !py-2 !px-3 text-xs"
            title="Открыть в новой вкладке"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold truncate">{styleLabel}</span>
        <span style={{ color: "var(--text-muted)" }}>{dateLabel}</span>
      </div>
    </div>
  );
}
