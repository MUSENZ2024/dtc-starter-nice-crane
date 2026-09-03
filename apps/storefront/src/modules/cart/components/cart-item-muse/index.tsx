"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { useCartDrawer } from "@lib/context/cart-drawer-context"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import DeliveryBadge from "@modules/products/components/delivery-badge"

type Props = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}

const formatMoney = (amount: number, currencyCode: string) =>
  convertToLocale({
    amount,
    currency_code: currencyCode,
  })

const getVariantLabel = (item: HttpTypes.StoreCartLineItem) => {
  const values =
    item.variant?.options
      ?.map((option) => option.value)
      .filter(Boolean)
      .join(" · ") || item.variant?.title

  return values ?? ""
}

const getEditHref = (item: HttpTypes.StoreCartLineItem) => {
  const params = new URLSearchParams()

  if (item.id) params.set("edit_line_id", item.id)
  if (item.quantity) params.set("edit_quantity", String(item.quantity))
  if (item.variant_id ?? item.variant?.id) {
    params.set("edit_variant_id", item.variant_id ?? item.variant!.id)
  }

  return `/products/${item.product_handle}?${params.toString()}`
}

export default function CartItemMuse({ item, currencyCode }: Props) {
  const router = useRouter()
  const {
    beginCartMutation,
    finishCartMutation,
    removeOptimisticItem,
  } = useCartDrawer()
  const [isPending, startTransition] = useTransition()
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [displayQuantity, setDisplayQuantity] = useState(item.quantity)
  const brand = item.variant?.product?.metadata?.brand as string | undefined
  const fulfilment = getFulfilmentState(item)
  const variantLabel = getVariantLabel(item)
  const unitPrice = item.unit_price ?? 0
  const lineTotal = unitPrice * displayQuantity
  const variantId = item.variant_id ?? item.variant?.id

  useEffect(() => {
    setDisplayQuantity(item.quantity)
  }, [item.quantity])

  function handleQtyChange(delta: number) {
    const next = displayQuantity + delta

    if (next < 1) {
      handleRemove()
      return
    }

    setError(null)
    setDisplayQuantity(next)
    if (variantId) {
      beginCartMutation({
        variantId,
        productTitle: item.product_title ?? item.title ?? "MUSE item",
        productHandle: item.product_handle,
        variantTitle: variantLabel,
        thumbnail: item.thumbnail,
        quantity: delta,
        unitPrice,
        currencyCode,
        fulfilmentShortLabel: fulfilment.shortLabel,
        fulfilmentDotClassName: fulfilment.dotClassName,
      })
    }
    startTransition(async () => {
      try {
        await updateLineItem({ lineId: item.id, quantity: next })
        router.refresh()
      } catch (err) {
        setDisplayQuantity(item.quantity)
        if (variantId) {
          removeOptimisticItem(variantId)
        }
        setError(
          err instanceof Error ? err.message : "Could not update quantity"
        )
      } finally {
        finishCartMutation()
      }
    })
  }

  function handleRemove() {
    setRemoving(true)
    setError(null)
    startTransition(async () => {
      try {
        await deleteLineItem(item.id)
        router.refresh()
      } catch (err) {
        setRemoving(false)
        setError(err instanceof Error ? err.message : "Could not remove item")
      }
    })
  }

  return (
    <div
      className={`relative grid grid-cols-[96px_1fr] gap-4 border-b border-muse-border py-6 transition-opacity first:border-t small:grid-cols-[112px_1fr] small:gap-5 ${
        isPending || removing ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <LocalizedClientLink href={`/products/${item.product_handle}`}>
        <div className="muse-cart-thumbnail relative flex h-24 w-24 items-center justify-center overflow-hidden bg-muse-cream-warm small:h-[112px] small:w-[112px]">
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail}
              alt={item.product_title ?? "Product"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[28px] font-black text-black/[0.07]">
              {(item.product_title ?? "").substring(0, 2).toUpperCase()}
            </span>
          )}
          <DeliveryBadge label={fulfilment.shortLabel} />
        </div>
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-col gap-1.5 pr-8">
        {brand && (
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muse-text-muted">
            {brand}
          </p>
        )}

        <LocalizedClientLink href={`/products/${item.product_handle}`}>
          <p className="text-[15px] font-bold leading-snug text-muse-black transition hover:text-muse-orange">
            {item.product_title}
          </p>
        </LocalizedClientLink>

        <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-muse-text-muted">
          {variantLabel}
          <LocalizedClientLink
            href={getEditHref(item)}
            className="border-b border-muse-orange text-[11.5px] font-semibold leading-tight text-muse-orange transition hover:opacity-75"
          >
            Edit
          </LocalizedClientLink>
        </p>

        <p className="flex items-start gap-1.5 text-[12px] text-muse-text-muted">
          <span
            className={`mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${fulfilment.dotClassName}`}
          />
          {fulfilment.label} · {fulfilment.deliveryLabel} · {fulfilment.supportCopy}
        </p>
        {error && (
          <p className="text-[12px] font-semibold text-muse-orange">
            {error}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-2.5">
          <div className="flex h-11 items-center overflow-hidden rounded-full border border-muse-input bg-white">
            <button
              type="button"
              onClick={() => handleQtyChange(-1)}
              disabled={isPending}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-[18px] text-muse-text-muted transition hover:bg-muse-cream-deep hover:text-muse-black disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-9 text-center text-[14px] font-bold text-muse-black">
              {displayQuantity}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(1)}
              disabled={isPending}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-[18px] text-muse-text-muted transition hover:bg-muse-cream-deep hover:text-muse-black disabled:opacity-50"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[12px] text-muse-text-muted">
              {formatMoney(unitPrice, currencyCode)} each
            </span>
            <span className="text-[17px] font-extrabold text-muse-black">
              {formatMoney(lineTotal, currencyCode)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending || removing}
        aria-label="Remove item"
        className="absolute right-0 top-[16px] flex h-11 w-11 items-center justify-center rounded-full text-[18px] text-muse-text-light transition hover:bg-muse-orange-soft hover:text-muse-orange disabled:opacity-40"
      >
        ×
      </button>
    </div>
  )
}
