"use client"

import { useEffect, useState } from "react"
import optimizedImages from "@modules/products/data/boston-optimized-images.json"
import BostonDuoBuilder, { BostonOfferSwitch } from "./duo-builder"
import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { isProductOutOfStock } from "@lib/util/product-availability"

export type BostonColour = { label: string; swatch: string; product?: HttpTypes.StoreProduct }

export default function BostonProduct({ colours, region, initialProductId }: { colours: BostonColour[]; region: HttpTypes.StoreRegion; initialProductId?: string }) {
  const [selected, setSelected] = useState(() => Math.max(0, colours.findIndex(colour => initialProductId ? colour.product?.id === initialProductId : colour.label === "Taupe")))
  // All product data is already available. Warm colour hero images in idle
  // time, respecting reduced-data connections, instead of fetching on click.
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") return
    let cancelled = false
    const preload = () => {
      for (const colour of colours) {
        if (cancelled) return
        const url = colour.product?.images?.[0]?.url ?? colour.product?.thumbnail
        const source = url ? (optimizedImages as Record<string, { small: string; large: string }>)[url] : undefined
        if (source) {
          const image = new window.Image()
          image.fetchPriority = "low"
          image.src = window.innerWidth <= 640 ? source.small : source.large
        }
      }
    }
    const handle = window.requestIdleCallback ? window.requestIdleCallback(preload) : window.setTimeout(preload, 500)
    return () => {
      cancelled = true
      if (window.cancelIdleCallback) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [colours])
  const [duo, setDuo] = useState(true)
  const colour = colours[selected]
  const product = colour.product
  const colourSelector = <><BostonOfferSwitch duo={false} onChange={setDuo} /><div className="mb-5 scroll-mt-28" aria-label="Boston colours">
    <div className="mb-3 flex items-baseline justify-between">
      <span className="text-xs font-bold uppercase tracking-[0.12em]">Colour</span>
      <span className="text-[13px] font-medium text-[#666]">{colour.label}</span>
    </div>
    <div className="flex flex-wrap gap-2.5">
      {colours.map((item, index) => <button
        key={item.label} type="button" aria-label={`Select ${item.label}`}
        aria-pressed={selected === index} title={item.label} onClick={() => setSelected(index)}
        className={`relative h-10 w-10 rounded-none border-2 transition ${selected === index ? "border-[#0A0A0A]" : "border-transparent"}`}
        style={{ background: item.swatch }}>
      </button>)}
    </div>
  </div></>
  return <section className="mx-auto max-w-[1440px] px-[18px] py-6 small:px-8">
    <div className="muse-product-layout grid min-w-0 gap-7 small:grid-cols-[1.5fr_1fr] small:gap-10">
      <div className="min-w-0 small:sticky small:top-28 small:self-start">
        {product && (product.images?.length || product.thumbnail) ? <ImageGallery optimizedImages={optimizedImages} key={product.id} images={product.images?.length ? product.images : product.thumbnail ? [{ id: product.id, url: product.thumbnail, rank: 0 }] : []} productTitle={product.title} fulfilment={getFulfilmentState(product)} outOfStock={isProductOutOfStock(product)} /> : <div className="grid aspect-square place-content-center bg-[#F4F2ED] px-6 text-center" aria-live="polite"><h2 className="text-2xl font-bold">{colour.label}</h2><p className="mt-3 text-sm">{product ? "Photos coming soon." : "Photos and availability coming soon."}</p></div>}
      </div>
      <div>

        {product ? <ProductActions
          product={product} region={region} productDetailsDefaultOpen={false}
          colourSelector={colourSelector}
          offerPrice={duo ? 270 : undefined}
          purchaseConfigurator={duo ? <>
            <BostonOfferSwitch duo={duo} onChange={setDuo} />
            <BostonDuoBuilder colours={colours} initialColour={selected} onPreviewColour={setSelected} />
          </> : undefined}
        /> : <>{colourSelector}<p className="text-sm text-[#555]">Choose another colour to view available sizes.</p></>}
      </div>
    </div>
  </section>
}
