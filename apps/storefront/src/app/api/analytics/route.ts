import { NextRequest, NextResponse } from "next/server"

/**
 * Server-side proxy for the MUSE analytics dashboard (public/analytics.html).
 *
 * The Medusa secret API key never reaches the browser: it lives only in this
 * route's environment (MUSE_ANALYTICS_MEDUSA_KEY). The dashboard page sends
 * the same password used at its own password gate as `x-gate-token`, and this
 * route independently checks it against MUSE_ANALYTICS_GATE_PASSWORD before
 * forwarding anything to Medusa. That second check exists so the proxy is
 * still protected even if someone calls it directly, bypassing the page.
 */
export async function GET(request: NextRequest) {
  const gatePassword = process.env.MUSE_ANALYTICS_GATE_PASSWORD
  const secretKey = process.env.MUSE_ANALYTICS_MEDUSA_KEY
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

  if (!gatePassword || !secretKey) {
    return NextResponse.json(
      { message: "Analytics proxy is not configured (missing MUSE_ANALYTICS_GATE_PASSWORD or MUSE_ANALYTICS_MEDUSA_KEY)." },
      { status: 503 }
    )
  }

  const token = request.headers.get("x-gate-token")
  if (token !== gatePassword) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const search = request.nextUrl.search
  const basicAuth = Buffer.from(`${secretKey}:`).toString("base64")

  try {
    const upstream = await fetch(`${backendUrl}/admin/muse-analytics${search}`, {
      headers: { Authorization: `Basic ${basicAuth}` },
      cache: "no-store",
    })
    const body = await upstream.json().catch(() => ({}))
    return NextResponse.json(body, { status: upstream.status })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not reach the Medusa backend." },
      { status: 502 }
    )
  }
}
