"use client"

import { useCartDrawer } from "@lib/context/cart-drawer-context"
import {
  addToCart,
  addPromotionCode,
  deleteLineItem,
  updateLineItem,
} from "@lib/data/cart"
import { SavedItem, useSavedItems } from "@lib/context/saved-items-context"
import {
  getCartFulfilmentSummary,
  getFulfilmentState,
} from "@lib/util/fulfilment-state"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AddonsSection from "@modules/cart/components/addons-section-muse"
import PaymentBadges from "@modules/common/components/payment-badges"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useRef, useState, useTransition } from "react"
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
  const {
    isOpen,
    isCartMutating,
    optimisticItems,
    openDrawer,
    closeDrawer,
    registerCartSnapshot,
    registerCartSubtotal,
  } = useCartDrawer()
  const { items: savedItems, hydrated, isSaved, toggleSaved, removeSaved } =
    useSavedItems()
  const [mounted, setMounted] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountCode, setDiscountCode] = useState("")
  const [discountError, setDiscountError] = useState("")
  const [cartError, setCartError] = useState("")
  const [quantityOverrides, setQuantityOverrides] = useState<
    Record<string, number>
  >({})
  const [savedToast, setSavedToast] = useState<SavedToast | null>(null)
  const [isPending, startTransition] = useTransition()
  const drawerRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ""
      if (wasOpenRef.current) {
        window.requestAnimationFrame(() => returnFocusRef.current?.focus())
      }
      wasOpenRef.current = false
      return
    }

    wasOpenRef.current = true
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    document.body.style.overflow = "hidden"

    const drawer = drawerRef.current
    if (!drawer) return

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",")
    const getFocusable = () =>
      Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null
      )

    window.requestAnimationFrame(() =>
      drawer.querySelector<HTMLElement>('[aria-label="Close cart"]')?.focus()
    )

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeDrawer()
        return
      }
      if (event.key !== "Tab") return

      const items = getFocusable()
      if (!items.length) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [closeDrawer, isOpen])

  useEffect(() => {
    registerCartSnapshot(
      (cart?.items ?? []).map((item) => ({
        variantId: getCartItemVariantId(item),
        quantity: item.quantity,
      }))
    )
  }, [cart, registerCartSnapshot])

  useEffect(() => {
    setQuantityOverrides((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([lineId, quantity]) => {
          const line = cart?.items?.find((item) => item.id === lineId)
          return Boolean(line && line.quantity !== quantity)
        })
      )
    )
  }, [cart])

  const cartItems = cart?.items ?? []
  const optimisticByVariant = new Map(
    optimisticItems.map((item) => [item.variantId, item])
  )
  const cartVariantIds = new Set(
    cartItems
      .map((item) => getCartItemVariantId(item))
      .filter((variantId): variantId is string => Boolean(variantId))
  )
  const pendingOnlyItems = optimisticItems.filter(
    (item) =>
      !cartVariantIds.has(item.variantId) &&
      item.baseQuantity + item.quantity > 0
  )
  const getVisibleQuantity = (item: HttpTypes.StoreCartLineItem) => {
    const overriddenQuantity = quantityOverrides[item.id]

    if (typeof overriddenQuantity === "number") {
      return overriddenQuantity
    }

    const variantId = getCartItemVariantId(item)
    const optimisticItem = variantId ? optimisticByVariant.get(variantId) : null

    return optimisticItem
      ? Math.max(0, optimisticItem.baseQuantity + optimisticItem.quantity)
      : item.quantity
  }
  const optimisticSubtotalDelta = optimisticItems.reduce((sum, item) => {
    const matchingCartItem = cartItems.find(
      (cartItem) => getCartItemVariantId(cartItem) === item.variantId
    )
    const realQuantity = matchingCartItem?.quantity ?? 0
    const targetQuantity = Math.max(0, item.baseQuantity + item.quantity)

    return sum + item.unitPrice * (targetQuantity - realQuantity)
  }, 0)
  const quantityOverrideDelta = cartItems.reduce((sum, item) => {
    const overriddenQuantity = quantityOverrides[item.id]

    if (typeof overriddenQuantity !== "number") {
      return sum
    }

    return sum + (overriddenQuantity - item.quantity) * (item.unit_price ?? 0)
  }, 0)
  const subtotal =
    (cart?.subtotal ?? cart?.item_subtotal ?? 0) +
    optimisticSubtotalDelta +
    quantityOverrideDelta
  const itemCount =
    cartItems.reduce((acc, item) => acc + getVisibleQuantity(item), 0) +
    pendingOnlyItems.reduce(
      (acc, item) => acc + Math.max(0, item.baseQuantity + item.quantity),
      0
    )
  const freeShippingGap = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const shippingUnlocked = freeShippingGap === 0
  const isEmpty = cartItems.length === 0 && pendingOnlyItems.length === 0
  const fulfilmentSummary = getCartFulfilmentSummary(cartItems)

  useEffect(() => {
    registerCartSubtotal(subtotal)
  }, [registerCartSubtotal, subtotal])

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
      badge: getFulfilmentState(item).shortLabel,
      eta: getFulfilmentState(item).deliveryLabel,
    }
  }

  function mutateCart(
    action: () => Promise<void>,
    onError?: () => void
  ) {
    startTransition(async () => {
      setCartError("")

      try {
        await action()
      } catch (error) {
        console.error("[cart:mutation-failed]", error)
        onError?.()
        setCartError("Your bag could not be updated. Please try again.")
      } finally {
        router.refresh()
      }
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
    setQuantityOverrides((current) => ({ ...current, [lineId]: nextQty }))

    mutateCart(
      async () => {
        if (nextQty < 1) {
          await deleteLineItem(lineId)
          return
        }

        await updateLineItem({ lineId, quantity: nextQty })
      },
      () =>
        setQuantityOverrides((current) => {
          const next = { ...current }
          delete next[lineId]
          return next
        })
    )
  }

  function handleDiscount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = discountCode.trim()

    if (!code) {
      return
    }

    setDiscountError("")
    startTransition(async () => {
      const result = await addPromotionCode(code)

      if (!result.success) {
        setDiscountError(result.error)
        return
      }

      setDiscountCode("")
      setDiscountOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-muse-yellow text-muse-black transition hover:-translate-y-px hover:bg-white large:h-auto large:w-auto large:gap-2 large:px-5 large:py-2 large:text-[12px] large:font-black large:uppercase large:tracking-[0.14em]"
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
          aria-hidden="true"
        >
          {itemCount}
        </span>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {itemCount} {itemCount === 1 ? "item" : "items"} in cart
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
                ref={drawerRef}
                role="dialog"
                aria-label="Shopping cart"
                aria-modal="true"
                aria-hidden={!isOpen}
                inert={!isOpen}
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muse-cream-deep p-0 text-xl leading-[1] text-muse-text-muted transition hover:bg-muse-border"
            aria-label="Close cart"
          >
            x
          </button>
        </header>

        {isCartMutating && (
          <div
            className="flex items-center gap-2 border-b border-muse-border bg-muse-cream-warm px-6 py-3 text-[12.5px] font-semibold text-muse-black"
            role="status"
          >
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muse-black/20 border-t-muse-black" />
            Adding to your bag...
          </div>
        )}

        {cartError && (
          <p
            role="alert"
            className="border-b border-[#E7B7A5] bg-[#FDF4EF] px-6 py-3 text-[12.5px] font-semibold text-[#A33A12]"
          >
            {cartError}
          </p>
        )}

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
              {cartItems.map((item) => {
                const fulfilment = getFulfilmentState(item)
                const visibleQuantity = getVisibleQuantity(item)

                return (
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
                      <span
                        className={`inline-block h-[5px] w-[5px] rounded-full ${fulfilment.dotClassName}`}
                      />
                      {fulfilment.shortLabel}
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
                      <div className="flex h-11 items-center overflow-hidden rounded-full border border-muse-input bg-white">
                        <button
                          type="button"
                          onClick={() => handleQty(item.id, -1, visibleQuantity)}
                          disabled={isPending || isCartMutating}
                          className="flex h-11 w-11 items-center justify-center text-lg text-muse-text-muted transition hover:text-muse-black disabled:opacity-50"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-[13px] font-bold text-muse-black">
                          {visibleQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQty(item.id, 1, visibleQuantity)}
                          disabled={isPending || isCartMutating}
                          className="flex h-11 w-11 items-center justify-center text-lg text-muse-text-muted transition hover:text-muse-black disabled:opacity-50"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="whitespace-nowrap text-[15px] font-extrabold text-muse-black">
                        {money(cart, (item.unit_price ?? 0) * visibleQuantity)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => mutateCart(() => deleteLineItem(item.id))}
                    disabled={isPending}
                    className="flex h-11 w-11 shrink-0 items-center justify-center self-start text-base text-muse-text-light transition hover:text-muse-orange disabled:opacity-50"
                    aria-label="Remove item"
                  >
                    x
                  </button>
                  </li>
                )
              })}
              {pendingOnlyItems.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 border-b border-muse-border pb-5 last:border-0"
                >
                  <div className="relative flex h-[84px] w-[84px] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-muse-cream-deep to-muse-cream-warm">
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt={item.productTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-muse-text-light">
                        Muse
                      </span>
                    )}
                    {item.fulfilmentShortLabel && (
                      <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-muse-cream/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        <span
                          className={`inline-block h-[5px] w-[5px] rounded-full ${
                            item.fulfilmentDotClassName ?? "bg-[#C1440E]"
                          }`}
                        />
                        {item.fulfilmentShortLabel}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 truncate text-[13.5px] font-bold text-muse-black">
                      {item.productTitle}
                    </p>
                    <div className="mb-2.5 flex items-center gap-2 text-xs text-muse-text-muted">
                      <span>{item.variantTitle}</span>
                      <span className="font-semibold text-muse-orange">
                        Confirming...
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-[34px] items-center overflow-hidden rounded-full border border-muse-input bg-white opacity-70">
                        <span className="flex w-[34px] items-center justify-center text-lg text-muse-text-muted">
                          -
                        </span>
                        <span className="w-7 text-center text-[13px] font-bold text-muse-black">
                          {item.quantity}
                        </span>
                        <span className="flex w-[34px] items-center justify-center text-lg text-muse-text-muted">
                          +
                        </span>
                      </div>

                      <span className="whitespace-nowrap text-[15px] font-extrabold text-muse-black">
                        {convertToLocale({
                          amount: item.unitPrice * item.quantity,
                          currency_code: item.currencyCode,
                        })}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : isCartMutating ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-muse-border border-t-muse-black" />
              <p className="text-lg font-black tracking-tight text-muse-black">
                Adding your item
              </p>
              <p className="max-w-[260px] text-sm leading-relaxed text-muse-text-muted">
                Your bag will update in a moment.
              </p>
            </div>
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
                <p className="font-bold text-muse-black">
                  {fulfilmentSummary.fullOrderLabel}
                </p>
                <p className="text-muse-text-muted">
                  {fulfilmentSummary.supportCopy} Free over $200.
                </p>
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
                  <div>
                    <form className="mt-2.5 flex gap-2" onSubmit={handleDiscount}>
                      <input
                        name="code"
                        type="text"
                        value={discountCode}
                        onChange={(event) => {
                          setDiscountCode(event.target.value)
                          setDiscountError("")
                        }}
                        aria-invalid={Boolean(discountError)}
                        aria-describedby={discountError ? "drawer-discount-error" : undefined}
                        placeholder="Discount code"
                        className="flex-1 rounded-full border border-muse-input bg-white px-4 py-3 text-[12.5px] uppercase tracking-wider outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-muse-text-light focus:border-muse-black"
                        maxLength={24}
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="whitespace-nowrap rounded-full bg-muse-black px-5 py-3 text-[11.5px] font-bold uppercase tracking-wider text-muse-cream transition hover:bg-muse-orange disabled:opacity-50"
                      >
                        {isPending ? "Checking..." : "Apply"}
                      </button>
                    </form>
                    {discountError && (
                      <p
                        id="drawer-discount-error"
                        role="alert"
                        className="mt-2 text-[12px] font-semibold text-[#A33A12]"
                      >
                        {discountError}
                      </p>
                    )}
                  </div>
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
