import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["en", "ja"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = LOCALES.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);

  if (locale) {
    const newPathname = pathname === `/${locale}` ? "/" : pathname.slice(`/${locale}`.length);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-next-intl-locale", locale);
    return NextResponse.rewrite(new URL(newPathname, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // No locale prefix in the URL (default locale "en" is unprefixed under
  // localePrefix: "as-needed"). Fall back to the NEXT_LOCALE cookie so a
  // previously chosen locale persists across new tabs/visits.
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && LOCALES.includes(cookieLocale) && cookieLocale !== "en") {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-next-intl-locale", cookieLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
