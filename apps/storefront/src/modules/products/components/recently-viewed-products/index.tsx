"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

type RecentlyViewedProduct = {
  id: string
  title: string
  handle?: string | null
  image?: string | null
  price?: string | null
  compareAt?: string | null
  badge?: "Standard" | "NZ Stock"
}

const STORAGE_KEY = "muse_recently_viewed_products"
const MAX_ITEMS = 8

export default function RecentlyViewedProducts({
  product,
}: {
  product: RecentlyViewedProduct
}) {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([])

  useEffect(() => {
    let storedItems: RecentlyViewedProduct[] = []

    try {
      storedItems = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    } catch {
      storedItems = []
    }

    const deduped = storedItems.filter((item) => item.id !== product.id)
    const nextItems = [product, ...deduped].slice(0, MAX_ITEMS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
    setItems(deduped.slice(0, MAX_ITEMS - 1))
  }, [product])

  const visibleItems = useMemo(
    () => items.filter((item) => item.id !== product.id && item.handle),
    [items, product.id]
  )

  if (!visibleItems.length) {
    return null
  }

  return (
    <section className="mx-auto max-w-[1320px] px-[18px] py-12 small:px-8 small:py-14 small:pb-20">
      <h2 className="mb-6 text-[24px] font-black tracking-[-0.03em] small:text-[34px]">
        Recently viewed
      </h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
        {visibleItems.map((item) => (
          <LocalizedClientLink
            key={item.id}
            href={`/products/${item.handle}`}
            className="group w-40 shrink-0 overflow-hidden rounded-[14px] bg-[#F8F7F4] transition hover:-translate-y-1 small:w-[220px]"
          >
            <div className="relative aspect-square overflow-hidden bg-[#ECE9E2]">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 768px) 220px, 160px"
                  loading="lazy"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[28px] font-black text-black/10">
                  MUSE
                </div>
              )}
              <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#F4F2ED]/90 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.05em] text-[#1A1A1A]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    item.badge === "NZ Stock" ? "bg-[#1F7A3A]" : "bg-[#C1440E]"
                  }`}
                />
                {item.badge ?? "Standard"}
              </span>
            </div>
            <div className="px-3.5 pb-4 pt-3">
              <div className="mb-1 line-clamp-2 text-[12.5px] font-semibold leading-[1.3]">
                {item.title}
              </div>
              {item.price && (
                <div className="text-[13px] font-black">
                  {item.price}
                  {item.compareAt && (
                    <span className="ml-1.5 text-[11px] font-medium text-[#999] line-through">
                      {item.compareAt}
                    </span>
                  )}
                </div>
              )}
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
