import { NextRequest, NextResponse } from "next/server";

/**
 * Если пользователь открыл /uploads/<file> прямо в адресной строке или
 * через «открыть в новой вкладке» — браузер шлёт Sec-Fetch-Dest=document
 * и Accept c text/html. Перебрасываем такие запросы на /p/<file>, где есть
 * шапка с «Назад» и «Домой».
 * Запросы от <img>/<a download>/fetch — без text/html, отдаются как обычная статика.
 */
export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/uploads/")) return NextResponse.next();
  // ?raw=1 — явный опт-аут (нажатие «открыть оригинал» на /p/-странице)
  if (req.nextUrl.searchParams.get("raw") === "1") return NextResponse.next();
  const dest = req.headers.get("sec-fetch-dest");
  const accept = req.headers.get("accept") || "";
  const isDocument = dest === "document" || accept.includes("text/html");
  if (!isDocument) return NextResponse.next();
  const name = req.nextUrl.pathname.slice("/uploads/".length);
  return NextResponse.redirect(new URL(`/p/${name}`, req.url));
}

export const config = {
  matcher: "/uploads/:path*",
};
