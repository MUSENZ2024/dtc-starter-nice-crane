"use client"

import { useCartDrawer } from "@lib/context/cart-drawer-context"
import { addToCart } from "@lib/data/cart"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SavedToggle from "@modules/saved/components/saved-toggle"
import { useState, useTransition } from "react"

type Props = {
  product: HttpTypes.StoreProduct
  countryCode: string
  position: number
}

const isSizeOption = (title?: string | null) =>
  (title ?? "").toLowerCase() === "size"

const getVariantSize = (
  variant: HttpTypes.StoreProductVariant,
  product: HttpTypes.StoreProduct
) => {
  const sizeOptionId = product.options?.find((option) =>
    isSizeOption(option.title)
  )?.id

  const sizeValue = variant.options?.find((option) => {
    const nestedTitle =
      "option" in option
        ? (option.option as { title?: string } | undefined)?.title
        : undefined

    return (
      isSizeOption(nestedTitle) ||
      (sizeOptionId && option.option_id === sizeOptionId)
    )
  })?.value

  if (sizeValue) {
    return sizeValue
  }

  const optionValues =
    variant.options
      ?.map((option) => option.value)
      .filter((value): value is string => Boolean(value)) ?? []

  if (optionValues.length === 1 && optionValues[0].toLowerCase() !== "one") {
    return optionValues[0]
  }

  return undefined
}

const variantInStock = (variant: HttpTypes.StoreProductVariant) => {
  if (!variant.manage_inventory || variant.allow_backorder) {
    return true
  }

  return (variant.inventory_quantity ?? 0) > 0
}

export default function ProductCardMuse({
  product,
  countryCode,
  position,
}: Props) {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { openDrawer } = useCartDrawer()
  const { cheapestPrice } = getProductPrice({ product })
  const fulfilment = getFulfilmentState(product)
  const brand =
    typeof product.metadata?.brand === "string" ? product.metadata.brand : undefined
  const rrp =
    typeof product.metadata?.rrp_nzd === "string"
      ? product.metadata.rrp_nzd
      : undefined
  const sizes = getSizes(product)
  const hasSizes = sizes.length > 0

  const handleQuickAdd = (size: string) => {
    const variant =
      product.variants?.find(
        (item) => getVariantSize(item, product) === size && variantInStock(item)
      ) ?? product.variants?.find(variantInStock)

    if (!variant?.id) {
      return
    }

    startTransition(async () => {
      await addToCart({
        variantId: variant.id,
        quantity: 1,
        countryCode,
      })
      setQuickAddOpen(false)
      openDrawer()
    })
  }

  return (
    <div className="group relative overflow-hidden rounded-[20px] bg-muse-cream-warm transition duration-200 hover:-translate-y-[5px] hover:shadow-[0_18px_36px_rgba(0,0,0,0.08)]">
      <div className="relative">
        <div className="absolute left-3 top-3 z-[2] flex flex-col items-start gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muse-cream/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-muse-black backdrop-blur">
            <span
              className={`h-[7px] w-[7px] rounded-full ${
                fulfilment.dotClassName
              }`}
            />
            {fulfilment.shortLabel}
          </span>
          {position === 1 && (
            <span className="rounded-full bg-muse-yellow px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-muse-black">
              Bestseller
            </span>
          )}
          {rrp && (
            <span className="rounded-full bg-muse-orange px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-white">
              Sale
            </span>
          )}
        </div>

        <LocalizedClientLink href={`/products/${product.handle}`} className="block">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.5),transparent_55%),linear-gradient(135deg,var(--muse-cream-deep),var(--muse-cream-warm)_55%,var(--muse-cream-deep))]">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <span className="text-[clamp(40px,6vw,64px)] font-black tracking-[-0.04em] text-black/[0.07]">
                {String(position).padStart(2, "0")}
              </span>
            )}
          </div>
        </LocalizedClientLink>

        <SavedToggle
          item={{
            id: product.id,
            title: product.title || "MUSE product",
            handle: product.handle,
            href: product.handle ? `/products/${product.handle}` : "/store",
            image: product.thumbnail,
            price: cheapestPrice?.calculated_price,
            compareAt: rrp ? `$${rrp} RRP` : undefined,
            badge: fulfilment.shortLabel,
            eta: fulfilment.deliveryLabel,
          }}
          className="absolute right-3 top-3 z-[3] flex h-9 w-9 items-center justify-center rounded-full bg-muse-cream/95 text-muse-black backdrop-blur transition hover:scale-105 aria-pressed:text-muse-orange"
          label="Save to saved items"
        />

        <button
          type="button"
          onClick={() => setQuickAddOpen((current) => !current)}
          className="absolute bottom-3 left-3 right-3 z-[2] rounded-full bg-muse-black px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-muse-cream opacity-100 transition hover:bg-muse-orange small:translate-y-2 small:opacity-0 small:group-hover:translate-y-0 small:group-hover:opacity-100"
        >
          {hasSizes ? "+ Quick add" : "Add to bag"}
        </button>

        {quickAddOpen && (
          <div className="absolute inset-x-3 bottom-3 z-[3] rounded-[14px] bg-muse-black/95 p-3 backdrop-blur">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                Select size
              </span>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="text-xl leading-none text-white/50"
                aria-label="Close size picker"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(hasSizes ? sizes : [{ label: "One", inStock: true }]).map(
                ({ label, inStock }) => (
                  <button
                    key={label}
                    type="button"
                    disabled={!inStock || isPending}
                    onClick={() => handleQuickAdd(label)}
                    className={`min-w-0 rounded-lg border px-1 py-2 text-center text-[11px] font-bold leading-none transition ${
                      inStock
                        ? "border-white/20 text-muse-cream hover:border-muse-yellow hover:bg-muse-yellow hover:text-muse-black"
                        : "cursor-not-allowed border-white/10 text-white/20 line-through"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="block px-4 pb-4 pt-3"
      >
        {brand && (
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-muse-text-muted">
            {brand}
          </p>
        )}
        <p className="mb-1.5 line-clamp-2 text-[13.5px] font-semibold leading-snug text-muse-black">
          {product.title}
        </p>
        <div className="mb-1.5 flex items-baseline gap-2">
          {cheapestPrice && (
            <span className="text-[15px] font-extrabold text-muse-black">
              {cheapestPrice.calculated_price}
            </span>
          )}
          {rrp && (
            <span className="text-[12px] text-muse-text-light line-through">
              ${rrp} RRP
            </span>
          )}
        </div>
        <p className="text-[11px] text-muse-text-muted">
          {fulfilment.deliveryLabel}
        </p>
        <div className="mt-2 flex gap-1">
          {sizes.slice(0, 8).map(({ label, inStock, low }) => (
            <span
              key={label}
              title={label}
              className={`h-1.5 w-1.5 rounded-full ${
                low
                  ? "bg-muse-orange"
                  : inStock
                  ? "bg-muse-black"
                  : "bg-muse-border"
              }`}
            />
          ))}
        </div>
      </LocalizedClientLink>
    </div>
  )
}

function getSizes(product: HttpTypes.StoreProduct) {
  const sizeValues = new Map<string, { label: string; inStock: boolean; low: boolean }>()

  product.variants?.forEach((variant) => {
    const label = getVariantSize(variant, product)

    if (!label) {
      return
    }

    const quantity = variant.inventory_quantity ?? 0
    const inStock = variantInStock(variant)
    const current = sizeValues.get(label)

    sizeValues.set(label, {
      label,
      inStock: current?.inStock || inStock,
      low: current?.low || (inStock && quantity > 0 && quantity <= 3),
    })
  })

  return Array.from(sizeValues.values())
}
