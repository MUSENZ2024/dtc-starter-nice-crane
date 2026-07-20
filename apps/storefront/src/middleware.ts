import { NextRequest, NextResponse } from "next/server"

const INTERNAL_COUNTRY_CODE = "nz"
const LEGACY_COUNTRY_CODES = new Set(["nz", "dk"])

/**
 * Keep Medusa's country-code route internal while exposing clean, stable URLs.
 *
 * Public:   /products/example
 * Internal: /nz/products/example
 * Legacy:   /nz/products/example -> /products/example
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const segments = request.nextUrl.pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]?.toLowerCase()

  if (firstSegment && LEGACY_COUNTRY_CODES.has(firstSegment)) {
    const cleanPath = `/${segments.slice(1).join("/")}`
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = cleanPath

    return NextResponse.redirect(redirectUrl, 308)
  }

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = `/${INTERNAL_COUNTRY_CODE}${request.nextUrl.pathname}`

  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
