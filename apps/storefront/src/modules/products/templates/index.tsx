import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="bg-[#F4F2ED] text-[#1A1A1A]" data-testid="product-container">
      <div className="mx-auto max-w-[1320px] px-[18px] pt-4 text-xs font-medium tracking-[0.03em] text-[#999] small:px-8 small:pt-5">
        <LocalizedClientLink href="/" className="hover:text-[#C1440E]">
          Home
        </LocalizedClientLink>
        <span className="mx-2 opacity-60">&gt;</span>
        <LocalizedClientLink href="/store" className="hover:text-[#C1440E]">
          Shop All
        </LocalizedClientLink>
        <span className="mx-2 opacity-60">&gt;</span>
        <span>{product.title}</span>
      </div>

      <section className="mx-auto grid max-w-[1320px] gap-7 px-[18px] py-4 pb-20 small:grid-cols-[1.15fr_1fr] small:gap-14 small:px-8 small:py-6 small:pb-[72px]">
        <div className="small:sticky small:top-28 small:self-start">
          <ImageGallery images={images} />
        </div>
        <Suspense
          fallback={
            <ProductActions disabled={true} product={product} region={region} />
          }
        >
          <ProductActionsWrapper id={product.id} region={region} />
        </Suspense>
      </section>

      <section className="mx-auto max-w-[1320px] border-t border-[#E8E6E0] px-[18px] py-12 small:px-8 small:py-16">
        <div className="mb-10 flex flex-col gap-8 small:flex-row small:items-start small:justify-between">
          <div className="flex gap-7">
            <div>
              <div className="text-[64px] font-black leading-[0.9] tracking-[-0.04em] text-[#0A0A0A]">
                4.9
              </div>
              <div className="my-2 text-base tracking-[1px] text-[#C1440E]">
                ★★★★★
              </div>
              <div className="text-[12.5px] text-[#666]">47 verified reviews</div>
            </div>
            <div className="min-w-[260px] pt-1">
              {[
                ["5★", "91%", "10"],
                ["4★", "9%", "1"],
                ["3★", "0%", "0"],
                ["2★", "0%", "0"],
                ["1★", "0%", "0"],
              ].map(([label, width, count]) => (
                <div key={label} className="mb-2 flex items-center gap-3 text-xs">
                  <span className="w-6 font-semibold text-[#666]">{label}</span>
                  <span className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#E8E6E0]">
                    <span
                      className="block h-full rounded-full bg-[#C1440E]"
                      style={{ width }}
                    />
                  </span>
                  <span className="w-6 text-right text-[#666]">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="self-start rounded-full border-[1.5px] border-[#0A0A0A] bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-[#0A0A0A] transition hover:bg-[#0A0A0A] hover:text-[#F4F2ED]">
            Write a review
          </button>
        </div>

        <div className="grid gap-4 small:grid-cols-3">
          {[
            ["M", "Marcus K.", "Black", "Size M", "Placeholder review quote. Customer talks about quality, fit, and delivery experience here.", "True to size"],
            ["S", "Sophie L.", "Navy", "Size S", "Placeholder review quote. A second customer shares their experience with the product.", "True to size"],
            ["B", "Brad W.", "Black", "Size L", "Placeholder review quote. A third customer mentions service and would buy again.", "Sized up"],
          ].map(([initial, name, colour, size, quote, fit]) => (
            <article key={name} className="rounded-[20px] bg-[#F8F7F4] p-6">
              <div className="mb-3 flex items-start justify-between">
                <span className="text-[13px] tracking-[1px] text-[#C1440E]">★★★★★</span>
                <span className="rounded-full border border-[#E8E6E0] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.03em] text-[#666]">
                  {fit}
                </span>
              </div>
              <div className="mb-3 flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-[#ECE9E2] to-[#F8F7F4] text-[11px] font-black uppercase tracking-[0.14em] text-black/10">
                Photo
              </div>
              <p className="text-[13.5px] leading-6 text-[#1A1A1A]">{quote}</p>
              <div className="mt-4 flex items-center gap-3 border-t border-[#E8E6E0] pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#ECE9E2] to-[#F4F2ED] text-[13px] font-bold text-[#666]">
                  {initial}
                </div>
                <div>
                  <div className="text-[12.5px] font-bold">
                    {name} <span className="text-[9px] font-black uppercase text-[#1F7A3A]">✓ Verified</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#666]">
                    {colour} · {size}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-7">
          <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-[#666]">
            From the @muse.nz community
          </div>
          <div className="grid grid-cols-3 gap-2.5 small:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex aspect-square items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ECE9E2] to-[#F8F7F4] text-xs font-black uppercase tracking-[0.14em] text-black/10"
              >
                UGC
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductPlaceholderRails />
    </div>
  )
}

const MiniCard = ({
  label,
  badge,
  price,
  rrp,
}: {
  label: string
  badge: "Standard" | "NZ Stock"
  price: string
  rrp?: string
}) => (
  <a
    href="#"
    className="group overflow-hidden rounded-[18px] bg-[#F8F7F4] transition hover:-translate-y-1"
  >
    <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-[#ECE9E2] to-[#F8F7F4] text-[40px] font-black text-black/10">
      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#F4F2ED]/90 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.05em] text-[#1A1A1A]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            badge === "NZ Stock" ? "bg-[#1F7A3A]" : "bg-[#C1440E]"
          }`}
        />
        {badge}
      </span>
      {label}
    </div>
    <div className="px-3.5 pb-4 pt-3">
      <div className="mb-1 text-[12.5px] font-semibold leading-[1.3]">
        Product Name Placeholder
      </div>
      <div className="text-[13px] font-black">
        {price}
        {rrp && (
          <span className="ml-1.5 text-[11px] font-medium text-[#999] line-through">
            {rrp}
          </span>
        )}
      </div>
    </div>
  </a>
)

const ProductPlaceholderRails = () => (
  <>
    <section className="mx-auto max-w-[1320px] px-[18px] pt-6 small:px-8">
      <h2 className="mb-6 text-[24px] font-black tracking-[-0.03em] small:text-[34px]">
        Complete the fit
      </h2>
      <div className="grid grid-cols-2 gap-2.5 small:grid-cols-4 small:gap-4">
        <MiniCard label="06" badge="Standard" price="$120" />
        <MiniCard label="07" badge="NZ Stock" price="$140" />
        <MiniCard label="08" badge="Standard" price="$150" rrp="$299" />
        <MiniCard label="09" badge="NZ Stock" price="$100" />
      </div>
    </section>

    <section className="mx-auto max-w-[1320px] px-[18px] py-12 small:px-8 small:py-14 small:pb-20">
      <h2 className="mb-6 text-[24px] font-black tracking-[-0.03em] small:text-[34px]">
        Recently viewed
      </h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
        <div className="w-40 shrink-0 small:w-[220px]">
          <MiniCard label="10" badge="Standard" price="$180" rrp="$500" />
        </div>
        <div className="w-40 shrink-0 small:w-[220px]">
          <MiniCard label="11" badge="NZ Stock" price="$110" rrp="$160" />
        </div>
        <div className="w-40 shrink-0 small:w-[220px]">
          <MiniCard label="12" badge="Standard" price="$160" />
        </div>
        <div className="w-40 shrink-0 small:w-[220px]">
          <MiniCard label="13" badge="NZ Stock" price="$150" rrp="$250" />
        </div>
        <div className="w-40 shrink-0 small:w-[220px]">
          <MiniCard label="14" badge="Standard" price="$130" />
        </div>
        <div className="w-40 shrink-0 small:w-[220px]">
          <MiniCard label="15" badge="NZ Stock" price="$140" />
        </div>
      </div>
    </section>
  </>
)

export default ProductTemplate
