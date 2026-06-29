"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";

type Mode = "login" | "register";

export function LoginForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  async function handleGoogle() {
    setError(null);
    setLoading("google");
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/studio",
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Google OAuth недоступен — добавьте GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET в .env"
      );
      setLoading(null);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("email");
    try {
      if (isRegister) {
        const result = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
          callbackURL: "/studio",
        });
        if (result.error) throw new Error(result.error.message || "Ошибка регистрации");
      } else {
        const result = await signIn.email({
          email,
          password,
          callbackURL: "/studio",
        });
        if (result.error) throw new Error(result.error.message || "Неверный email или пароль");
      }
      router.push("/studio");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
      setLoading(null);
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-base)" }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 800,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(168,85,247,0.18) 0%, rgba(217,70,239,0.1) 50%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
      </div>

      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm hover:text-white transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} /> На главную
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link
            href="/"
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-fuchsia) 0%, var(--accent-violet) 50%, var(--accent-indigo) 100%)",
              boxShadow: "0 8px 28px -8px rgba(168, 85, 247, 0.6)",
            }}
          >
            <Sparkles size={22} strokeWidth={2.25} style={{ color: "#0a0a0a" }} />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isRegister ? "Создайте аккаунт" : "Вход в DROP.AI"}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            {isRegister
              ? "8 кликов в подарок при регистрации"
              : "Войдите, чтобы продолжить работу"}
          </p>
        </div>

        <div className="glass-strong p-7 flex flex-col gap-4">
          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="btn-dark w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {loading === "google" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Продолжить с Google
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              или
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          <form onSubmit={handleEmail} className="flex flex-col gap-4">
            {isRegister && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Имя
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван"
                  autoComplete="name"
                  className="px-4 py-2.5 rounded-xl text-sm outline-none focus:border-violet-500/50"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="px-4 py-2.5 rounded-xl text-sm outline-none focus:border-violet-500/50"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Пароль
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="не менее 8 символов"
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="px-4 py-2.5 rounded-xl text-sm outline-none focus:border-violet-500/50"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </label>

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

            <button
              type="submit"
              disabled={loading !== null}
              className="btn-gradient w-full py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "email" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {isRegister ? "Создать аккаунт →" : "Войти →"}
            </button>
          </form>

          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            {isRegister ? (
              <>
                Уже есть аккаунт?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{ color: "#c084fc" }}
                  className="hover:underline"
                >
                  Войти
                </button>
              </>
            ) : (
              <>
                Нет аккаунта?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  style={{ color: "#c084fc" }}
                  className="hover:underline"
                >
                  Создать
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-[11px] text-center mt-6" style={{ color: "var(--text-muted)" }}>
          Регистрируясь, вы соглашаетесь с{" "}
          <Link href="/terms" style={{ color: "var(--text-secondary)" }}>
            Условиями
          </Link>{" "}
          и{" "}
          <Link href="/privacy" style={{ color: "var(--text-secondary)" }}>
            Политикой конфиденциальности
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5.04c1.96 0 3.7.67 5.07 1.98l3.78-3.78C18.49 1.18 15.55 0 12 0 7.32 0 3.28 2.69 1.31 6.62l4.4 3.42C6.74 7.07 9.13 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46c-.28 1.5-1.13 2.78-2.4 3.63l3.86 2.99c2.27-2.09 3.58-5.18 3.58-8.81z"
      />
      <path
        fill="#FBBC05"
        d="M5.71 14.04A7.27 7.27 0 0 1 5.32 12c0-.71.14-1.4.39-2.04L1.31 6.62A11.94 11.94 0 0 0 0 12c0 1.95.47 3.78 1.31 5.38l4.4-3.34z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.86-2.99c-1.07.72-2.44 1.15-4.08 1.15-2.87 0-5.26-2.03-6.29-4.96l-4.4 3.42C3.28 21.31 7.32 24 12 24z"
      />
    </svg>
  );
}
