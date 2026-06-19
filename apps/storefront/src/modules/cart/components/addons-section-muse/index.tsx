"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { addToCart } from "@lib/data/cart"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getProductPrice } from "@lib/util/get-product-price"

type Props = {
  products: HttpTypes.StoreProduct[]
  currencyCode: string
  countryCode: string
}

export default function AddonsSection({
  products,
  currencyCode,
  countryCode,
}: Props) {
  return (
    <div className="mt-7">
      <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muse-text-light">
        Pairs well with
      </p>
      <div className="grid grid-cols-1 gap-3 small:grid-cols-2">
        {products.map((product) => (
          <AddonCard
            key={product.id}
            product={product}
            currencyCode={currencyCode}
            countryCode={countryCode}
          />
        ))}
      </div>
    </div>
  )
}

function AddonCard({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  currencyCode: string
  countryCode: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)
  const { cheapestPrice } = getProductPrice({ product })
  const fulfilment = getFulfilmentState(product)

  function handleAdd() {
    const variant = product.variants?.find(
      (v) => (v.inventory_quantity ?? 0) > 0 || !v.manage_inventory
    )

    if (!variant?.id) return

    startTransition(async () => {
      await addToCart({ variantId: variant.id, quantity: 1, countryCode })
      setAdded(true)
      router.refresh()
      window.setTimeout(() => setAdded(false), 2000)
    })
  }

  const title = product.title || "MUSE product"
  const compactTitle =
    title.length > 22 ? `${title.slice(0, 21).trim()}...` : title

  return (
    <div className="grid grid-cols-[52px_minmax(0,1fr)_40px] items-center gap-3 rounded-[16px] border border-muse-border bg-white px-3 py-3 transition hover:border-muse-black">
      <div className="relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-muse-cream-deep to-muse-cream-warm">
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[18px] font-black text-black/[0.07]">
            {(product.title ?? "").substring(0, 2).toUpperCase()}
          </span>
        )}
        <span className="absolute bottom-1 left-1 flex items-center gap-[3px] rounded-full bg-muse-cream/95 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
          <span
            className={`h-1 w-1 rounded-full ${fulfilment.dotClassName}`}
          />
          {fulfilment.kind === "nz-stock" ? "NZ" : "Std"}
        </span>
      </div>

      <div className="min-w-0 overflow-hidden">
        <p className="mb-1 truncate text-[12.5px] font-bold leading-snug text-muse-black">
          {compactTitle}
        </p>
        <p className="text-[12px] font-extrabold text-muse-text-muted">
          {cheapestPrice?.calculated_price ?? "—"}
        </p>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={isPending || added}
        className={`flex h-10 w-10 items-center justify-center rounded-full pb-[2px] text-[22px] font-bold leading-none transition ${
          added
            ? "bg-muse-green text-white"
            : "bg-muse-black text-muse-cream hover:bg-muse-orange"
        } disabled:opacity-60`}
        aria-label={`Add ${title} to bag`}
      >
        {added ? "✓" : "+"}
      </button>
    </div>
  )
}
