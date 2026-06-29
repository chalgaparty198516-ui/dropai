"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="px-3 py-1.5 rounded-lg hover:text-white transition-colors inline-flex items-center gap-1.5 text-sm cursor-pointer"
      style={{ color: "var(--text-muted)" }}
      aria-label="Назад"
      title="Назад"
    >
      <ArrowLeft size={13} /> Назад
    </button>
  );
}
