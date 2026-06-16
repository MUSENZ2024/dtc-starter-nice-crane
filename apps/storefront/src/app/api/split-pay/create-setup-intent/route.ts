import { retrieveCart } from "@lib/data/cart"
import {
  SPLIT_PAY_INSTALLMENTS,
  getCartTotalCents,
  getSplitPayInstallments,
} from "@lib/split-pay"
import { getStripeServer } from "@lib/stripe/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cart = await retrieveCart()

    if (!cart?.id || !cart.email) {
      return NextResponse.json(
        { error: "Add contact details before using Split Pay." },
        { status: 400 }
      )
    }

    if (!cart.shipping_address || !cart.billing_address) {
      return NextResponse.json(
        { error: "Add shipping and billing details before using Split Pay." },
        { status: 400 }
      )
    }

    if ((cart.shipping_methods?.length ?? 0) < 1) {
      return NextResponse.json(
        { error: "Choose a delivery method before using Split Pay." },
        { status: 400 }
      )
    }

    const totalCents = getCartTotalCents(cart)

    if (totalCents < SPLIT_PAY_INSTALLMENTS) {
      return NextResponse.json(
        { error: "Cart total is too low for Split Pay." },
        { status: 400 }
      )
    }

    const { baseCents, finalCents } = getSplitPayInstallments(totalCents)
    const currency = (cart.currency_code || "nzd").toLowerCase()
    const countryCode = cart.shipping_address.country_code || "nz"
    const stripe = getStripeServer()
    const name = [cart.billing_address.first_name, cart.billing_address.last_name]
      .filter(Boolean)
      .join(" ")

    const customer = await stripe.customers.create({
      email: cart.email,
      name: name || undefined,
      address: {
        line1: cart.billing_address.address_1 ?? undefined,
        line2: cart.billing_address.address_2 ?? undefined,
        city: cart.billing_address.city ?? undefined,
        state: cart.billing_address.province ?? undefined,
        postal_code: cart.billing_address.postal_code ?? undefined,
        country: cart.billing_address.country_code?.toUpperCase(),
      },
      phone: cart.billing_address.phone ?? undefined,
      metadata: {
        medusa_cart_id: cart.id,
        muse_split_pay: "true",
      },
    })

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      usage: "off_session",
      description: "MUSE Split Pay card authorisation",
      metadata: {
        medusa_cart_id: cart.id,
        muse_split_pay: "true",
        country_code: countryCode,
        currency,
        total_cents: String(totalCents),
        base_cents: String(baseCents),
        final_cents: String(finalCents),
        instalments: String(SPLIT_PAY_INSTALLMENTS),
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      countryCode,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Split Pay."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
