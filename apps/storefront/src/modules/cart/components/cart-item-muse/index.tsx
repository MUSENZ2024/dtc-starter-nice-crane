"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
  const [isPending, startTransition] = useTransition()
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const brand = item.variant?.product?.metadata?.brand as string | undefined
  const fulfilment = getFulfilmentState(item)
  const variantLabel = getVariantLabel(item)
  const unitPrice = item.unit_price ?? 0
  const lineTotal = unitPrice * item.quantity

  function handleQtyChange(delta: number) {
    const next = item.quantity + delta

    if (next < 1) {
      handleRemove()
      return
    }

    startTransition(async () => {
      await updateLineItem({ lineId: item.id, quantity: next })
      router.refresh()
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
        <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-muse-cream-deep to-muse-cream-warm small:h-[112px] small:w-[112px]">
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
          <span className="absolute bottom-[7px] left-[7px] flex items-center gap-1 rounded-full bg-muse-cream/95 px-[9px] py-[3px] text-[9.5px] font-bold uppercase tracking-[0.06em] backdrop-blur">
            <span
              className={`h-[5px] w-[5px] rounded-full ${fulfilment.dotClassName}`}
            />
            {fulfilment.shortLabel}
          </span>
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
          <div className="flex h-[38px] items-center overflow-hidden rounded-full border border-muse-input bg-white">
            <button
              type="button"
              onClick={() => handleQtyChange(-1)}
              disabled={isPending}
              className="flex h-9 w-[38px] flex-shrink-0 items-center justify-center text-[18px] text-muse-text-muted transition hover:bg-muse-cream-deep hover:text-muse-black disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-9 text-center text-[14px] font-bold text-muse-black">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(1)}
              disabled={isPending}
              className="flex h-9 w-[38px] flex-shrink-0 items-center justify-center text-[18px] text-muse-text-muted transition hover:bg-muse-cream-deep hover:text-muse-black disabled:opacity-50"
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
        className="absolute right-0 top-[22px] flex h-[30px] w-[30px] items-center justify-center rounded-full text-[18px] text-muse-text-light transition hover:bg-muse-orange-soft hover:text-muse-orange disabled:opacity-40"
      >
        ×
      </button>
    </div>
  )
}
