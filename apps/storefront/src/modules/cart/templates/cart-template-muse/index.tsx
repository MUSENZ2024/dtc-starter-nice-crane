import { HttpTypes } from "@medusajs/types"
import AddonsSection from "@modules/cart/components/addons-section-muse"
import CartItemMuse from "@modules/cart/components/cart-item-muse"
import CartSummaryMuse from "@modules/cart/components/cart-summary-muse"
import EmptyBagMuse from "@modules/cart/components/empty-bag-muse"
import FreeShippingBar from "@modules/cart/components/free-shipping-bar-muse"
import MobileCheckoutBar from "@modules/cart/components/mobile-checkout-bar-muse"
import SignInBanner from "@modules/cart/components/sign-in-banner-muse"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const FREE_SHIPPING_THRESHOLD = 200

type Props = {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  addonProducts: HttpTypes.StoreProduct[]
}

export default function CartTemplateMuse({
  cart,
  customer,
  addonProducts,
}: Props) {
  const items = cart?.items ?? []
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = cart?.subtotal ?? cart?.item_subtotal ?? 0
  const isEmpty = items.length === 0

  return (
    <main className="min-h-screen bg-muse-cream font-inter text-muse-black">
      <div className="border-b border-white/10 bg-muse-black px-4 py-2.5 text-center text-[12px] font-medium tracking-[0.02em] text-muse-cream">
        Free NZ delivery over $200 · 30-day money back{" "}
        <LocalizedClientLink
          href="/how-it-works"
          className="font-bold text-muse-yellow underline decoration-muse-yellow/50 underline-offset-4 transition hover:text-muse-cream"
        >
          how MUSE works →
        </LocalizedClientLink>
      </div>

      <div className="mx-auto max-w-[1320px] px-5 py-8 pb-28 small:px-8 lg:pb-12">
        <div className="mb-7 flex items-center gap-[7px] text-[12px] tracking-[0.03em] text-muse-text-light">
          <LocalizedClientLink
            href="/"
            className="transition hover:text-muse-orange"
          >
            Home
          </LocalizedClientLink>
          <span className="opacity-50">›</span>
          <strong className="font-semibold text-muse-text">Your Bag</strong>
        </div>

        <div className="mb-8 flex items-baseline gap-3">
          <h1 className="text-[clamp(28px,4vw,44px)] font-black leading-none tracking-tight text-muse-black">
            Your bag
          </h1>
          <span className="text-[15px] font-medium text-muse-text-muted">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
        </div>

        {isEmpty ? (
          <EmptyBagMuse />
        ) : (
          <>
            {!customer && <SignInBanner />}

            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_380px]">
              <div>
                <FreeShippingBar
                  subtotal={subtotal}
                  threshold={FREE_SHIPPING_THRESHOLD}
                />

                <div className="flex flex-col">
                  {items.map((item) => (
                    <CartItemMuse
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code ?? "nzd"}
                    />
                  ))}
                </div>

                {cart && addonProducts.length > 0 && (
                  <AddonsSection
                    products={addonProducts}
                    currencyCode={cart.currency_code}
                    countryCode={
                      cart.shipping_address?.country_code?.toLowerCase() ??
                      cart.region?.countries?.[0]?.iso_2?.toLowerCase() ??
                      "nz"
                    }
                  />
                )}

                <LocalizedClientLink
                  href="/store"
                  className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-muse-text-muted transition hover:text-muse-black"
                >
                  ← Continue shopping
                </LocalizedClientLink>
              </div>

              {cart && (
                <aside className="hidden lg:sticky lg:top-[88px] lg:block">
                <CartSummaryMuse cart={cart} />
                </aside>
              )}
            </div>
          </>
        )}
      </div>

      {cart && !isEmpty && (
        <MobileCheckoutBar
          total={cart.total ?? 0}
          currencyCode={cart.currency_code}
        />
      )}
    </main>
  )
}
