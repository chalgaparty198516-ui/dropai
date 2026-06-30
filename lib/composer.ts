import sharp from "sharp";

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

  // Узнаём реальный размер картинки чтобы посчитать пропорции.
  const meta = await sharp(imageBytes).metadata();
  const W = meta.width ?? 1024;
  const H = meta.height ?? 1024;

  // Текст на правой половине, начиная с 52% ширины
  const textX = Math.round(W * 0.52);
  const textWidth = Math.round(W * 0.42);
  const startY = Math.round(H * 0.18);

  const titleSize = Math.round(W * 0.058);
  const benefitSize = Math.round(W * 0.028);
  const benefitGap = Math.round(W * 0.05);
  const checkSize = Math.round(benefitSize * 1.2);

  // Тёмная вуаль справа для контраста (если AI не оставил пустое место)
  const vignetteX = Math.round(W * 0.48);
  const vignetteW = W - vignetteX;

  const wrappedTitle = wrapTextLines(title, 18);
  const titleLines = wrappedTitle
    .map(
      (line, i) =>
        `<text x="${textX}" y="${startY + (i + 1) * titleSize * 1.15}" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="700" fill="#f5e6c8" letter-spacing="-1">${escapeXml(
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
            `<text x="${textX + checkSize * 1.6}" y="${y + (li + 1) * benefitSize * 1.15}" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="${benefitSize}" fill="#e8e3d8" font-weight="500">${escapeXml(
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="rightFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="30%" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect x="${vignetteX}" y="0" width="${vignetteW}" height="${H}" fill="url(#rightFade)"/>
  ${titleLines}
  ${underline}
  ${benefitItems}
</svg>`;

  return sharp(imageBytes)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
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
