"use client"

import { useCartDrawer } from "@lib/context/cart-drawer-context"
import { addToCart } from "@lib/data/cart"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useState, useTransition } from "react"

type Props = {
  product: HttpTypes.StoreProduct
  countryCode: string
  deliveryLabel: string
  priority?: boolean
}

const isSizeOption = (title?: string | null) =>
  (title ?? "").toLowerCase() === "size"

const variantInStock = (variant: HttpTypes.StoreProductVariant) => {
  if (!variant.manage_inventory || variant.allow_backorder) {
    return true
  }

  return (variant.inventory_quantity ?? 0) > 0
}

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

const getVariantChoices = (product: HttpTypes.StoreProduct) => {
  const variants = product.variants?.filter(variantInStock) ?? []
  const choices = new Map<string, HttpTypes.StoreProductVariant>()

  variants.forEach((variant) => {
    const label = getVariantSize(variant, product) ?? "One size"

    if (!choices.has(label)) {
      choices.set(label, variant)
    }
  })

  return Array.from(choices.entries()).map(([label, variant]) => ({
    label,
    variant,
  }))
}

export default function CompleteTheFitCard({
  product,
  countryCode,
  deliveryLabel,
  priority = false,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { openDrawer } = useCartDrawer()
  const { cheapestPrice } = getProductPrice({ product })
  const choices = getVariantChoices(product)
  const hasQuickAdd = choices.length > 0
  const fulfilment = getFulfilmentState(product)
  const rrp =
    typeof product.metadata?.rrp_nzd === "string"
      ? `NZ$${product.metadata.rrp_nzd}`
      : undefined

  const addVariant = (variant: HttpTypes.StoreProductVariant) => {
    if (!variant.id) {
      return
    }

    startTransition(async () => {
      await addToCart({ variantId: variant.id, quantity: 1, countryCode })
      setAddedVariantId(variant.id)
      setPickerOpen(false)
      openDrawer()
      window.setTimeout(() => setAddedVariantId(null), 1800)
    })
  }

  return (
    <article className="group overflow-hidden rounded-[18px] bg-[#F8F7F4] transition hover:-translate-y-1">
      <div className="relative">
        <LocalizedClientLink href={`/products/${product.handle}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-[#ECE9E2]">
            {product.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                loading={priority ? "eager" : "lazy"}
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[32px] font-black text-black/10">
                MUSE
              </div>
            )}
          </div>
        </LocalizedClientLink>

        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#F4F2ED]/90 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.05em] text-[#1A1A1A] backdrop-blur">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              fulfilment.labelColor === "green" ? "bg-[#1F7A3A]" : "bg-[#C1440E]"
            }`}
          />
          {fulfilment.shortLabel}
        </span>

        {hasQuickAdd ? (
          <button
            type="button"
            onClick={() => {
              if (choices.length === 1) {
                addVariant(choices[0].variant)
                return
              }

              setPickerOpen((current) => !current)
            }}
            disabled={isPending}
            className="absolute bottom-2.5 left-2.5 right-2.5 rounded-full bg-[#0A0A0A] px-3 py-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-[#F4F2ED] transition hover:bg-[#C1440E] disabled:opacity-70"
          >
            {addedVariantId ? "Added" : choices.length === 1 ? "Add to bag" : "Quick add"}
          </button>
        ) : null}

        {pickerOpen ? (
          <div className="absolute inset-x-2.5 bottom-2.5 rounded-[14px] bg-[#0A0A0A]/95 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                Select size
              </span>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-lg leading-none text-white/60"
                aria-label="Close size picker"
              >
                x
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {choices.map(({ label, variant }) => (
                <button
                  key={variant.id ?? label}
                  type="button"
                  disabled={isPending}
                  onClick={() => addVariant(variant)}
                  className="min-w-0 rounded-lg border border-white/20 px-1 py-2 text-center text-[10.5px] font-bold leading-none text-[#F4F2ED] transition hover:border-[#C8D050] hover:bg-[#C8D050] hover:text-[#0A0A0A] disabled:opacity-60"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="block px-3.5 pb-4 pt-3"
      >
        <div className="mb-1 line-clamp-2 min-h-[34px] text-[12.5px] font-semibold leading-[1.35]">
          {product.title}
        </div>
        {cheapestPrice ? (
          <div className="text-[13px] font-black">
            {cheapestPrice.calculated_price}
            {rrp ? (
              <span className="ml-1.5 text-[11px] font-medium text-[#999] line-through">
                {rrp}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className="mt-1.5 text-[11px] font-medium text-[#666]">
          {hasQuickAdd ? "In stock" : "View sizes"} - {deliveryLabel}
        </p>
      </LocalizedClientLink>
    </article>
  )
}
