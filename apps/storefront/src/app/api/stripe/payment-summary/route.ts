import { getStripeServer } from "@lib/stripe/server"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const formatPaymentType = (type?: string | null) => {
  if (!type) {
    return "Credit card"
  }

  if (type === "afterpay_clearpay") {
    return "Afterpay"
  }

  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const formatCardBrand = (brand?: string | null) =>
  brand
    ? brand
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Card"

export async function GET(request: NextRequest) {
  const clientSecret = request.nextUrl.searchParams.get("client_secret")
  const paymentIntentId = clientSecret?.split("_secret_")[0]

  if (!paymentIntentId?.startsWith("pi_")) {
    return NextResponse.json(
      { error: "Missing payment intent." },
      { status: 400 }
    )
  }

  try {
    const stripe = getStripeServer()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method"],
    })
    const paymentMethod = paymentIntent.payment_method

    if (
      typeof paymentMethod !== "string" &&
      paymentMethod?.type === "card" &&
      paymentMethod.card
    ) {
      return NextResponse.json({
        title: `${formatCardBrand(paymentMethod.card.brand)} ending ${
          paymentMethod.card.last4
        }`,
        type: "card",
      })
    }

    if (
      typeof paymentMethod !== "string" &&
      paymentMethod?.type
    ) {
      return NextResponse.json({
        title: formatPaymentType(paymentMethod.type),
        type: paymentMethod.type,
      })
    }

    return NextResponse.json({
      title: formatPaymentType(paymentIntent.payment_method_types?.[0]),
      type: paymentIntent.payment_method_types?.[0] ?? null,
    })
  } catch (error) {
    const message =
      error instanceof Stripe.errors.StripeError
        ? error.message
        : "Unable to load payment method."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
