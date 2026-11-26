import ProductReviews from "@modules/products/components/product-reviews"
import React from "react"
import BostonProduct, { BostonColour } from "@modules/products/components/boston-product"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RecentlyViewedProducts from "@modules/products/components/recently-viewed-products"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { isProductOutOfStock } from "@lib/util/product-availability"
import { getProductPrice } from "@lib/util/get-product-price"
import CompleteTheFit from "@modules/products/components/complete-the-fit"
import ProductCardMuse, { ProductCardMuseProduct } from "@modules/products/components/product-card-muse"
import Image from "next/image"
import RealProofSection from "../../../app/[countryCode]/(main)/real-proof-section"
import {
  MUSE_REVIEW_SUMMARY,
} from "@modules/products/data/reviews"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  campaignProducts?: HttpTypes.StoreProduct[]
  bostonColours?: BostonColour[]
}

const ProductTemplate = async ({
  product,
  region,
  countryCode: _countryCode,
  images,
  campaignProducts,
  bostonColours,
}: ProductTemplateProps) => {
  if (!product || !product.id) {
    return notFound()
  }

  const { cheapestPrice } = getProductPrice({ product })
  const fulfilment = getFulfilmentState(product)
  const outOfStock = isProductOutOfStock(product)
  const saleCompareAt =
    cheapestPrice?.price_type === "sale" &&
    cheapestPrice.original_price_number > cheapestPrice.calculated_price_number
      ? cheapestPrice.original_price
      : null

  return (
    <div
      className={`muse-product-restyle min-w-0 overflow-x-clip bg-white text-[#1A1A1A] ${campaignProducts ? "muse-tnf-campaign-pdp" : ""}`}
      data-testid="product-container"
    >
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

      {campaignProducts && (
        <section className="muse-tnf-campaign-banner mx-auto mt-4 grid max-w-[1320px] overflow-hidden border border-muse-border small:mx-8 small:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col items-start justify-center px-5 py-5 small:px-8">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muse-green">
              The North Face · MUSE NZ
            </p>
            <h1 className="mt-2 text-[clamp(24px,4vw,38px)] font-black uppercase leading-none tracking-[-0.045em] text-muse-black">
              End of season sale
            </h1>
            <p className="mt-2 text-sm font-extrabold uppercase text-muse-orange">
              Jackets now {cheapestPrice?.calculated_price}
            </p>
          </div>
          <div className="relative hidden min-h-[130px] bg-muse-cream small:block">
            <Image
              src="/campaigns/tnf-end-of-season/hero.jpg"
              alt="Nuptse jackets and vest in the end of season sale"
              fill
              priority
              sizes="280px"
              className="object-cover object-center"
            />
          </div>
        </section>
      )}

      {bostonColours ? <BostonProduct key={product.id} colours={bostonColours} region={region} initialProductId={product.id} /> : (
      <section className="muse-product-layout mx-auto grid min-w-0 max-w-[1440px] gap-7 px-[18px] py-4 pb-20 small:grid-cols-[1.5fr_1fr] small:gap-10 small:px-8 small:py-6 small:pb-[72px]">
        <div className="min-w-0 small:sticky small:top-28 small:self-start">
          <ImageGallery
            images={images}
            fulfilment={fulfilment}
            outOfStock={outOfStock}
            productTitle={product.title}
            colourImageMap={
              (product.metadata?.colour_image_map as
                | Record<string, string>
                | undefined) ?? undefined
            }
          />
        </div>
          <ProductActions
            product={product}
            region={region}
            campaignWinterSeason={Boolean(campaignProducts)}
          />
      </section>
      )}

      {campaignProducts && campaignProducts.length > 0 && (
        <section className="muse-tnf-campaign-items mx-auto max-w-[1320px] border-t border-muse-border px-[18px] py-10 small:px-8 small:py-14">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 small:flex-row small:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muse-green">
                More colours &amp; styles online
              </p>
              <h2 className="mt-2 text-[clamp(26px,4vw,42px)] font-black uppercase leading-[0.96] tracking-[-0.045em] text-muse-black">
                View other end of season items
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 small:grid-cols-3 small:gap-4">
            {campaignProducts.map((item, index) => {
              const itemPrice = getProductPrice({ product: item }).cheapestPrice
              const itemFulfilment = getFulfilmentState(item)
              const productCard: ProductCardMuseProduct = {
                id: item.id,
                title: item.title || "The North Face Nuptse",
                handle: item.handle,
                thumbnail: item.thumbnail,
                images: item.images,
                brand: "THE NORTH FACE",
                price: itemPrice?.calculated_price,
                compareAt:
                  itemPrice?.price_type === "sale" &&
                  itemPrice.original_price_number > itemPrice.calculated_price_number
                    ? itemPrice.original_price
                    : undefined,
                fulfilment: {
                  shortLabel: itemFulfilment.shortLabel,
                  dotClassName: itemFulfilment.dotClassName,
                  deliveryLabel: itemFulfilment.deliveryLabel,
                },
                options: item.options?.map((option) => ({
                  id: option.id,
                  title: option.title,
                })),
                variants: item.variants?.map((variant) => ({
                  id: variant.id,
                  inventory_quantity: variant.inventory_quantity,
                  manage_inventory: variant.manage_inventory,
                  allow_backorder: variant.allow_backorder,
                  options: variant.options?.map((option) => ({
                    option_id: option.option_id,
                    value: option.value,
                    option:
                      "option" in option && option.option
                        ? { title: option.option.title }
                        : undefined,
                  })),
                })),
              }

              return (
                <ProductCardMuse
                  key={item.id}
                  product={productCard}
                  countryCode={_countryCode}
                  position={index + 1}
                />
              )
            })}
          </div>
        </section>
      )}

      <React.Suspense fallback={<section id="reviews" className="mx-auto max-w-[1320px] px-[18px] py-12 small:px-8" aria-label="Loading reviews"><p className="text-sm text-[#666]">{MUSE_REVIEW_SUMMARY.average}/5 · {MUSE_REVIEW_SUMMARY.total} verified reviews</p></section>}>
        <ProductReviews product={product} bostonColours={Boolean(bostonColours)} campaignProducts={Boolean(campaignProducts)} />
      </React.Suspense>

      <RealProofSection />

      {campaignProducts && (
        <section
          id="tnf-campaign-faq"
          className="muse-tnf-campaign-faq mx-auto max-w-[1320px] border-t border-muse-border px-[18px] py-12 small:px-8 small:py-16"
          aria-labelledby="tnf-campaign-faq-title"
        >
          <div className="mb-6 max-w-[760px]">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muse-green">
              Before you order
            </p>
            <h2
              id="tnf-campaign-faq-title"
              className="mt-2 text-[clamp(28px,4vw,44px)] font-black uppercase leading-[0.96] tracking-[-0.045em] text-muse-black"
            >
              The North Face jacket FAQs
            </h2>
            <p className="mt-3 text-sm leading-6 text-muse-text-muted">
              Clear answers about MUSE, UA products, delivery and returns.
            </p>
          </div>

          <div className="divide-y divide-muse-border border-y border-muse-border">
            <details className="muse-tnf-faq-item">
              <summary>
                <span>What is MUSE NZ?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="muse-tnf-faq-answer">
                <p>MUSE NZ is an Auckland-based online store for premium footwear and outerwear. We source products from overseas manufacturing partners and check each item at our Auckland workspace.</p>
                <ul>
                  <li>We ship across New Zealand with NZ Post.</li>
                  <li>We price our products to reflect how they are made, without official brand authorisation or licensing.</li>
                </ul>
              </div>
            </details>

            <details className="muse-tnf-faq-item">
              <summary>
                <span>Are MUSE products authentic? What does UA mean?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="muse-tnf-faq-answer">
                <p>These items are listed as <strong>Unauthorized Authentic (UA)</strong>. They use the same materials and construction methods as official retail versions, and in many cases come from the same factories.</p>
                <ul>
                  <li>Manufacturers make them without the brand’s authorisation or licensing.</li>
                  <li>The brands have not endorsed or licensed these products.</li>
                  <li>We check every item before dispatch from Auckland. The price excludes the brand licensing and retail costs built into official retail pricing.</li>
                </ul>
                <p>Read more on our <LocalizedClientLink href="/faq" className="underline underline-offset-2">FAQ page</LocalizedClientLink>.</p>
              </div>
            </details>

            <details className="muse-tnf-faq-item">
              <summary>
                <span>How can I check that MUSE NZ is a legitimate store?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="muse-tnf-faq-answer">
                <p>You can check our business, payment and delivery details before ordering:</p>
                <ul>
                  <li>MUSE is based in Auckland and operates under New Zealand law.</li>
                  <li>Stripe processes payments. We do not store your card details.</li>
                  <li>We send NZ Post tracking details when your order dispatches.</li>
                  <li>Read customer reviews on our website and Instagram, and review our 30-day returns policy.</li>
                </ul>
                <p>Contact <a href="mailto:support@musenz.com">support@musenz.com</a> with any questions. We aim to reply within 12–24 hours, Monday to Friday.</p>
              </div>
            </details>

            <details className="muse-tnf-faq-item">
              <summary>
                <span>How long will delivery take for my jacket?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="muse-tnf-faq-answer">
                <p>This jacket ships by Standard Delivery. Allow around 13–16 business days from your order to arrival in New Zealand.</p>
                <ul>
                  <li>Weekends and New Zealand public holidays do not count as business days.</li>
                  <li>Your order is tracked throughout the journey. NZ Post delivers the final leg, and your tracking link shows the latest estimated delivery date.</li>
                  <li>Delivery dates are estimates. Courier delays, customs and peak periods can affect arrival times.</li>
                </ul>
              </div>
            </details>

            <details className="muse-tnf-faq-item">
              <summary>
                <span>Can I exchange or return my jacket?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="muse-tnf-faq-answer">
                <p>Email <a href="mailto:support@musenz.com">support@musenz.com</a> within 7 business days of receiving your order. Include your order number and reason for the request.</p>
                <ul>
                  <li>Once we approve your request, return the item within 30 days of delivery.</li>
                  <li>Keep the item unworn and in brand-new condition. Return it with the original box undamaged and all included accessories.</li>
                  <li>We can exchange the size for the same item, subject to stock. We refund to your original payment method after we receive and check the item.</li>
                  <li>You pay return postage for change-of-mind returns and size exchanges. We cover reasonable return costs for faulty or incorrect items. Your rights under New Zealand consumer law still apply.</li>
                </ul>
                <p>Read the full <LocalizedClientLink href="/faq" className="underline underline-offset-2">returns information</LocalizedClientLink> before sending anything back.</p>
              </div>
            </details>

            <details className="muse-tnf-faq-item">
              <summary>
                <span>How do I contact MUSE NZ?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="muse-tnf-faq-answer">
                <p>Email <a href="mailto:support@musenz.com">support@musenz.com</a> for order help. Include your order number so we can look it up.</p>
                <ul>
                  <li>We aim to reply within 12–24 hours, Monday to Friday. Weekend and public holiday replies may take longer.</li>
                  <li>For general questions or product requests, message <a href="https://instagram.com/muse.nz" target="_blank" rel="noreferrer">@muse.nz on Instagram</a>.</li>
                </ul>
              </div>
            </details>
          </div>
        </section>
      )}

      <React.Suspense
        fallback={
          <section
            className="mx-auto max-w-[1320px] px-[18px] pt-6 small:px-8"
            aria-label="Loading recommendations"
          >
            <div className="h-9 w-56 animate-pulse rounded bg-[#E8E6E0]" />
            <div className="mt-6 grid grid-cols-2 gap-2.5 small:grid-cols-4 small:gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[4/5] animate-pulse rounded-[16px] bg-[#E8E6E0]"
                />
              ))}
            </div>
          </section>
        }
      >
        <CompleteTheFit product={product} countryCode={_countryCode} />
      </React.Suspense>

      <RecentlyViewedProducts
        product={{
          id: product.id,
          title: product.title || "MUSE product",
          handle: product.handle,
          image: product.thumbnail || product.images?.[0]?.url,
          price: cheapestPrice?.calculated_price,
          compareAt: saleCompareAt,
          badge: fulfilment.shortLabel,
        }}
      />
    </div>
  )
}

export default ProductTemplate
