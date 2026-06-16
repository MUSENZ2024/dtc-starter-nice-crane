"use client"

import { useCartDrawer } from "@lib/context/cart-drawer-context"
import {
  addToCart,
  applyPromotions,
  deleteLineItem,
  updateLineItem,
} from "@lib/data/cart"
import { SavedItem, useSavedItems } from "@lib/context/saved-items-context"
import { getDeliveredByLabel } from "@lib/util/delivery-estimate"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AddonsSection from "@modules/cart/components/addons-section-muse"
import PaymentBadges from "@modules/common/components/payment-badges"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState, useTransition } from "react"
import { createPortal } from "react-dom"

const FREE_SHIPPING_THRESHOLD = 200

type CartDrawerProps = {
  cart: HttpTypes.StoreCart | null
  addonProducts: HttpTypes.StoreProduct[]
  countryCode: string
}

function money(cart: HttpTypes.StoreCart | null, amount: number) {
  return convertToLocale({
    amount,
    currency_code: cart?.currency_code ?? "nzd",
  })
}

type EditableLineItem = HttpTypes.StoreCartLineItem & {
  product?: { handle?: string | null; id?: string | null } | null
  product_id?: string | null
  product_handle?: string | null
  variant_id?: string | null
}

type SavedToast = {
  item: Omit<SavedItem, "savedAt">
  variantId?: string | null
  quantity: number
  addedNew: boolean
}

function getEditHref(item: HttpTypes.StoreCartLineItem) {
  const editableItem = item as EditableLineItem
  const productHandle = editableItem.product?.handle ?? editableItem.product_handle

  if (!productHandle) {
    return "/store"
  }

  const params = new URLSearchParams({
    edit_line_id: item.id,
    edit_quantity: String(item.quantity),
    return_to: "bag",
  })

  const variantId = editableItem.variant_id ?? item.variant?.id

  if (variantId) {
    params.set("edit_variant_id", variantId)
  }

  return `/products/${productHandle}?${params.toString()}`
}

function getCartItemVariantId(item: HttpTypes.StoreCartLineItem) {
  const editableItem = item as EditableLineItem

  return editableItem.variant_id ?? item.variant?.id
}

export default function CartDrawer({
  cart,
  addonProducts,
  countryCode,
}: CartDrawerProps) {
  const { isOpen, openDrawer, closeDrawer } = useCartDrawer()
  const { items: savedItems, hydrated, isSaved, toggleSaved, removeSaved } =
    useSavedItems()
  const [mounted, setMounted] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountCode, setDiscountCode] = useState("")
  const [savedToast, setSavedToast] = useState<SavedToast | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const subtotal = cart?.subtotal ?? cart?.item_subtotal ?? 0
  const itemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0
  const freeShippingGap = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const shippingUnlocked = freeShippingGap === 0
  const isEmpty = !cart?.items?.length
  const deliveryLabel = getDeliveredByLabel()

  function getSavedItemFromCartItem(
    item: HttpTypes.StoreCartLineItem
  ): Omit<SavedItem, "savedAt"> {
    const editableItem = item as EditableLineItem
    const productHandle = editableItem.product?.handle ?? editableItem.product_handle
    const variantId = getCartItemVariantId(item)
    const href = productHandle
      ? `/products/${productHandle}${variantId ? `?v_id=${variantId}` : ""}`
      : "/store"

    return {
      id: editableItem.product?.id ?? editableItem.product_id ?? variantId ?? item.id,
      title: item.product_title ?? item.title ?? "MUSE item",
      handle: productHandle,
      href,
      image: item.thumbnail,
      price: money(cart, item.unit_price ?? 0),
      badge: "Standard",
      eta: deliveryLabel,
    }
  }

  function mutateCart(action: () => Promise<void>) {
    startTransition(async () => {
      await action()
      router.refresh()
    })
  }

  function handleSaveForLater(item: HttpTypes.StoreCartLineItem) {
    const savedItem = getSavedItemFromCartItem(item)
    const addedNew = !isSaved(savedItem.id)

    if (addedNew) {
      toggleSaved(savedItem)
    }

    setSavedToast({
      item: savedItem,
      variantId: getCartItemVariantId(item),
      quantity: item.quantity,
      addedNew,
    })

    mutateCart(() => deleteLineItem(item.id))
  }

  function handleUndoSave() {
    if (!savedToast?.variantId) {
      return
    }

    startTransition(async () => {
      if (savedToast.addedNew) {
        removeSaved(savedToast.item.id)
      }

      await addToCart({
        variantId: savedToast.variantId!,
        quantity: savedToast.quantity,
        countryCode,
      })
      setSavedToast(null)
      router.refresh()
    })
  }

  function handleQty(lineId: string, delta: number, currentQty: number) {
    const nextQty = currentQty + delta

    mutateCart(async () => {
      if (nextQty < 1) {
        await deleteLineItem(lineId)
        return
      }

      await updateLineItem({ lineId, quantity: nextQty })
    })
  }

  function handleDiscount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = discountCode.trim()

    if (!code) {
      return
    }

    mutateCart(async () => {
      await applyPromotions([code])
      setDiscountCode("")
      setDiscountOpen(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muse-yellow text-muse-black transition hover:-translate-y-px hover:bg-white large:h-auto large:w-auto large:gap-2 large:px-5 large:py-2 large:text-[12px] large:font-black large:uppercase large:tracking-[0.14em]"
        aria-label={`Open cart with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
        data-testid="nav-cart-link"
      >
        <svg
          className="h-[17px] w-[17px] large:hidden"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span className="hidden large:inline">Bag</span>
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black text-muse-black large:static large:h-5 large:w-5 large:bg-muse-black large:text-[11px] large:font-extrabold large:text-muse-yellow"
          aria-live="polite"
        >
          {itemCount}
        </span>
      </button>

      {mounted
        ? createPortal(
            <>
              <div
                className={`fixed inset-0 z-[150] transition-colors duration-300 ${
                  isOpen ? "pointer-events-auto bg-black/50" : "pointer-events-none bg-transparent"
                }`}
                onClick={closeDrawer}
                aria-hidden="true"
              />

              <aside
                role="dialog"
                aria-label="Shopping cart"
                aria-modal="true"
                className={`fixed bottom-0 right-0 top-0 z-[160] flex w-[480px] max-w-full flex-col bg-muse-cream shadow-2xl transition-transform duration-300 ease-out ${
                  isOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
        <header className="flex flex-shrink-0 items-center justify-between border-b border-muse-border px-6 py-5">
          <div className="flex items-center gap-2 text-base font-black tracking-tight text-muse-black">
            Your bag
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-muse-black text-[11px] font-extrabold text-muse-cream">
              {itemCount}
            </span>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muse-cream-deep p-0 text-xl leading-[1] text-muse-text-muted transition hover:bg-muse-border"
            aria-label="Close cart"
          >
            x
          </button>
        </header>

        {!isEmpty && (
          <div className="flex-shrink-0 border-b border-muse-border px-6 py-4">
            <p className="mb-2.5 text-[12.5px] text-muse-black">
              {shippingUnlocked ? (
                <strong className="text-muse-green">
                  You&apos;ve unlocked free NZ delivery.
                </strong>
              ) : (
                <>
                  Add <strong>{money(cart, freeShippingGap)}</strong> for{" "}
                  <strong className="text-muse-green">free NZ delivery</strong>
                </>
              )}
            </p>
            <div className="h-[7px] overflow-hidden rounded-full bg-muse-border">
              <div
                className="h-full rounded-full bg-muse-green transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {!isEmpty ? (
            <ul className="flex flex-col gap-5 px-6 pt-5">
              {cart!.items!.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 border-b border-muse-border pb-5 last:border-0"
                >
                  <div className="relative flex h-[84px] w-[84px] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-muse-cream-deep to-muse-cream-warm">
                    {item.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-muse-cream/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      <span className="inline-block h-[5px] w-[5px] rounded-full bg-muse-orange" />
                      Standard
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 truncate text-[13.5px] font-bold text-muse-black">
                      {item.product_title}
                    </p>
                    <div className="mb-2.5 flex items-center gap-2 text-xs text-muse-text-muted">
                      <span>{item.variant?.title}</span>
                      <LocalizedClientLink
                        href={getEditHref(item)}
                        onClick={closeDrawer}
                        className="font-semibold text-muse-orange underline decoration-muse-orange underline-offset-2 transition hover:text-muse-black"
                      >
                        Edit
                      </LocalizedClientLink>
                      <button
                        type="button"
                        onClick={() => handleSaveForLater(item)}
                        disabled={isPending}
                        className="font-semibold text-muse-black underline decoration-muse-input underline-offset-2 transition hover:text-muse-orange disabled:opacity-50"
                      >
                        Save for later
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-[34px] items-center overflow-hidden rounded-full border border-muse-input bg-white">
                        <button
                          type="button"
                          onClick={() => handleQty(item.id, -1, item.quantity)}
                          disabled={isPending}
                          className="flex w-[34px] items-center justify-center text-lg text-muse-text-muted transition hover:text-muse-black disabled:opacity-50"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-[13px] font-bold text-muse-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQty(item.id, 1, item.quantity)}
                          disabled={isPending}
                          className="flex w-[34px] items-center justify-center text-lg text-muse-text-muted transition hover:text-muse-black disabled:opacity-50"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="whitespace-nowrap text-[15px] font-extrabold text-muse-black">
                        {money(cart, (item.unit_price ?? 0) * item.quantity)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => mutateCart(() => deleteLineItem(item.id))}
                    disabled={isPending}
                    className="self-start p-1 text-base text-muse-text-light transition hover:text-muse-orange disabled:opacity-50"
                    aria-label="Remove item"
                  >
                    x
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-muse-cream-warm">
                <svg className="h-8 w-8 stroke-muse-text-light" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <p className="text-lg font-black tracking-tight text-muse-black">
                Your bag is empty
              </p>
              <p className="max-w-[260px] text-sm leading-relaxed text-muse-text-muted">
                Looks like you have not added anything yet.
              </p>
              {hydrated && savedItems.length > 0 && (
                <div className="mt-1 w-full rounded-[22px] border border-muse-border bg-white p-4 text-left">
                  <p className="mb-3 text-[12px] font-black uppercase tracking-[0.12em] text-muse-black">
                    Still thinking about these?
                  </p>
                  <div className="space-y-3">
                    {savedItems.slice(0, 3).map((item) => (
                      <LocalizedClientLink
                        key={item.id}
                        href={item.href}
                        onClick={closeDrawer}
                        className="flex items-center gap-3 rounded-2xl bg-muse-cream-warm p-2 transition hover:bg-muse-cream-deep"
                      >
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muse-cream-deep">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-widest text-muse-text-light">
                              Muse
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-bold text-muse-black">
                            {item.title}
                          </span>
                          {item.price && (
                            <span className="mt-0.5 block text-[12px] font-extrabold text-muse-black">
                              {item.price}
                            </span>
                          )}
                        </span>
                      </LocalizedClientLink>
                    ))}
                  </div>
                </div>
              )}
              <LocalizedClientLink
                href="/store"
                onClick={closeDrawer}
                className="mt-2 rounded-full bg-muse-black px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-muse-cream transition hover:bg-muse-orange"
              >
                Continue shopping
              </LocalizedClientLink>
            </div>
          )}

          {!isEmpty && (
            <>
              <div className="mx-6 mt-5 rounded-2xl border border-muse-border bg-muse-cream-warm p-4 text-[12.5px] leading-relaxed">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muse-text-light">
                  Estimated delivery
                </p>
                <p className="font-bold text-muse-black">{deliveryLabel}</p>
                <p className="text-muse-text-muted">Tracked NZ Post final leg · free over $200</p>
              </div>

              <div className="mx-6 mt-5">
                <p className="text-[12.5px] text-muse-text-muted">
                  Have a discount code?{" "}
                  <button
                    type="button"
                    onClick={() => setDiscountOpen((value) => !value)}
                    className="border-b border-dashed border-muse-input font-bold text-muse-black"
                  >
                    Enter it here
                  </button>
                </p>
                {discountOpen && (
                  <form className="mt-2.5 flex gap-2" onSubmit={handleDiscount}>
                    <input
                      name="code"
                      type="text"
                      value={discountCode}
                      onChange={(event) => setDiscountCode(event.target.value)}
                      placeholder="Discount code"
                      className="flex-1 rounded-full border border-muse-input bg-white px-4 py-3 text-[12.5px] uppercase tracking-wider outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-muse-text-light focus:border-muse-black"
                      maxLength={24}
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="whitespace-nowrap rounded-full bg-muse-black px-5 py-3 text-[11.5px] font-bold uppercase tracking-wider text-muse-cream transition hover:bg-muse-orange disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

              {addonProducts.length > 0 && (
                <div className="mx-6">
                  <AddonsSection
                    products={addonProducts}
                    currencyCode={cart?.currency_code ?? "nzd"}
                    countryCode={countryCode}
                  />
                </div>
              )}
            </>
          )}
          <div className="h-6" />
        </div>

        {!isEmpty && (
          <footer className="flex-shrink-0 border-t border-muse-border bg-muse-cream px-6 pb-6 pt-5">
            <div className="mb-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {["30-day money back", "Inspected before dispatch", "Stripe SSL secured"].map((text) => (
                <span key={text} className="flex items-center gap-1 text-[10.5px] text-muse-text-muted">
                  <span className="font-bold text-muse-green">✓</span>
                  {text}
                </span>
              ))}
            </div>

            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[13px] font-medium text-muse-text-muted">Subtotal</span>
              <span className="text-[20px] font-black tracking-tight text-muse-black">
                {money(cart, subtotal)}
              </span>
            </div>
            <p className="mb-4 text-[11.5px] text-muse-text-muted">
              Shipping calculated at checkout · taxes included where applicable
            </p>

            <LocalizedClientLink
              href="/checkout?step=address"
              onClick={closeDrawer}
              className="mb-2.5 flex w-full items-center justify-center gap-2.5 rounded-full bg-muse-black py-5 text-[14px] font-extrabold uppercase tracking-widest text-muse-cream transition hover:-translate-y-px hover:bg-muse-orange"
            >
              Checkout
            </LocalizedClientLink>

            <PaymentBadges className="mb-3.5" />

            <LocalizedClientLink
              href="/cart"
              onClick={closeDrawer}
              className="block text-center text-xs font-semibold uppercase tracking-widest text-muse-text-light transition hover:text-muse-black"
            >
              View full bag →
            </LocalizedClientLink>
          </footer>
        )}
        {savedToast && (
          <div
            role="status"
            className="absolute bottom-4 left-4 right-4 z-[2] flex items-center justify-between gap-3 rounded-2xl bg-muse-black px-4 py-3 text-[12.5px] font-semibold text-muse-cream shadow-xl shadow-black/20"
          >
            <span>Moved to saved items.</span>
            {savedToast.variantId && (
              <button
                type="button"
                onClick={handleUndoSave}
                disabled={isPending}
                className="shrink-0 border-b border-muse-yellow pb-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-muse-yellow transition hover:text-white disabled:opacity-50"
              >
                Undo
              </button>
            )}
          </div>
        )}
              </aside>
            </>,
            document.body
          )
        : null}
    </>
  )
}
