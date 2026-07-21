import { Metadata } from "next"
import { Suspense } from "react"

import { CartDrawerProvider } from "@lib/context/cart-drawer-context"
import { SavedItemsProvider } from "@lib/context/saved-items-context"
import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import WelcomePopup from "@modules/marketing/components/welcome-popup"
import { MarketingOverlayProvider } from "@modules/marketing/context/marketing-overlay-context"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

async function PersonalizedLayoutChrome() {
  const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()

    shippingOptions = shipping_options
  }

  return (
    <>
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
    </>
  )
}

export default function PageLayout(props: { children: React.ReactNode }) {
  return (
    <CartDrawerProvider>
      <MarketingOverlayProvider>
        <SavedItemsProvider>
          <Nav />
          <Suspense fallback={null}>
            <PersonalizedLayoutChrome />
          </Suspense>
          <WelcomePopup />
          {props.children}
          <Footer />
        </SavedItemsProvider>
      </MarketingOverlayProvider>
    </CartDrawerProvider>
  )
}
