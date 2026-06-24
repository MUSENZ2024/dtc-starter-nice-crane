import {
  SPLIT_PAY_INSTALLMENTS,
  formatSplitPayMoney,
} from "@lib/split-pay"
import { getStripeServer } from "@lib/stripe/server"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

function getStripeId(value: string | { id?: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id
}

/**
 * Places the actual Medusa order for a Split Pay checkout, using the
 * "pp_system_default" manual payment provider (already enabled on every
 * region — see apps/backend/src/migration-scripts/initial-data-seed.ts).
 * This deliberately avoids Medusa attempting its own Stripe capture: real
 * billing happens entirely through the Stripe subscription schedule created
 * above, not through Medusa's payment module.
 *
 * Best-effort: if anything here fails, we log and return null rather than
 * throwing — the customer's card is already saved and the Stripe schedule
 * already exists, so we don't want a Medusa-side hiccup to block them from
 * seeing a confirmation. Worst case, the order needs to be reconciled
 * manually and the customer gets the generic confirmation page instead of
 * the MUSE Pay email.
 */
async function completeSplitPayOrder({
  medusaCartId,
  schedule,
  totalCents,
  baseCents,
  finalCents,
  currency,
}: {
  medusaCartId: string
  schedule: Stripe.SubscriptionSchedule
  totalCents: number
  baseCents: number
  finalCents: number
  currency: string
}): Promise<{ orderId: string; displayId: string | number } | null> {
  if (!medusaCartId) {
    console.error("Split Pay: missing medusa_cart_id, cannot place order.")
    return null
  }

  try {
    const headers = { ...(await getAuthHeaders()) }

    const { cart } = await sdk.store.cart.retrieve(medusaCartId, {}, headers)

    await sdk.store.payment.initiatePaymentSession(
      cart,
      { provider_id: "pp_system_default" },
      {},
      headers
    )

    const completion = await sdk.store.cart.complete(medusaCartId, {}, headers)

    if (completion.type !== "order") {
      console.error(
        `Split Pay: cart ${medusaCartId} did not complete into an order.`,
        completion
      )
      return null
    }

    const order = completion.order

    await sdk.client.fetch("/store/split-pay/attach-metadata", {
      method: "POST",
      body: {
        order_id: order.id,
        schedule_id: schedule.id,
        subscription_id: String(schedule.subscription),
        total_cents: totalCents,
        base_cents: baseCents,
        final_cents: finalCents,
        currency,
      },
    })

    return { orderId: order.id, displayId: order.display_id ?? order.id }
  } catch (error) {
    console.error("Split Pay: failed to complete Medusa order.", error)
    return null
  }
}

function getSplitPayConfirmationUrl({
  request,
  countryCode,
  schedule,
  totalCents,
  baseCents,
  finalCents,
  currency,
  order,
}: {
  request: NextRequest
  countryCode: string
  schedule: Stripe.SubscriptionSchedule
  totalCents: number
  baseCents: number
  finalCents: number
  currency: string
  order: { orderId: string; displayId: string | number } | null
}) {
  const completeUrl = new URL(
    `/${countryCode}/order/split-pay/confirmed`,
    request.url
  )
  completeUrl.searchParams.set("schedule_id", schedule.id)
  completeUrl.searchParams.set("subscription_id", String(schedule.subscription))
  completeUrl.searchParams.set("total_cents", String(totalCents))
  completeUrl.searchParams.set("base_cents", String(baseCents))
  completeUrl.searchParams.set("final_cents", String(finalCents))
  completeUrl.searchParams.set("currency", currency)
  if (order) {
    completeUrl.searchParams.set("order_id", order.orderId)
    completeUrl.searchParams.set("display_id", String(order.displayId))
  }

  return completeUrl
}

async function createSplitPaySchedule({
  setupIntent,
  checkoutSessionId,
}: {
  setupIntent: Stripe.SetupIntent
  checkoutSessionId?: string
}) {
  const stripe = getStripeServer()
  const customerId = getStripeId(setupIntent.customer)
  const paymentMethodId = getStripeId(setupIntent.payment_method)

  if (!customerId || !paymentMethodId) {
    throw new Error("Stripe did not return a saved payment method.")
  }

  const currency = setupIntent.metadata?.currency || "nzd"
  const totalCents = Number(setupIntent.metadata?.total_cents)
  const baseCents = Number(setupIntent.metadata?.base_cents)
  const finalCents = Number(setupIntent.metadata?.final_cents)
  const medusaCartId = setupIntent.metadata?.medusa_cart_id || ""

  if (!totalCents || !baseCents || !finalCents) {
    throw new Error("Missing Split Pay schedule metadata.")
  }

  await stripe.paymentMethods
    .attach(paymentMethodId, {
      customer: customerId,
    })
    .catch((error) => {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("already been attached")
      ) {
        return null
      }

      throw error
    })

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  })

  const product = await stripe.products.create({
    name: `MUSE Split Pay cart ${medusaCartId}`,
    metadata: {
      medusa_cart_id: medusaCartId,
      checkout_session_id: checkoutSessionId ?? "",
      setup_intent_id: setupIntent.id,
      muse_split_pay: "true",
    },
  })

  const basePrice = await stripe.prices.create({
    product: product.id,
    currency,
    unit_amount: baseCents,
    recurring: {
      interval: "week",
      interval_count: 1,
    },
    nickname: `MUSE Split Pay weekly ${formatSplitPayMoney(baseCents, currency)}`,
    metadata: {
      medusa_cart_id: medusaCartId,
      checkout_session_id: checkoutSessionId ?? "",
      setup_intent_id: setupIntent.id,
      muse_split_pay: "true",
    },
  })

  const finalPrice = await stripe.prices.create({
    product: product.id,
    currency,
    unit_amount: finalCents,
    recurring: {
      interval: "week",
      interval_count: 1,
    },
    nickname: `MUSE Split Pay final ${formatSplitPayMoney(finalCents, currency)}`,
    metadata: {
      medusa_cart_id: medusaCartId,
      checkout_session_id: checkoutSessionId ?? "",
      setup_intent_id: setupIntent.id,
      muse_split_pay: "true",
    },
  })
  const now = Math.floor(Date.now() / 1000)
  const weekInSeconds = 7 * 24 * 60 * 60
  const finalPhaseStart =
    now + weekInSeconds * (SPLIT_PAY_INSTALLMENTS - 1)
  const scheduleEnd = now + weekInSeconds * SPLIT_PAY_INSTALLMENTS

  const schedule = await stripe.subscriptionSchedules.create(
    {
      customer: customerId,
      start_date: now,
      end_behavior: "cancel",
      default_settings: {
        collection_method: "charge_automatically",
        default_payment_method: paymentMethodId,
        description: "MUSE Split Pay - ships after final payment",
      },
      phases: [
        {
          items: [{ price: basePrice.id, quantity: 1 }],
          end_date: finalPhaseStart,
          metadata: {
            medusa_cart_id: medusaCartId,
            checkout_session_id: checkoutSessionId ?? "",
            setup_intent_id: setupIntent.id,
            muse_split_pay: "true",
            phase: "weekly",
          },
        },
        {
          items: [{ price: finalPrice.id, quantity: 1 }],
          end_date: scheduleEnd,
          metadata: {
            medusa_cart_id: medusaCartId,
            checkout_session_id: checkoutSessionId ?? "",
            setup_intent_id: setupIntent.id,
            muse_split_pay: "true",
            phase: "final",
          },
        },
      ],
      metadata: {
        medusa_cart_id: medusaCartId,
        checkout_session_id: checkoutSessionId ?? "",
        setup_intent_id: setupIntent.id,
        muse_split_pay: "true",
        total_cents: String(totalCents),
      },
    },
    {
      idempotencyKey: `muse_split_pay_${setupIntent.id}`,
    }
  )

  return {
    schedule,
    currency,
    totalCents,
    baseCents,
    finalCents,
    medusaCartId,
    countryCode: setupIntent.metadata?.country_code || "nz",
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      setup_intent_id?: string
      country_code?: string
    }

    if (!body.setup_intent_id) {
      return NextResponse.json(
        { error: "Missing Split Pay setup intent." },
        { status: 400 }
      )
    }

    const stripe = getStripeServer()
    const setupIntent = await stripe.setupIntents.retrieve(
      body.setup_intent_id,
      {
        expand: ["customer", "payment_method"],
      }
    )

    if (setupIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Split Pay card setup is not complete yet." },
        { status: 400 }
      )
    }

    const result = await createSplitPaySchedule({ setupIntent })
    const order = await completeSplitPayOrder({
      medusaCartId: result.medusaCartId,
      schedule: result.schedule,
      totalCents: result.totalCents,
      baseCents: result.baseCents,
      finalCents: result.finalCents,
      currency: result.currency,
    })
    const confirmationUrl = getSplitPayConfirmationUrl({
      request,
      countryCode: body.country_code || result.countryCode,
      schedule: result.schedule,
      totalCents: result.totalCents,
      baseCents: result.baseCents,
      finalCents: result.finalCents,
      currency: result.currency,
      order,
    })

    return NextResponse.json({
      url: confirmationUrl.toString(),
      schedule_id: result.schedule.id,
      subscription_id: result.schedule.subscription,
      order_id: order?.orderId,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Split Pay setup failed."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")
  const countryCode = request.nextUrl.searchParams.get("country_code") || "nz"

  if (!sessionId) {
    return NextResponse.redirect(
      new URL(`/${countryCode}/checkout?step=payment&muse_step=payment`, request.url)
    )
  }

  try {
    const stripe = getStripeServer()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["setup_intent", "customer"],
    })

    const setupIntent = session.setup_intent as Stripe.SetupIntent | null

    if (!setupIntent) {
      throw new Error("Stripe did not return a saved payment method.")
    }

    setupIntent.metadata = {
      ...(session.metadata ?? {}),
      ...(setupIntent.metadata ?? {}),
      country_code: countryCode,
    }

    const result = await createSplitPaySchedule({
      setupIntent,
      checkoutSessionId: session.id,
    })
    const order = await completeSplitPayOrder({
      medusaCartId: result.medusaCartId,
      schedule: result.schedule,
      totalCents: result.totalCents,
      baseCents: result.baseCents,
      finalCents: result.finalCents,
      currency: result.currency,
    })
    const completeUrl = getSplitPayConfirmationUrl({
      request,
      countryCode,
      schedule: result.schedule,
      totalCents: result.totalCents,
      baseCents: result.baseCents,
      finalCents: result.finalCents,
      currency: result.currency,
      order,
    })

    return NextResponse.redirect(completeUrl)
  } catch (error) {
    const failedUrl = new URL(
      `/${countryCode}/checkout?step=payment&muse_step=payment`,
      request.url
    )
    failedUrl.searchParams.set(
      "split_pay_error",
      error instanceof Error ? error.message : "Split Pay setup failed."
    )

    return NextResponse.redirect(failedUrl)
  }
}
