import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { retrieveShippingProtectionVariantId } from "@lib/data/products"
import CheckoutPageMuse from "@modules/checkout/templates/checkout-page-muse"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout | MUSE NZ",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const [customer, shippingMethods, paymentMethods, shippingProtectionVariantId] = await Promise.all([
    retrieveCustomer().catch(() => null),
    listCartShippingMethods(cart.id).catch(() => []),
    listCartPaymentMethods(cart.region?.id ?? "").catch(() => []),
    retrieveShippingProtectionVariantId().catch(() => null),
  ])

  return (
    <CheckoutPageMuse
      cart={cart}
      customer={customer}
      shippingMethods={shippingMethods ?? []}
      paymentMethods={paymentMethods ?? []}
      shippingProtectionVariantId={shippingProtectionVariantId}
    />
  )
}
