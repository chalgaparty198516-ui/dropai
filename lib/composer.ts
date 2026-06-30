import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Загружаем Cyrillic-вариант Noto Sans из @fontsource/noto-sans (positioned
 * inside node_modules — гарантированно есть и в dev, и на Vercel build).
 * Embed его как base64 в SVG @font-face, чтобы librsvg внутри sharp на любом
 * Linux-runtime мог отрендерить текст без системного fontconfig.
 */
let cachedFonts: { reg: string; bold: string } | null = null;
async function loadEmbeddedFonts(): Promise<{ reg: string; bold: string }> {
  if (cachedFonts) return cachedFonts;
  const base = path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans",
    "files"
  );
  const [regBuf, boldBuf] = await Promise.all([
    fs.readFile(path.join(base, "noto-sans-cyrillic-ext-400-normal.woff")).catch(() =>
      fs.readFile(path.join(base, "noto-sans-cyrillic-400-normal.woff"))
    ),
    fs.readFile(path.join(base, "noto-sans-cyrillic-ext-700-normal.woff")).catch(() =>
      fs.readFile(path.join(base, "noto-sans-cyrillic-700-normal.woff"))
    ),
  ]);
  cachedFonts = {
    reg: regBuf.toString("base64"),
    bold: boldBuf.toString("base64"),
  };
  return cachedFonts;
}

/**
 * Наложить заголовок + буллеты на правую половину карточки.
 * AI рисует только продукт+сцену (без текста), а реальный текст добавляем
 * через SVG-overlay — он гарантированно читаемый и поддерживает любой язык.
 */
export async function addLuxuryOverlay(
  imageBytes: Buffer,
  title: string,
  benefits: string[]
): Promise<Buffer> {
  if (!title && benefits.length === 0) return imageBytes;

  // На Vercel Buffer может приходить с backing SharedArrayBuffer (через fetch/worker)
  // — sharp такие не принимает. Делаем максимально-явное копирование в новый
  // обычный ArrayBuffer.
  const safe = copyToOwnedBuffer(imageBytes);

  // Узнаём реальный размер картинки чтобы посчитать пропорции.
  const meta = await sharp(safe).metadata();
  const W = meta.width ?? 1024;
  const H = meta.height ?? 1024;

  // Текст на правой половине, начиная с 52% ширины
  const textX = Math.round(W * 0.52);
  const textWidth = Math.round(W * 0.42);
  const startY = Math.round(H * 0.18);

  // Авто-подгон размера заголовка под доступную ширину (~textWidth)
  // Эмпирика: 0.55 * fontSize ≈ ширина символа для Georgia bold.
  const longestTitleLine = (title || "").length;
  let titleSize = Math.round(W * 0.062);
  if (longestTitleLine > 0) {
    const maxByWidth = Math.floor(textWidth / (longestTitleLine * 0.55));
    titleSize = Math.min(titleSize, maxByWidth);
    titleSize = Math.max(titleSize, Math.round(W * 0.032)); // нижняя граница
  }
  const benefitSize = Math.round(Math.max(W * 0.024, titleSize * 0.42));
  const benefitGap = Math.round(benefitSize * 1.9);
  const checkSize = Math.round(benefitSize * 1.2);

  // Тёмная вуаль справа для контраста (если AI не оставил пустое место)
  const vignetteX = Math.round(W * 0.48);
  const vignetteW = W - vignetteX;

  // Длина строки заголовка подобрана так, чтобы в textWidth помещалась при текущем titleSize
  const maxCharsTitle = Math.max(8, Math.floor(textWidth / (titleSize * 0.55)));
  const wrappedTitle = wrapTextLines(title, maxCharsTitle);
  // Шрифт встраиваем в SVG как base64 — librsvg на Vercel не имеет fontconfig,
  // но @font-face с data: URL он понимает.
  const fonts = await loadEmbeddedFonts();
  const TITLE_FONT = "'NotoSansEmbedded', sans-serif";
  const SANS_FONT = "'NotoSansEmbedded', sans-serif";
  const titleLines = wrappedTitle
    .map(
      (line, i) =>
        `<text x="${textX}" y="${startY + (i + 1) * titleSize * 1.15}" font-family="${TITLE_FONT}" font-size="${titleSize}" font-weight="bold" fill="#f5e6c8" stroke="#1a1208" stroke-width="${Math.max(1, titleSize * 0.04)}" paint-order="stroke">${escapeXml(
          line
        )}</text>`
    )
    .join("\n");

  let curY = startY + (wrappedTitle.length + 1) * titleSize * 1.15;
  // Маленькая золотая черта-подчёркивание под заголовком
  if (title) {
    curY += Math.round(W * 0.015);
  }
  const underline = title
    ? `<line x1="${textX}" y1="${curY}" x2="${textX + Math.round(textWidth * 0.3)}" y2="${curY}" stroke="#c9a96a" stroke-width="${Math.max(2, Math.round(W * 0.003))}"/>`
    : "";
  curY += Math.round(W * 0.04);

  const benefitItems = benefits
    .slice(0, 4)
    .map((b, i) => {
      const y = curY + i * benefitGap;
      const wrapped = wrapTextLines(b, 32);
      const lines = wrapped
        .map(
          (line, li) =>
            `<text x="${textX + checkSize * 1.6}" y="${y + (li + 1) * benefitSize * 1.15}" font-family="${SANS_FONT}" font-size="${benefitSize}" fill="#e8e3d8" font-weight="500" stroke="#1a1208" stroke-width="${Math.max(1, benefitSize * 0.04)}" paint-order="stroke">${escapeXml(
              line
            )}</text>`
        )
        .join("\n");
      // Круглая золотая галочка
      const cx = textX + checkSize / 2;
      const cy = y + benefitSize * 0.9;
      const r = checkSize / 2;
      const check = `<g>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#c9a96a"/>
  <path d="M ${cx - r * 0.45} ${cy + r * 0.05} L ${cx - r * 0.1} ${cy + r * 0.4} L ${cx + r * 0.5} ${cy - r * 0.35}" stroke="#1a1208" stroke-width="${Math.max(2, r * 0.25)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</g>`;
      return check + "\n" + lines;
    })
    .join("\n");

  // Плотный slab справа гарантирует, что текст всегда контрастный поверх AI-картинки.
  // Шрифт встроен в SVG как base64 @font-face — работает без системных шрифтов.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style type="text/css"><![CDATA[
      @font-face {
        font-family: 'NotoSansEmbedded';
        font-weight: 400;
        font-style: normal;
        src: url(data:font/woff;base64,${fonts.reg}) format('woff');
      }
      @font-face {
        font-family: 'NotoSansEmbedded';
        font-weight: 700;
        font-style: normal;
        src: url(data:font/woff;base64,${fonts.bold}) format('woff');
      }
    ]]></style>
    <linearGradient id="rightFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0a0707" stop-opacity="0"/>
      <stop offset="15%" stop-color="#0a0707" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#0a0707" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <rect x="${vignetteX}" y="0" width="${vignetteW}" height="${H}" fill="url(#rightFade)"/>
  ${titleLines}
  ${underline}
  ${benefitItems}
</svg>`;

  return sharp(safe)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

/**
 * Создаёт Buffer с полностью изолированным ArrayBuffer (не SharedArrayBuffer).
 * Vercel/edge runtime иногда отдаёт буферы с shared backing — sharp такие
 * отвергает. Прокидываем через свежий ArrayBuffer.
 */
function copyToOwnedBuffer(input: Buffer | Uint8Array): Buffer {
  const ab = new ArrayBuffer(input.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < input.byteLength; i++) view[i] = input[i];
  return Buffer.from(ab);
}

function wrapTextLines(text: string, maxCharsPerLine: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= maxCharsPerLine) {
      cur = (cur + " " + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
