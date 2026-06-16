import { retrieveCart } from "@lib/data/cart"
import {
  SPLIT_PAY_INSTALLMENTS,
  formatSplitPayMoney,
  getCartTotalCents,
  getSplitPayInstallments,
} from "@lib/split-pay"
import { getStripeServer } from "@lib/stripe/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
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
    const origin = request.nextUrl.origin
    const countryCode = cart.shipping_address.country_code || "nz"
    const stripe = getStripeServer()

    const customer = await stripe.customers.create({
      email: cart.email,
      name: [cart.billing_address.first_name, cart.billing_address.last_name]
        .filter(Boolean)
        .join(" "),
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

    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customer.id,
      payment_method_types: ["card"],
      client_reference_id: cart.id,
      success_url: `${origin}/api/split-pay/complete?session_id={CHECKOUT_SESSION_ID}&country_code=${countryCode}`,
      cancel_url: `${origin}/${countryCode}/checkout?step=payment&muse_step=payment&split_pay=cancelled`,
      setup_intent_data: {
        description: "MUSE Split Pay card authorisation",
        metadata: {
          medusa_cart_id: cart.id,
          muse_split_pay: "true",
        },
      },
      metadata: {
        medusa_cart_id: cart.id,
        muse_split_pay: "true",
        currency,
        total_cents: String(totalCents),
        base_cents: String(baseCents),
        final_cents: String(finalCents),
        instalments: String(SPLIT_PAY_INSTALLMENTS),
      },
      custom_text: {
        submit: {
          message: `Your card will be saved for MUSE Split Pay: 3 weekly payments of ${formatSplitPayMoney(
            baseCents,
            currency
          )}, then 1 final payment of ${formatSplitPayMoney(
            finalCents,
            currency
          )}. Your order ships once paid in full.`,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Split Pay."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
