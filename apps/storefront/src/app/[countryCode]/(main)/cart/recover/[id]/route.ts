import { retrieveCart } from "@lib/data/cart"
import { sdk } from "@lib/config"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ countryCode: string; id: string }> }
) {
  const { countryCode, id } = await params
  const trackingToken = request.nextUrl.searchParams.get("ac")
  const cart = await retrieveCart(id, "id,completed_at")

  if (!cart || cart.completed_at) {
    return NextResponse.redirect(new URL(`/${countryCode}/cart`, request.url))
  }

  if (trackingToken) {
    await sdk.client.fetch("/store/abandoned-carts/click", {
      method: "POST",
      body: { cart_id: id, tracking_token: trackingToken },
    }).catch(() => null)
  }

  const response = NextResponse.redirect(new URL(`/${countryCode}/cart`, request.url))
  response.cookies.set("_medusa_cart_id", id, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
