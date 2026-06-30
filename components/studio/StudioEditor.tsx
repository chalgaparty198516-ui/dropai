"use client";

import { useRef, useState, useCallback } from "react";
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Download,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Zap,
  Check,
  ExternalLink,
  Wand2,
} from "lucide-react";
import { STYLES, DEFAULT_STYLE_ID } from "@/lib/styles";
import { QUALITY_PRESETS, DEFAULT_QUALITY, type Quality } from "@/lib/quality";

type Provider =
  | "openai"
  | "replicate"
  | "fal"
  | "huggingface"
  | "gemini"
  | "pollinations"
  | "demo";

type Variant = { id: string; outputUrl: string; provider: Provider; cost: number };
type Result = {
  inputUrl: string;
  variants: Variant[];
  provider: Provider;
  enhancedPrompt: string;
  usedKontext: boolean;
  cost: number;
  balance: number;
};

const PROVIDER_META: Record<Provider, { label: string; tone: string; explain: string }> = {
  openai: {
    label: "OpenAI · gpt-image-1",
    tone: "#a3e635",
    explain: "Платная модель, сохраняет товар 1-в-1. Самое высокое качество.",
  },
  replicate: {
    label: "Replicate · Flux Kontext Pro",
    tone: "#f472b6",
    explain:
      "Платный image-to-image (~$0.04 за карточку). Flux Kontext сохраняет товар и применяет сцену из стиля. Нужен REPLICATE_API_TOKEN.",
  },
  fal: {
    label: "fal.ai · Flux Kontext",
    tone: "#fb7185",
    explain:
      "Платный image-to-image, очень быстрый (5–10 сек). Качество Flux Kontext. Нужен FAL_KEY.",
  },
  huggingface: {
    label: "HuggingFace · SDXL img2img",
    tone: "#fde047",
    explain:
      "БЕСПЛАТНЫЙ image-to-image через HF Inference. Качество ниже Flux Kontext, но фото-референс используется. Нужен HF_TOKEN.",
  },
  gemini: {
    label: "Google Gemini · Nano Banana",
    tone: "#60a5fa",
    explain:
      "БЕСПЛАТНЫЙ image-to-image. Gemini видит ваше фото и сохраняет товар на карточке (~100 генераций в день на free tier).",
  },
  pollinations: {
    label: "Pollinations · Flux (бесплатно)",
    tone: "#c084fc",
    explain:
      "Бесплатный text-to-image. Flux НЕ видит ваше фото — рисует с нуля по описанию. Для сохранения товара получите бесплатный GEMINI_API_KEY за 2 минуты.",
  },
  demo: {
    label: "Demo-режим",
    tone: "#fbbf24",
    explain: "AI отключён. Включите GEMINI_API_KEY (бесплатно) или OPENAI_API_KEY.",
  },
};

const VARIANT_OPTIONS = [
  { n: 1, label: "1 вариант" },
  { n: 3, label: "3 варианта" },
  { n: 4, label: "4 варианта" },
];

export function StudioEditor({
  initialClicks,
  provider,
  cost,
}: {
  initialClicks: number;
  provider: Provider;
  cost: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string>(DEFAULT_STYLE_ID);
  const [prompt, setPrompt] = useState("");
  const [variants, setVariants] = useState<number>(1);
  const [quality, setQuality] = useState<Quality>(DEFAULT_QUALITY);
  const [describing, setDescribing] = useState(false);
  const [title, setTitle] = useState("");
  const [benefits, setBenefits] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [chosenVariant, setChosenVariant] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(initialClicks);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File | undefined | null) => {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
      setError("Поддерживаются JPG, PNG, WebP");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Файл больше 10 МБ");
      return;
    }
    setError(null);
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const qPreset = QUALITY_PRESETS[quality];
  const totalCost = cost * variants * qPreset.costMultiplier;

  async function handleGenerate() {
    if (!file) {
      setError("Сначала загрузите фото товара");
      return;
    }
    // Только Pollinations требует обязательное описание — он не видит фото.
    // OpenAI и Gemini делают настоящий image-to-image.
    if (provider === "pollinations" && prompt.trim().length < 15) {
      setError(
        "Pollinations Flux не видит ваше фото — он рисует с нуля. Опишите товар подробно " +
          "(минимум 15 символов): что это, цвет, материал, форма. Или получите бесплатный " +
          "GEMINI_API_KEY на aistudio.google.com — Gemini сохранит ваш товар."
      );
      return;
    }
    if (totalCost > 0 && balance < totalCost) {
      setError(`Недостаточно кликов. Нужно ${totalCost}, на балансе ${balance}.`);
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("style", styleId);
      fd.append("prompt", prompt);
      fd.append("variants", String(variants));
      fd.append("quality", quality);
      fd.append("title", title);
      fd.append("benefits", benefits);
      const res = await fetch("/api/studio/generate", { method: "POST", body: fd });
      const raw = await res.text();
      if (!raw) {
        throw new Error(
          res.status === 504 || res.status === 502
            ? "Сервер не уложился в лимит времени (60 сек на Vercel Hobby). Попробуйте 1 вариант или Эконом-качество."
            : `Пустой ответ от сервера (HTTP ${res.status}). Попробуйте ещё раз.`
        );
      }
      let data: Result & { error?: string };
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `Сервер вернул не-JSON (HTTP ${res.status}). ${raw.slice(0, 120)}`
        );
      }
      if (!res.ok) throw new Error(data.error || `Ошибка генерации (HTTP ${res.status})`);
      setResult(data);
      setChosenVariant(0);
      setBalance(data.balance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    onFile(e.dataTransfer.files?.[0]);
  }

  async function describeFromAI() {
    if (!file) {
      setError("Сначала загрузите фото");
      return;
    }
    setDescribing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/studio/describe", { method: "POST", body: fd });
      const raw = await res.text();
      if (!raw) {
        throw new Error(
          res.status === 504 || res.status === 502
            ? "Gemini не ответил вовремя. Попробуй ещё раз."
            : `Пустой ответ (HTTP ${res.status})`
        );
      }
      let data: { description?: string; error?: string };
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Сервер вернул не-JSON (HTTP ${res.status}). ${raw.slice(0, 120)}`);
      }
      if (!res.ok) throw new Error(data.error || `Не удалось получить описание (HTTP ${res.status})`);
      if (data.description) setPrompt(String(data.description).slice(0, 500));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setDescribing(false);
    }
  }

  const selected = STYLES.find((s) => s.id === styleId)!;
  const meta = PROVIDER_META[provider];
  const chosen = result?.variants[chosenVariant];

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="flex flex-col gap-6">
        {!preview && !result && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="glass cursor-pointer flex flex-col items-center justify-center gap-3 p-12 min-h-[420px] text-center transition-colors hover:border-violet-500/40"
            style={{ borderStyle: "dashed" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(168,85,247,0.12)",
                border: "1px solid rgba(168,85,247,0.3)",
                color: "#c084fc",
              }}
            >
              <Upload size={26} />
            </div>
            <p className="font-semibold text-lg">Перетащите фото или нажмите</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              JPG, PNG, WebP, до 10 МБ. Рекомендуем 800×800+
            </p>
          </div>
        )}

        {preview && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Panel title="Исходное фото">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Исходник" className="w-full h-auto rounded-xl object-cover" />
            </Panel>
            <Panel title={result ? "Результат" : "Результат появится здесь"}>
              {busy ? (
                <div className="aspect-square flex flex-col items-center justify-center gap-3" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: "#c084fc" }} />
                  <p className="text-sm">
                    {variants > 1
                      ? `Генерируем ${variants} варианта параллельно — 30–60 сек`
                      : "Генерируем — 20–40 сек"}
                  </p>
                </div>
              ) : chosen ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={chosen.outputUrl} alt="Результат" className="w-full h-auto rounded-xl object-cover" />
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => downloadBlob(chosen.outputUrl, "drop-ai.png")}
                      className="btn-gradient flex-1"
                    >
                      <Download size={14} /> Скачать
                    </button>
                    <a
                      href={chosen.outputUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-dark"
                      title="Открыть в новой вкладке"
                      aria-label="Открыть в новой вкладке"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="btn-dark"
                      disabled={busy}
                      aria-label="Перегенерировать"
                      title="Перегенерировать"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <ImageIcon size={28} />
                  <p className="text-sm">Выберите стиль и нажмите «Сгенерировать»</p>
                </div>
              )}
            </Panel>
          </div>
        )}

        {result && result.variants.length > 1 && (
          <div className="flex flex-col gap-2">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Выберите вариант ({result.variants.length})
            </p>
            <div className="grid grid-cols-4 gap-2">
              {result.variants.map((v, i) => {
                const active = i === chosenVariant;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setChosenVariant(i)}
                    className="relative rounded-lg overflow-hidden transition-transform"
                    style={{
                      border: `2px solid ${active ? "var(--accent-violet)" : "transparent"}`,
                      transform: active ? "scale(1)" : "scale(0.97)",
                      opacity: active ? 1 : 0.7,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.outputUrl} alt={`Вариант ${i + 1}`} className="w-full aspect-square object-cover" />
                    {active && (
                      <span
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--accent-violet)" }}
                      >
                        <Check size={12} strokeWidth={3} style={{ color: "#0a0a0a" }} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {result && (
          <details className="text-xs" style={{ color: "var(--text-muted)" }}>
            <summary className="cursor-pointer">
              {result.cost > 0 ? `Списано ${result.cost} кликов` : "Без списания"} · Показать
              финальный промпт
            </summary>
            <p className="mt-2 p-3 rounded-lg text-[11px] font-mono leading-relaxed" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
              {result.enhancedPrompt}
            </p>
          </details>
        )}

        {preview && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-ghost self-start text-xs"
          >
            <Upload size={12} /> Загрузить другое фото
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      <aside className="flex flex-col gap-5">
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: `${meta.tone}14`,
            border: `1px solid ${meta.tone}30`,
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${meta.tone}25`, color: meta.tone }}
          >
            <Zap size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              AI-движок
            </p>
            <p className="font-semibold text-sm mt-0.5" style={{ color: meta.tone }}>
              {meta.label}
            </p>
            <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {meta.explain}
            </p>
          </div>
        </div>

        <div className="glass-strong p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Стиль
            </p>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {STYLES.length} вариантов
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map((s) => {
              const active = s.id === styleId;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStyleId(s.id)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-xs transition-all aspect-square text-center"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(217,70,239,0.12) 100%)"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? "rgba(168,85,247,0.5)" : "var(--border-subtle)"}`,
                    color: active ? "#fff" : "var(--text-secondary)",
                  }}
                  title={s.description}
                >
                  <span className="text-xl leading-none">{s.emoji}</span>
                  <span className="leading-tight">{s.label.split(" — ")[0]}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {selected.description}
          </p>
        </div>

        <div className="glass-strong p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
              style={{ color: "var(--text-muted)" }}
            >
              Описание товара
              {provider === "pollinations" && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(252,165,165,0.12)",
                    color: "#fca5a5",
                    border: "1px solid rgba(252,165,165,0.3)",
                  }}
                >
                  ОБЯЗАТЕЛЬНО
                </span>
              )}
            </label>
            <button
              type="button"
              onClick={describeFromAI}
              disabled={!file || describing}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                background: "rgba(168,85,247,0.12)",
                color: "#c084fc",
                border: "1px solid rgba(168,85,247,0.3)",
              }}
              title="Gemini посмотрит фото и заполнит описание"
            >
              {describing ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
              AI-описание
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              provider === "pollinations"
                ? "Круглые овсяные печенья с шоколадной крошкой в форме цветка, золотистого цвета, на стеклянной тарелке"
                : "Например: бежевые кроссовки New Balance 9060, замша (необязательно)"
            }
            maxLength={500}
            rows={4}
            className="px-3 py-2.5 rounded-xl text-sm resize-none outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          {provider === "pollinations" ? (
            <p className="text-[11px]" style={{ color: "#fcd34d" }}>
              ⚠ Flux рисует по этому тексту. Используйте «AI-описание» — Gemini посмотрит фото
              и заполнит точно.
            </p>
          ) : (
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              ✦ Описание расширяется в богатый фото-промпт автоматически.
            </p>
          )}
        </div>

        {styleId === "luxury-card" && (
          <div
            className="glass-strong p-5 flex flex-col gap-4"
            style={{ borderColor: "rgba(168,85,247,0.3)" }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Текст на премиум-карточке
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                AI попробует нарисовать заголовок и буллеты прямо на изображении. Лучше всего
                справляются OpenAI gpt-image-1 и Gemini Nano Banana — Pollinations Flux может
                искажать буквы.
              </p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                Заголовок
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Шоколадные печенья"
                maxLength={80}
                className="px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                Преимущества (через запятую, 2–4 шт)
              </span>
              <textarea
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="Натуральный состав, Без сахара, Ручная работа"
                maxLength={400}
                rows={3}
                className="px-3 py-2 rounded-xl text-sm resize-none outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </label>
          </div>
        )}

        <div className="glass-strong p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Качество AI
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.values(QUALITY_PRESETS)).map((q) => {
              const active = q.id === quality;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQuality(q.id)}
                  className="flex flex-col items-center gap-0.5 p-3 rounded-xl text-xs transition-all text-center"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(217,70,239,0.12) 100%)"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? "rgba(168,85,247,0.5)" : "var(--border-subtle)"}`,
                    color: active ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  <span className="font-semibold">{q.label}</span>
                  <span className="text-[10px] opacity-70">{q.description}</span>
                  {q.costMultiplier > 1 && (
                    <span className="text-[10px]" style={{ color: "#c084fc" }}>
                      ×{q.costMultiplier} клика
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-strong p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Сколько вариантов
          </p>
          <div className="flex gap-2">
            {VARIANT_OPTIONS.map((opt) => {
              const active = opt.n === variants;
              return (
                <button
                  key={opt.n}
                  type="button"
                  onClick={() => setVariants(opt.n)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(217,70,239,0.12) 100%)"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? "rgba(168,85,247,0.5)" : "var(--border-subtle)"}`,
                    color: active ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {opt.n}
                </button>
              );
            })}
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Больше вариантов = выше шанс получить идеальный кадр. {cost > 0 ? `Стоимость: ${variants} × ${cost} = ${totalCost} кликов.` : ""}
          </p>
        </div>

        {error && (
          <div
            className="rounded-xl p-3 text-xs flex items-start gap-2"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#fca5a5",
            }}
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy || !file}
          className="btn-gradient w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Сгенерировать
          <span
            className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.85)" }}
          >
            {totalCost > 0 ? `✦ ${totalCost}` : "бесплатно"}
          </span>
        </button>
      </aside>
    </div>
  );
}

async function downloadBlob(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    // fallback: открыть в новой вкладке
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      {children}
    </div>
  );
}
