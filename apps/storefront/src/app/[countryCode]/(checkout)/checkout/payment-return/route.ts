import { sdk } from "@lib/config"
import { getAuthHeaders, getCartId } from "@lib/data/cookies"
import { NextRequest, NextResponse } from "next/server"

/**
 * Stripe's return_url for redirect-based payment methods (Afterpay, Klarna,
 * etc.) lands here. These methods navigate the browser away before the
 * client-side success handler can run, so the order is never placed and the
 * cart cookie isn't guaranteed to survive the round trip. This route
 * resolves the cart from the cart_id param, completes the order server-side,
 * and sets the cart cookie directly on the redirect response.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params
  const searchParams = request.nextUrl.searchParams
  const cartIdParam = searchParams.get("cart_id")
  const paymentIntentId = searchParams.get("payment_intent")
  const redirectStatus = searchParams.get("redirect_status")

  const cartId = cartIdParam || (await getCartId())

  const checkoutUrl = new URL(`/${countryCode}/checkout`, request.url)
  checkoutUrl.searchParams.set("step", "review")
  checkoutUrl.searchParams.set("muse_step", "payment")

  if (!cartId) {
    return NextResponse.redirect(checkoutUrl)
  }

  if (paymentIntentId && redirectStatus !== "failed") {
    try {
      const headers = { ...(await getAuthHeaders()) }
      const cartRes = await sdk.store.cart.complete(cartId, {}, headers)

      if (cartRes.type === "order") {
        const orderCountryCode =
          cartRes.order.shipping_address?.country_code?.toLowerCase() ||
          countryCode

        const response = NextResponse.redirect(
          new URL(
            `/${orderCountryCode}/order/${cartRes.order.id}/confirmed`,
            request.url
          )
        )
        response.cookies.delete("_medusa_cart_id")
        return response
      }
    } catch (error) {
      console.error("Failed to complete order after payment redirect", error)
    }
  }

  const response = NextResponse.redirect(checkoutUrl)
  response.cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}
