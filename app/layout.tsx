import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DROP.AI — продающие карточки товаров за минуту",
  description:
    "AI-фотостудия для маркетплейсов. Загрузите фото товара — получите готовую карточку для Wildberries, Ozon и Яндекс Маркета. Без студии и дизайнера.",
  metadataBase: new URL("https://drop.ai"),
  openGraph: {
    title: "DROP.AI — AI-карточки товаров для маркетплейсов",
    description: "Студийное фото товара за 56 секунд. Без студии, без дизайнера.",
    type: "website",
    locale: "ru_RU",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <div aria-hidden="true" className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
