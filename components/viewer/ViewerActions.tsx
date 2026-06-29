"use client";

import { Download, ExternalLink } from "lucide-react";

export function ViewerActions({ src, filename }: { src: string; filename: string }) {
  async function download() {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(src, "_blank", "noopener,noreferrer");
    }
  }

  function openRaw() {
    // Принудительно открыть голую картинку без HTML-обёртки —
    // помечаем через querystring чтобы middleware пропустил.
    window.open(src + "?raw=1", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={download} className="btn-gradient text-xs">
        <Download size={13} /> Скачать
      </button>
      <button
        type="button"
        onClick={openRaw}
        className="btn-dark text-xs"
        title="Открыть оригинал в новой вкладке"
      >
        <ExternalLink size={13} />
      </button>
    </div>
  );
}
