import OpenAI, { toFile } from "openai";
import https from "node:https";

export type Provider =
  | "openai"
  | "replicate"
  | "fal"
  | "huggingface"
  | "gemini"
  | "pollinations"
  | "demo";

export type GenerateInput = {
  promptText: string;
  inputBytes: Buffer;
  inputMime: string;
  /** Публичный URL загруженного файла (когда дев-сервер за публичным доменом). */
  inputPublicUrl?: string;
  /** Сид для разнообразия вариантов. */
  seed?: number;
  /** Размер картинки в пикселях (квадрат). По умолчанию 1024. */
  size?: number;
  /** Использовать ли enhance-флаг у Pollinations / больший контекст у OpenAI. */
  enhance?: boolean;
};

export type GenerateOutput = {
  /** PNG bytes. */
  bytes: Buffer;
  provider: Provider;
  /** Clicks deducted from the user balance. */
  cost: number;
  /** Использовался ли реальный image-to-image (true = AI видит фото). */
  usedImg2Img?: boolean;
  /** Диагностика — что произошло во время генерации. */
  debug?: string;
};

export const COSTS: Record<Provider, number> = {
  openai: 3,
  replicate: 2,
  fal: 2,
  huggingface: 1,
  gemini: 1,
  pollinations: 1,
  demo: 0,
};

export const MAX_VARIANTS = 4;

export function pickProvider(): Provider {
  if (process.env.DROPAI_PROVIDER) {
    return process.env.DROPAI_PROVIDER as Provider;
  }
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.REPLICATE_API_TOKEN) return "replicate";
  if (process.env.FAL_KEY) return "fal";
  if (process.env.HF_TOKEN) return "huggingface";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.DROPAI_DISABLE_POLLINATIONS === "1") return "demo";
  return "pollinations";
}

export async function generate(input: GenerateInput): Promise<GenerateOutput> {
  const provider = pickProvider();
  switch (provider) {
    case "openai":
      return generateWithOpenAI(input);
    case "replicate":
      return generateWithReplicate(input);
    case "fal":
      return generateWithFal(input);
    case "huggingface":
      return generateWithHuggingFace(input);
    case "gemini": {
      try {
        return await generateWithGemini(input);
      } catch (e) {
        // Если Gemini вернул quota/billing-ошибку — мягко переключаемся на Pollinations,
        // чтобы пользователь не получил пустой результат.
        const msg = e instanceof Error ? e.message : String(e);
        if (/quota|billing|429/i.test(msg)) {
          const fallback = await generateWithPollinations(input);
          return {
            ...fallback,
            debug: `gemini fallback → pollinations (${msg.slice(0, 120)})`,
          };
        }
        throw e;
      }
    }
    case "pollinations":
      return generateWithPollinations(input);
    case "demo":
      return { bytes: input.inputBytes, provider, cost: 0 };
  }
}

async function generateWithOpenAI(input: GenerateInput): Promise<GenerateOutput> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const ext = input.inputMime === "image/png" ? "png" : input.inputMime === "image/webp" ? "webp" : "jpg";
  const oaFile = await toFile(input.inputBytes, `input.${ext}`, { type: input.inputMime });
  // OpenAI gpt-image-1 принимает 1024x1024 / 1024x1536 / 1536x1024. Карточки — квадрат.
  const size: "1024x1024" | "1536x1024" = input.size && input.size >= 1500 ? "1536x1024" : "1024x1024";
  const result = await client.images.edit({
    model,
    image: oaFile,
    prompt: input.promptText,
    size,
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI вернул пустой результат");
  return { bytes: Buffer.from(b64, "base64"), provider: "openai", cost: COSTS.openai };
}

/**
 * Replicate · Flux Kontext Pro — настоящий image-to-image, сохраняет товар.
 * Требует REPLICATE_API_TOKEN с https://replicate.com/account/api-tokens.
 * ~$0.04 за изображение. Нужен публичный URL входной картинки.
 */
async function generateWithReplicate(input: GenerateInput): Promise<GenerateOutput> {
  if (!input.inputPublicUrl) {
    throw new Error(
      "Replicate Flux Kontext требует публичный URL фото (PUBLIC_BASE_URL или Vercel Blob)."
    );
  }
  const token = process.env.REPLICATE_API_TOKEN!;
  const model = process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-pro";
  const start = await httpsPostJsonGeneric(
    `https://api.replicate.com/v1/models/${model}/predictions`,
    JSON.stringify({
      input: {
        prompt: input.promptText,
        input_image: input.inputPublicUrl,
        output_format: "png",
        aspect_ratio: "1:1",
        seed: input.seed,
      },
    }),
    60_000,
    { authorization: `Bearer ${token}`, prefer: "wait" }
  );
  // Если Replicate отдал sync-ответ (prefer:wait + быстрая модель) — output уже там.
  // Иначе polling.
  let result = start;
  const deadline = Date.now() + 90_000;
  while (
    result?.status &&
    result.status !== "succeeded" &&
    result.status !== "failed" &&
    result.status !== "canceled"
  ) {
    if (Date.now() > deadline) throw new Error("Replicate: timeout");
    await new Promise((r) => setTimeout(r, 1500));
    result = await httpsGetJson(`https://api.replicate.com/v1/predictions/${result.id}`, 30_000, {
      authorization: `Bearer ${token}`,
    });
  }
  if (result.status !== "succeeded") {
    throw new Error(`Replicate: ${result.status} ${result.error || ""}`.slice(0, 200));
  }
  const url = Array.isArray(result.output) ? result.output[0] : result.output;
  if (!url) throw new Error("Replicate не вернул URL результата");
  const bytes = await httpsGetBuffer(url, 60_000);
  return {
    bytes,
    provider: "replicate",
    cost: COSTS.replicate,
    usedImg2Img: true,
  };
}

/**
 * fal.ai · Flux Kontext — image-to-image. Требует FAL_KEY с https://fal.ai/dashboard/keys.
 * Очень быстрый, ~$0.04 за изображение.
 */
async function generateWithFal(input: GenerateInput): Promise<GenerateOutput> {
  if (!input.inputPublicUrl) {
    throw new Error(
      "fal.ai Flux Kontext требует публичный URL фото (PUBLIC_BASE_URL или Vercel Blob)."
    );
  }
  const key = process.env.FAL_KEY!;
  const model = process.env.FAL_MODEL || "fal-ai/flux-pro/kontext";
  const submit = await httpsPostJsonGeneric(
    `https://queue.fal.run/${model}`,
    JSON.stringify({
      prompt: input.promptText,
      image_url: input.inputPublicUrl,
      output_format: "png",
      aspect_ratio: "1:1",
      seed: input.seed,
    }),
    60_000,
    { authorization: `Key ${key}` }
  );
  const requestId = submit?.request_id || submit?.id;
  if (!requestId) throw new Error(`fal.ai: нет request_id (${JSON.stringify(submit).slice(0, 200)})`);

  // poll
  const deadline = Date.now() + 90_000;
  let status: { status?: string; logs?: unknown } = {};
  while (Date.now() < deadline) {
    status = await httpsGetJson(
      `https://queue.fal.run/${model.split("/")[0]}/requests/${requestId}/status`,
      15_000,
      { authorization: `Key ${key}` }
    );
    if (status.status === "COMPLETED") break;
    if (status.status === "FAILED") throw new Error(`fal.ai: failed`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (status.status !== "COMPLETED") throw new Error("fal.ai: timeout");
  const result = await httpsGetJson(
    `https://queue.fal.run/${model.split("/")[0]}/requests/${requestId}`,
    15_000,
    { authorization: `Key ${key}` }
  );
  const url = result?.images?.[0]?.url || result?.image?.url;
  if (!url) throw new Error("fal.ai не вернул URL");
  const bytes = await httpsGetBuffer(url, 60_000);
  return { bytes, provider: "fal", cost: COSTS.fal, usedImg2Img: true };
}

/**
 * HuggingFace · Stable Diffusion XL img2img — бесплатный image-to-image
 * через Inference API. Требует HF_TOKEN с https://huggingface.co/settings/tokens (Read).
 * Качество хуже Flux Kontext, но бесплатно.
 */
async function generateWithHuggingFace(input: GenerateInput): Promise<GenerateOutput> {
  const token = process.env.HF_TOKEN!;
  const model =
    process.env.HF_IMG2IMG_MODEL || "stabilityai/stable-diffusion-xl-refiner-1.0";
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const body = JSON.stringify({
    inputs: input.promptText,
    parameters: {
      image: `data:${input.inputMime};base64,${input.inputBytes.toString("base64")}`,
      strength: 0.5,
      num_inference_steps: 30,
    },
  });
  const bytes = await httpsPostRawBytes(url, body, 60_000, {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    accept: "image/png",
  });
  if (bytes.byteLength < 1024) {
    throw new Error(`HF SDXL: пустой ответ (${bytes.toString("utf8").slice(0, 200)})`);
  }
  return { bytes, provider: "huggingface", cost: COSTS.huggingface, usedImg2Img: true };
}

function httpsGetJson(
  url: string,
  timeoutMs: number,
  extraHeaders: Record<string, string> = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const verify =
      process.env.NODE_ENV === "production" && process.env.DROPAI_INSECURE_FETCH !== "1";
    const req = https.get(
      {
        hostname: u.hostname,
        path: `${u.pathname}${u.search}`,
        port: u.port || 443,
        headers: { "user-agent": "drop-ai/1.0", ...extraHeaders },
        timeout: timeoutMs,
        rejectUnauthorized: verify,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
          } catch {
            resolve({});
          }
        });
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("GET timeout")));
    req.on("error", reject);
  });
}

function httpsPostRawBytes(
  url: string,
  body: string,
  timeoutMs: number,
  headers: Record<string, string>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const verify =
      process.env.NODE_ENV === "production" && process.env.DROPAI_INSECURE_FETCH !== "1";
    const req = https.request(
      {
        hostname: u.hostname,
        path: `${u.pathname}${u.search}`,
        port: u.port || 443,
        method: "POST",
        headers: { ...headers, "content-length": Buffer.byteLength(body), "user-agent": "drop-ai/1.0" },
        timeout: timeoutMs,
        rejectUnauthorized: verify,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("POST timeout")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function generateWithGemini(input: GenerateInput): Promise<GenerateOutput> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const models = (process.env.GEMINI_IMAGE_MODELS ||
    process.env.GEMINI_IMAGE_MODEL ||
    "gemini-2.5-flash-image,gemini-3.1-flash-image"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      return await tryGemini(model, input, apiKey);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      // Пробуем следующую модель если эта недоступна по квоте
      if (!/quota|429|billing|not found|404/i.test(lastError.message)) throw lastError;
    }
  }
  throw lastError ?? new Error("Gemini: все модели недоступны");
}

async function tryGemini(
  model: string,
  input: GenerateInput,
  apiKey: string
): Promise<GenerateOutput> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "Re-photograph THIS exact product for a marketplace listing card. " +
              "Preserve the product's identity, shape, colors, materials and unique details — " +
              "do NOT replace it with a generic version. Apply this scene/style: " +
              input.promptText,
          },
          {
            inlineData: {
              mimeType: input.inputMime,
              data: input.inputBytes.toString("base64"),
            },
          },
        ],
      },
    ],
  });

  const json = await httpsPostJsonGeneric(url, body, 90_000);

  const parts: Array<{ text?: string; inlineData?: { data?: string; mimeType?: string } }> =
    json?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p.inlineData?.data) {
      return {
        bytes: Buffer.from(p.inlineData.data, "base64"),
        provider: "gemini",
        cost: COSTS.gemini,
        usedImg2Img: true,
      };
    }
  }
  const text = parts.map((p) => p.text).filter(Boolean).join(" ").slice(0, 300);
  const err = json?.error?.message ? `: ${json.error.message}` : "";
  throw new Error(`Gemini не вернул изображение${err}${text ? ` (${text})` : ""}`);
}

/**
 * Vision-описание загруженного фото через Gemini text-модель.
 * Работает даже когда image-генерация (gemini-*-image) недоступна по квоте,
 * потому что text-модели и image-модели имеют разные лимиты.
 *
 * lang: "en" — для подмешивания в промпт Flux (English даёт лучшую генерацию),
 *       "ru" — для авто-заполнения UI-поля «Описание товара» на русском.
 */
export async function describeWithGeminiVisionExported(
  bytes: Buffer,
  mime: string,
  apiKey: string,
  lang: "en" | "ru" = "en"
): Promise<string> {
  return describeWithGeminiVision(bytes, mime, apiKey, lang);
}

async function describeWithGeminiVision(
  bytes: Buffer,
  mime: string,
  apiKey: string,
  lang: "en" | "ru" = "en"
): Promise<string> {
  const models = (process.env.GEMINI_VISION_MODELS || "gemini-2.5-flash,gemini-2.5-flash-lite")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const prompt =
    lang === "ru"
      ? "Опиши этот товар на фото ОДНИМ детальным русским предложением (до 60 слов). " +
        "Сосредоточься на: что это за товар, цвет, форма, материал, текстура, поверхность или подложка. " +
        "Описание будет использовано как подсказка для генерации карточки товара для маркетплейса. " +
        "Будь конкретен (количество, узор, отличительные особенности). " +
        "Без вступления, без кавычек, только описательное предложение."
      : "Describe this product photo in ONE detailed English sentence (under 60 words). " +
        "Focus on: what the product is, its color, shape, material, surface texture, and the surface or plate it sits on. " +
        "This description will be used as a prompt to regenerate the product on a clean marketplace card, " +
        "so be specific about details that identify this exact product (number of items, pattern, distinguishing features). " +
        "No preamble, no quotes, just the descriptive sentence.";

  const body = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: { mimeType: mime, data: bytes.toString("base64") },
          },
        ],
      },
    ],
  });

  let lastErr: Error | null = null;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const json = await httpsPostJsonGeneric(url, body, 30_000);
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === "string" && text.trim()) {
        return text.trim().replace(/^["']|["']$/g, "").slice(0, 600);
      }
      lastErr = new Error(json?.error?.message || "no text in response");
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error("Gemini vision: все модели не сработали");
}

function httpsPostJsonGeneric(url: string, body: string, timeoutMs: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const verify =
      process.env.NODE_ENV === "production" && process.env.DROPAI_INSECURE_FETCH !== "1";
    const req = https.request(
      {
        hostname: u.hostname,
        path: `${u.pathname}${u.search}`,
        port: u.port || 443,
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
          "user-agent": "drop-ai/1.0",
        },
        timeout: timeoutMs,
        rejectUnauthorized: verify,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          try {
            const parsed = JSON.parse(text);
            resolve(parsed);
          } catch {
            resolve({ raw: text, status: res.statusCode });
          }
        });
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error(`POST ${u.hostname}: таймаут`)));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function generateWithPollinations(input: GenerateInput): Promise<GenerateOutput> {
  // Pollinations Flux не умеет image-to-image на anonymous tier — но мы можем
  // получить описание фото через Gemini vision (text-модель видит изображение даже
  // когда image-генерация в квоте 0), и передать это описание Flux'у как часть промпта.
  // Это сильно повышает соответствие результата исходному товару.
  let visionDescription = "";
  if (process.env.GEMINI_API_KEY) {
    try {
      visionDescription = await describeWithGeminiVision(
        input.inputBytes,
        input.inputMime,
        process.env.GEMINI_API_KEY
      );
    } catch {
      // vision не критичен, продолжаем без него
    }
  }

  const finalPrompt = visionDescription
    ? `Photorealistic product photo of: ${visionDescription} — re-shot for a marketplace listing. ${input.promptText}`
    : input.promptText;

  const size = input.size ?? 1024;
  const url = new URL(
    `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}`
  );
  url.searchParams.set("model", process.env.POLLINATIONS_MODEL || "flux");
  url.searchParams.set("width", String(size));
  url.searchParams.set("height", String(size));
  url.searchParams.set("nologo", "true");
  if (input.enhance) url.searchParams.set("enhance", "true");
  if (input.seed !== undefined) url.searchParams.set("seed", String(input.seed));
  if (process.env.POLLINATIONS_TOKEN) {
    url.searchParams.set("token", process.env.POLLINATIONS_TOKEN);
  }

  const bytes = await httpsGetBuffer(url.toString(), 120_000);
  if (bytes.byteLength < 1024) {
    throw new Error("Pollinations вернул слишком маленький ответ");
  }
  return {
    bytes,
    provider: "pollinations",
    cost: COSTS.pollinations,
    usedImg2Img: false,
  };
}

/**
 * Расширяет короткий пользовательский ввод в богатый фото-промпт.
 * Бесплатно через Pollinations text API. Если упало — возвращает исходник.
 */
export async function enhancePrompt(
  userDescription: string,
  stylePrompt: string
): Promise<string> {
  if (!userDescription.trim()) return stylePrompt;
  try {
    const body = JSON.stringify({
      model: "openai",
      messages: [
        {
          role: "system",
          content:
            "You are a product photography prompt engineer. Take the user's short product description and the desired scene style, and produce ONE long English prompt (under 80 words) that an image diffusion model will use to render a photorealistic marketplace product card. Include: product details, materials, color, scene/background, lighting setup, camera angle, depth of field, no text/no watermarks. Return only the prompt, no quotes, no explanation.",
        },
        {
          role: "user",
          content: `PRODUCT: ${userDescription}\nSTYLE: ${stylePrompt}`,
        },
      ],
      private: true,
    });
    const json = await httpsPostJson("https://text.pollinations.ai/openai", body, 30_000);
    const text =
      typeof json?.choices?.[0]?.message?.content === "string"
        ? json.choices[0].message.content
        : "";
    const cleaned = text.trim().replace(/^["']|["']$/g, "").slice(0, 1200);
    return cleaned || `${stylePrompt} The product: ${userDescription}.`;
  } catch {
    return `${stylePrompt} The product: ${userDescription}.`;
  }
}

function httpsPostJson(
  targetUrl: string,
  bodyJson: string,
  timeoutMs: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const verify =
      process.env.NODE_ENV === "production" && process.env.DROPAI_INSECURE_FETCH !== "1";
    const req = https.request(
      {
        hostname: u.hostname,
        path: `${u.pathname}${u.search}`,
        port: u.port || 443,
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(bodyJson),
          "user-agent": "drop-ai/1.0",
        },
        timeout: timeoutMs,
        rejectUnauthorized: verify,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Pollinations text HTTP ${res.statusCode}: ${text.slice(0, 200)}`));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch {
            resolve({ raw: text });
          }
        });
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("Pollinations text: таймаут")));
    req.on("error", reject);
    req.write(bodyJson);
    req.end();
  });
}

/**
 * HuggingFace BLIP image-captioning — бесплатный image-to-text endpoint.
 * Чтобы включить, поставьте HF_TOKEN из https://huggingface.co/settings/tokens
 * (тип Read, бесплатно).
 */
async function describeWithHuggingFaceBlip(bytes: Buffer, mime: string): Promise<string> {
  const url = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large";
  const json = await httpsPostBinary(url, bytes, mime, 45_000, {
    authorization: `Bearer ${process.env.HF_TOKEN}`,
  });
  if (Array.isArray(json) && json[0]?.generated_text) {
    return String(json[0].generated_text).slice(0, 400);
  }
  return "";
}

function httpsPostBinary(
  targetUrl: string,
  body: Buffer,
  contentType: string,
  timeoutMs: number,
  extraHeaders: Record<string, string> = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const verify =
      process.env.NODE_ENV === "production" && process.env.DROPAI_INSECURE_FETCH !== "1";
    const req = https.request(
      {
        hostname: u.hostname,
        path: `${u.pathname}${u.search}`,
        port: u.port || 443,
        method: "POST",
        headers: {
          "content-type": contentType,
          "content-length": body.length,
          "user-agent": "drop-ai/1.0",
          ...extraHeaders,
        },
        timeout: timeoutMs,
        rejectUnauthorized: verify,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HF HTTP ${res.statusCode}: ${text.slice(0, 200)}`));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch {
            resolve({ raw: text });
          }
        });
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("HF: таймаут")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function httpsGetBuffer(targetUrl: string, timeoutMs: number, redirects = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    // Dev и явный флаг отключают TLS-валидацию (за корп-прокси, который перехватывает HTTPS).
    // В prod без флага — стандартная проверка.
    const verify =
      process.env.NODE_ENV === "production" && process.env.DROPAI_INSECURE_FETCH !== "1";
    const req = https.get(
      {
        hostname: u.hostname,
        path: `${u.pathname}${u.search}`,
        port: u.port || 443,
        headers: { "user-agent": "drop-ai/1.0" },
        timeout: timeoutMs,
        rejectUnauthorized: verify,
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects > 0
        ) {
          res.resume();
          const next = new URL(res.headers.location, targetUrl).toString();
          httpsGetBuffer(next, timeoutMs, redirects - 1).then(resolve, reject);
          return;
        }
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          reject(new Error(`Pollinations HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error("Pollinations: таймаут"));
    });
    req.on("error", reject);
  });
}
