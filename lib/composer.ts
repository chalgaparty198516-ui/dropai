import sharp from "sharp";
import satori from "satori";
import React from "react";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Накладывает заголовок + буллеты на правую половину карточки.
 *
 * librsvg внутри sharp на Vercel НЕ умеет читать @font-face из SVG (нет
 * fontconfig). Поэтому используем satori — он принимает JSX + bundled TTF
 * и выдаёт SVG, в котором текст уже конвертирован в `<path>` элементы.
 * После этого sharp композитит SVG поверх AI-картинки без font rendering.
 */

let fontCache: { regular: Buffer; bold: Buffer } | null = null;
async function loadTtf() {
  if (fontCache) return fontCache;
  const dir = path.join(process.cwd(), "assets", "fonts");
  const [regular, bold] = await Promise.all([
    fs.readFile(path.join(dir, "NotoSans-Regular.ttf")),
    fs.readFile(path.join(dir, "NotoSans-Bold.ttf")),
  ]);
  fontCache = { regular, bold };
  return fontCache;
}

export async function addLuxuryOverlay(
  imageBytes: Buffer,
  title: string,
  benefits: string[]
): Promise<Buffer> {
  if (!title && benefits.length === 0) return imageBytes;

  // sharp на Vercel может ругаться на SharedArrayBuffer — копируем в свежий.
  const safe = copyToOwnedBuffer(imageBytes);
  const meta = await sharp(safe).metadata();
  const W = meta.width ?? 1024;
  const H = meta.height ?? 1024;

  const fonts = await loadTtf();
  const titleSize = Math.round(Math.max(W * 0.045, Math.min(W * 0.065, W / Math.max(8, title.length) * 1.4)));
  const benefitSize = Math.round(Math.max(W * 0.022, titleSize * 0.42));
  const padding = Math.round(W * 0.045);

  const visibleBenefits = benefits.slice(0, 4);

  const overlaySvg = await satori(
    React.createElement(
      "div",
      {
        style: {
          width: W,
          height: H,
          display: "flex",
          fontFamily: "NotoSans",
        },
      },
      // Левая половина — прозрачная, чтобы AI-картинка просвечивала
      React.createElement("div", {
        style: { width: `${Math.round(W * 0.48)}px`, height: `${H}px` },
      }),
      // Правая половина — тёмная панель с текстом
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            flex: 1,
            height: `${H}px`,
            padding: `${padding}px`,
            background:
              "linear-gradient(to right, rgba(10,7,7,0) 0%, rgba(20,10,10,0.6) 15%, rgba(35,18,30,0.92) 55%, rgba(50,25,45,0.95) 100%)",
            color: "#f5e6c8",
            justifyContent: "center",
            gap: `${Math.round(padding * 0.4)}px`,
          },
        },
        title
          ? React.createElement(
              "div",
              {
                style: {
                  fontSize: `${titleSize}px`,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: "-0.5px",
                },
              },
              title
            )
          : null,
        title
          ? React.createElement("div", {
              style: {
                width: `${Math.round(W * 0.12)}px`,
                height: `${Math.max(2, Math.round(W * 0.0035))}px`,
                background: "#c9a96a",
                marginTop: `${Math.round(padding * 0.2)}px`,
                marginBottom: `${Math.round(padding * 0.3)}px`,
              },
            })
          : null,
        ...visibleBenefits.map((b, i) =>
          React.createElement(
            "div",
            {
              key: i,
              style: {
                display: "flex",
                alignItems: "flex-start",
                gap: `${Math.round(benefitSize * 0.6)}px`,
                fontSize: `${benefitSize}px`,
                color: "#e8e3d8",
                lineHeight: 1.3,
              },
            },
            // Золотая галочка-кружок
            React.createElement(
              "div",
              {
                style: {
                  width: `${Math.round(benefitSize * 1.15)}px`,
                  height: `${Math.round(benefitSize * 1.15)}px`,
                  borderRadius: "999px",
                  background: "#c9a96a",
                  color: "#1a1208",
                  fontSize: `${Math.round(benefitSize * 0.85)}px`,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: `${Math.round(benefitSize * 0.05)}px`,
                },
              },
              "✓"
            ),
            React.createElement("div", { style: { flex: 1 } }, b)
          )
        )
      )
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "NotoSans", data: fonts.regular, weight: 400, style: "normal" },
        { name: "NotoSans", data: fonts.bold, weight: 700, style: "normal" },
      ],
    }
  );

  return sharp(safe)
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function copyToOwnedBuffer(input: Buffer | Uint8Array): Buffer {
  const ab = new ArrayBuffer(input.byteLength);
  new Uint8Array(ab).set(input);
  return Buffer.from(ab);
}
