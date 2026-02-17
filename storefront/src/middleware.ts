import { NextRequest, NextResponse } from "next/server"

const locales = ["zh-CN", "zh-TW", "en"]
const defaultLocale = "zh-CN"

function getLocaleFromRequest(request: NextRequest): string {
  // 1. Check URL — already handled by path matching
  // 2. Check NEXT_LOCALE cookie
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale

  // 3. Check Accept-Language header
  const acceptLang = request.headers.get("accept-language")
  if (acceptLang) {
    const preferred = acceptLang
      .split(",")
      .map((part) => {
        const [lang, q] = part.trim().split(";q=")
        return { lang: lang.trim(), q: q ? parseFloat(q) : 1 }
      })
      .sort((a, b) => b.q - a.q)

    for (const { lang } of preferred) {
      // Exact match
      if (locales.includes(lang)) return lang
      // Prefix match: "zh-TW" from "zh-Hant", "en" from "en-US"
      const prefix = lang.split("-")[0]
      if (prefix === "zh") {
        // zh-Hant → zh-TW, zh-Hans → zh-CN
        if (lang.includes("Hant") || lang.includes("TW") || lang.includes("HK")) return "zh-TW"
        return "zh-CN"
      }
      if (prefix === "en") return "en"
    }
  }

  // 4. Default
  return defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files, API routes, _next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // Redirect to locale-prefixed URL
  const locale = getLocaleFromRequest(request)
  const newUrl = new URL(`/${locale}${pathname}`, request.url)
  newUrl.search = request.nextUrl.search
  return NextResponse.redirect(newUrl)
}

export const config = {
  matcher: ["/((?!_next|api|favicon\\.ico|.*\\..*).*)"],
}
