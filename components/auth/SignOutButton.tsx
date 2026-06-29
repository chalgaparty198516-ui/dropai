"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
      className="inline-flex items-center gap-1.5 text-sm rounded-lg px-2.5 py-1.5 hover:bg-white/5 transition-colors"
      style={{ color: "var(--text-muted)" }}
      aria-label="Выйти"
    >
      <LogOut size={14} />
      <span className="hidden sm:inline">Выйти</span>
    </button>
  );
}
