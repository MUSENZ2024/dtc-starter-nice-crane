import { RetailBenefits, RetailEditorial, RetailCategories } from "@modules/home/components/retail-sections"
import DeliveryBadge from "@modules/products/components/delivery-badge"
import { Metadata } from "next"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { listProductTags } from "@lib/data/product-tags"
import { listProductTypes } from "@lib/data/product-types"
import { getDeliveredByLabel } from "@lib/util/delivery-estimate"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getProductPrice } from "@lib/util/get-product-price"
import { getProductColourSwatches } from "@lib/util/product-colours"
import { isProductOutOfStock } from "@lib/util/product-availability"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SavedToggle from "@modules/saved/components/saved-toggle"
import {
  allWrittenMuseReviews,
  MUSE_REVIEW_SUMMARY,
} from "@modules/products/data/reviews"

import DropCountdown from "./drop-countdown"
import InstagramFeed from "./instagram-feed"
import NuptseSlideshow from "./nuptse-slideshow"
import RealProofSection from "./real-proof-section"
import OpenMarketingDialogButton from "@modules/marketing/components/open-marketing-dialog-button"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  title: "Affordable Sneakers, Shoes & Streetwear",
  description:
    "Shop affordable sneakers, discounted shoes, retro runners, puffers and streetwear at MUSE NZ, with NZ Stock and tracked delivery across New Zealand.",
  alternates: {
    canonical: "/",
  },
}

type Props = {
  params: Promise<{
    countryCode: string
  }>
}

type HomeCard = {
  id: string
  title: string
  price: string
  compareAt?: string
  badge: string
  href: string
  image?: string | null
  hoverImage?: string | null
  placeholder: string
  eta: string
  colours: { label: string; hex: string }[]
  outOfStock: boolean
}

const FEATURED_REVIEWS = allWrittenMuseReviews
  .filter((review) => review.rating === 5)
  .slice(0, 3)

const FEATURED_BLACK_NUPTSE_HANDLE = "nuptse-jacket-black"
const BEST_SELLER_TAG = "best-seller"
const NZ_STOCK_ORGANIZATION_VALUE = "NZ Stock"

const getPrimaryImage = (product?: HttpTypes.StoreProduct | null) =>
  product?.thumbnail || product?.images?.[0]?.url || null

const getHoverImage = (product?: HttpTypes.StoreProduct | null) => {
  const primaryImage = getPrimaryImage(product)

  return (
    product?.images?.find((image) => image.url && image.url !== primaryImage)
      ?.url || null
  )
}

const getCardFromProduct = (
  product: HttpTypes.StoreProduct,
  index: number,
  deliveryLabel: string
): HomeCard => {
  const { cheapestPrice } = getProductPrice({ product })
  const fulfilment = getFulfilmentState(product)

  return {
    title: product.title || "MUSE product",
    id: product.id,
    price: cheapestPrice?.calculated_price || "NZ$180",
    compareAt:
      cheapestPrice?.original_price &&
      cheapestPrice.original_price !== cheapestPrice.calculated_price
        ? cheapestPrice.original_price
        : undefined,
    badge: fulfilment.shortLabel,
    href: `/products/${product.handle}`,
    image: getPrimaryImage(product),
    hoverImage: getHoverImage(product),
    placeholder: String(index + 1).padStart(2, "0"),
    eta: fulfilment.deliveryLabel || deliveryLabel,
    colours: getProductColourSwatches(product),
    outOfStock: isProductOutOfStock(product),
  }
}

export default async function Home(props: Props) {
  const { countryCode } = await props.params
  const deliveryLabel = getDeliveredByLabel()
  const baseUrl = getBaseURL()
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${baseUrl}/#organization`,
    name: "MUSE NZ",
    alternateName: "MUSE",
    url: baseUrl,
    logo: `${baseUrl}/muse-logo-long.png`,
    image: `${baseUrl}/opengraph-image`,
    description:
      "New Zealand online store for affordable sneakers, shoes, puffers and streetwear.",
    areaServed: {
      "@type": "Country",
      name: "New Zealand",
    },
    sameAs: [
      "https://www.instagram.com/muse.nz/",
      "https://www.facebook.com/musenz/",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@musenz.com",
      areaServed: "NZ",
      availableLanguage: "English",
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      merchantReturnLink: `${baseUrl}/terms`,
      applicableCountry: "NZ",
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 30,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
  }
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "MUSE NZ",
    alternateName: "MUSE New Zealand",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    inLanguage: "en-NZ",
  }
  const fallbackPuffer: HomeCard = {
    id: "home-fallback-puffer",
    title: "TNF 1996 Retro Nuptse - Black",
    price: "NZ$180",
    badge: "Standard",
    href: `/products/${FEATURED_BLACK_NUPTSE_HANDLE}`,
    placeholder: "01",
    eta: deliveryLabel,
    colours: [],
    outOfStock: false,
  }

  const [bestSellerTag, collectionsResult, productTypesResult] =
    await Promise.all([
      listProductTags({
        limit: "1",
        value: BEST_SELLER_TAG,
      })
        .then(({ product_tags }) => product_tags[0])
        .catch(() => undefined),
      listCollections().catch(() => ({ collections: [], count: 0 })),
      listProductTypes({
        limit: "1",
        value: NZ_STOCK_ORGANIZATION_VALUE,
      }).catch(() => ({ product_types: [], count: 0 })),
    ])

  const nzStockCollection = collectionsResult.collections.find(
    (collection) =>
      collection.title?.trim().toLowerCase() ===
        NZ_STOCK_ORGANIZATION_VALUE.toLowerCase() ||
      collection.handle?.trim().toLowerCase() === "nz-stock"
  )
  const nzStockProductType = productTypesResult.product_types[0]

  const [
    bestSellerProducts,
    nzStockCollectionProducts,
    nzStockTypeProducts,
    featuredBlackNuptseProducts,
    nuptseProducts,
  ] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: {
        limit: 24,
        ...(bestSellerTag?.id ? { tag_id: [bestSellerTag.id] } : {}),
        order: "updated_at",
        fields:
          "id,title,handle,thumbnail,*images,*collection,*type,*options,*variants.options,*tags,+metadata,*variants.calculated_price",
      },
      revalidateSeconds: 300,
    })
      .then(({ response }) => response.products)
      .then((products) => (bestSellerTag ? products : []))
      .catch(() => []),
    nzStockCollection?.id
      ? listProducts({
          countryCode,
          queryParams: {
            limit: 24,
            collection_id: [nzStockCollection.id],
            order: "updated_at",
            fields:
              "id,title,handle,thumbnail,*images,*collection,*type,*options,*variants.options,*tags,+metadata,*variants.calculated_price",
          },
          revalidateSeconds: 300,
        })
          .then(({ response }) => response.products)
          .catch(() => [])
      : Promise.resolve([]),
    nzStockProductType?.id
      ? listProducts({
          countryCode,
          queryParams: {
            limit: 24,
            type_id: [nzStockProductType.id],
            order: "updated_at",
            fields:
              "id,title,handle,thumbnail,*images,*collection,*type,*options,*variants.options,*tags,+metadata,*variants.calculated_price",
          },
          revalidateSeconds: 300,
        })
          .then(({ response }) => response.products)
          .catch(() => [])
      : Promise.resolve([]),
    listProducts({
      countryCode,
      queryParams: {
        limit: 1,
        handle: FEATURED_BLACK_NUPTSE_HANDLE,
        fields: "id,title,handle,thumbnail,*images,*variants.calculated_price",
      },
      revalidateSeconds: 300,
    })
      .then(({ response }) => response.products)
      .catch(() => []),
    listProducts({
      countryCode,
      queryParams: {
        limit: 12,
        q: "nuptse",
        fields: "id,title,handle,thumbnail",
      },
      revalidateSeconds: 300,
    })
      .then(({ response }) => response.products)
      .catch(() => []),
  ])

  const nuptseSlides = nuptseProducts
    .flatMap((product) => {
      const image = getPrimaryImage(product)
      return image ? [{ src: image, title: product.title ?? "" }] : []
    })
    .slice(0, 12)

  const puffer = featuredBlackNuptseProducts[0]

  const featuredCard = puffer
    ? getCardFromProduct(puffer, 0, deliveryLabel)
    : fallbackPuffer
  const productCards = [
    ...bestSellerProducts.map((product, index) =>
      getCardFromProduct(product, index, deliveryLabel)
    ),
  ]
  const nzStockProducts = Array.from(
    new Map(
      [...nzStockCollectionProducts, ...nzStockTypeProducts].map((product) => [
        product.id,
        product,
      ])
    ).values()
  )
  const nzStockCards = nzStockProducts
    .slice(0, 6)
    .map((product, index) => getCardFromProduct(product, index, deliveryLabel))

  return (
    <div className="muse-home-restyle bg-white text-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd, websiteJsonLd]),
        }}
      />
      <a
        href="#bestsellers"
        className="flex min-h-10 items-center justify-center bg-[#C1440E] px-4 py-2 text-center text-[12px] font-medium tracking-[0.06em] text-white"
      >
        Spring rotation: trending footwear, now at MUSE
      </a>

      <section className="grid min-h-[620px] bg-[#F4F2ED] small:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col justify-center px-[18px] py-12 small:px-[clamp(48px,7vw,112px)] small:py-20">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C1440E]">
            The spring rotation
          </p>
          <h1 className="max-w-[760px] font-condensed text-[clamp(48px,7vw,98px)] font-normal uppercase leading-[0.92] tracking-[-0.035em]">
            Trending <span className="text-[#C1440E]">now.</span>
            <br />
            Priced for MUSE.
          </h1>
          <p className="mt-6 max-w-[580px] text-[16px] leading-[1.6] text-[#6F6B66] small:text-[18px]">
            Affordable sneakers, shoes and streetwear with tracked delivery and
            real support from MUSE NZ.
          </p>
          <div className="mt-8 grid max-w-[470px] grid-cols-2 gap-2.5">
            <LocalizedClientLink
              href="/categories/footwear"
              className="inline-flex min-h-[50px] items-center justify-center border border-[#0A0A0A] bg-[#0A0A0A] px-4 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C1440E] hover:bg-[#C1440E] small:px-7 small:text-[12px]"
            >
              Shop footwear
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store?stock=nz-stock"
              className="inline-flex min-h-[50px] items-center justify-center border border-[#0A0A0A] bg-transparent px-4 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#0A0A0A] transition hover:bg-white small:px-7 small:text-[12px]"
            >
              Shop NZ Stock
            </LocalizedClientLink>
          </div>
        </div>

        <LocalizedClientLink
          href="/collections/spring-rotation"
          className="relative block min-h-[440px] overflow-hidden bg-[#EBE4D7] small:min-h-[620px]"
        >
          <Image
            src="/campaigns/spring-rotation/artboard-1.jpg"
            alt="Selection of trending footwear in the MUSE Spring Rotation"
            fill
            priority
            quality={75}
            sizes="(max-width: 1023px) 100vw, 42vw"
            className="object-cover"
          />
          <span className="absolute right-5 top-5 bg-[#C8D050] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0A0A0A]">
            New campaign
          </span>
        </LocalizedClientLink>
      </section>

      <RetailBenefits />

      <section
        id="bestsellers"
        className="mx-auto mb-20 max-w-[1320px] px-[18px] small:px-8"
      >
        <SectionHead
          eyebrow="What's moving"
          title="Best sellers this month"
          link="View all →"
          href="/store?badge=best-seller"
        />
        <div className="grid grid-cols-2 gap-2.5 small:grid-cols-4 small:gap-4">
          {productCards.map((product) => (
            <ProductCard
              key={`${product.placeholder}-${product.href}`}
              product={product}
            />
          ))}
        </div>
      </section>

      <RetailEditorial />
      <RetailCategories />

      <section
        id="drops"
        className="mx-auto mb-20 max-w-[1320px] px-[18px] small:px-8"
      >
        <div className="relative flex overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#2A2A2A,#0A0A0A)] p-7 text-[#F4F2ED] small:aspect-[16/7] small:items-center small:rounded-[32px] small:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(200,208,80,0.18),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(193,68,14,0.15),transparent_60%)]" />
          <div className="relative z-[1] max-w-[520px] flex-1">
            <p className="mb-3.5 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8D050] before:h-2 before:w-2 before:rounded-full before:bg-[#C8D050]">
              Drop closes soon
            </p>
            <h2 className="mb-4 text-[32px] font-extrabold leading-[0.98] tracking-[-0.035em] small:text-[56px]">
              The Nuptse Winter Drop
            </h2>
            <p className="mb-7 max-w-[460px] text-[16px] leading-[1.6] text-[#CCC]">
              Nine colourways. Standard delivery in 13-16 days. Lock yours in
              before the batch closes.
            </p>
            <DropCountdown />
            <LocalizedClientLink
              href={featuredCard.href}
              className="inline-block rounded-full bg-[#C8D050] px-8 py-4 text-[13px] font-extrabold uppercase tracking-[0.1em] text-[#0A0A0A]"
            >
              Shop the drop
            </LocalizedClientLink>
          </div>
          <div className="relative z-[1] hidden flex-1 items-center justify-end pl-16 small:flex">
            <NuptseSlideshow
              images={nuptseSlides.map((slide) => slide.src)}
              titles={nuptseSlides.map((slide) => slide.title)}
            />
          </div>
        </div>
      </section>

      <section className="mx-[18px] mb-14 max-w-[1320px] rounded-[24px] bg-[#FDF4EF] px-7 py-12 small:mx-auto small:mb-20 small:rounded-[32px] small:px-14 small:py-20">
        <div className="grid gap-8 small:grid-cols-[0.9fr_1.1fr] small:items-start small:gap-16">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C1440E]">
              Real talk
            </p>
            <h2 className="mb-4 text-[28px] font-normal uppercase leading-[1.05] tracking-[-0.025em] small:text-[42px]">
              Why our prices are different
            </h2>
            <p className="text-[15.5px] leading-[1.65] text-[#666]">
              You might have noticed our prices sit lower than traditional
              retail. That&apos;s because our products are UA / replica pieces,
              sourced through trusted manufacturing partners rather than
              official retail channels.
              <br />
              <br />
              We&apos;re upfront about that because we&apos;d rather keep things
              clear from the start. You&apos;re not paying retail markup,
              brand-store pricing, or extra overheads - you&apos;re paying for a
              product that gives you the look and feel you want at a more
              accessible price.
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {[
              [
                "UA / replica products.",
                "Our items are not sold as official retail pairs and are not affiliated with, authorised by, or endorsed by the original brands.",
              ],
              [
                "No heavy retail markup.",
                "We source through trusted partners instead of traditional retail channels, helping us keep prices more accessible.",
              ],
              [
                "Every order is checked before it ships.",
                "Before anything leaves our Auckland workspace, we inspect it properly so it's ready to go.",
              ],
              [
                "30-day money-back guarantee.",
                "Not happy with your order? Send it back within 30 days for a refund.",
              ],
              [
                "Real support from real people.",
                "Email us, DM us on Instagram, or reply to your order updates. We actually read and respond.",
              ],
            ].map(([bold, text]) => (
              <li
                key={bold}
                className="flex items-start gap-4 text-[14.5px] leading-[1.55] text-[#333]"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C1440E] text-[13px] font-extrabold text-white">
                  ✓
                </span>
                <span>
                  <strong className="text-[#0A0A0A]">{bold}</strong> {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {nzStockCards.length > 0 && (
        <section
          id="nz-stock"
          className="mx-auto mb-20 max-w-[1320px] px-[18px] small:px-8"
        >
          <SectionHead
            eyebrow="NZ Stock"
            title="Fast shipping, stocked in NZ."
            link="View all →"
            href="/store?stock=nz-stock"
            green
          />
          <div className="no-scrollbar -mx-[18px] flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-[18px] pb-3 small:mx-0 small:gap-4 small:px-0">
            {nzStockCards.map((product) => (
              <div
                key={`${product.placeholder}-${product.href}`}
                className="w-[calc((100vw-46px)/2)] shrink-0 snap-start small:w-[calc((100%-48px)/4)]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      <RealProofSection />

      <section className="mx-auto mb-20 max-w-[1320px] rounded-[32px] bg-[#F8F7F4] px-6 py-12 small:px-10 small:py-16">
        <div className="mb-9 flex flex-col gap-4 small:flex-row small:items-end small:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
              Reviews
            </p>
            <h2 className="mt-2 text-[34px] font-black leading-[0.98] tracking-[-0.045em] small:text-[52px]">
              Verified reviews from MUSE customers.
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-6xl font-black tracking-[-0.06em]">
              {MUSE_REVIEW_SUMMARY.average.toFixed(1)}
            </p>
            <div>
              <p className="text-[#C1440E]">★★★★★</p>
              <p className="text-sm font-semibold text-[#666]">
                {MUSE_REVIEW_SUMMARY.total} verified reviews
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 small:grid-cols-3">
          {FEATURED_REVIEWS.map((review) => (
            <div key={review.id} className="rounded-[22px] bg-[#F4F2ED] p-6">
              <p className="text-sm tracking-[0.08em] text-[#C1440E]">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </p>
              <p className="mt-4 min-h-[96px] text-[14.5px] leading-7 text-[#333]">
                “{review.text}”
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-[#E8E6E0] pt-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#E8E6E0] text-sm font-black text-[#666]">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black">
                    {review.name}{" "}
                    <span className="text-[10px] uppercase tracking-[0.08em] text-[#1F7A3A]">
                      verified
                    </span>
                  </p>
                  <p className="text-xs text-[#777]">{review.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-[1320px] px-[18px] text-center small:px-8">
        <div className="mb-9">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#999]">
            Latest on Instagram
          </p>
          <h2 className="text-[28px] font-extrabold tracking-[-0.03em] small:text-[40px]">
            Fresh from @muse.nz
          </h2>
          <p className="mt-2 text-sm text-[#666]">
            Latest posts, fit checks, drops, and customer updates from{" "}
            <a
              href="https://www.instagram.com/muse.nz/"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[#C1440E]"
            >
              @muse.nz
            </a>
          </p>
        </div>
        <InstagramFeed />
        <a
          href="https://www.instagram.com/muse.nz/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-[58px] items-center justify-center rounded-full border-2 border-[#0A0A0A] px-8 text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A]"
        >
          Follow @muse.nz
        </a>
      </section>

      <section className="mx-auto mb-24 max-w-[1320px] px-[18px] small:px-8">
        <div className="overflow-hidden rounded-[32px] bg-[#0A0A0A] px-6 py-12 text-center text-[#F4F2ED] small:px-12 small:py-16">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C8D050]">
            Drop access
          </p>
          <h2 className="mx-auto mt-3 max-w-[680px] text-[34px] font-black leading-[1] tracking-[-0.045em] small:text-[48px]">
            Get first access to your next pair.
          </h2>
          <OpenMarketingDialogButton />
          <p className="mt-4 text-xs text-white/50">
            Plus $20 off your first order over $150. Terms apply.
          </p>
        </div>
      </section>
    </div>
  )
}

function SectionHead({
  eyebrow,
  title,
  link,
  href,
  green,
}: {
  eyebrow: string
  title: string
  link: string
  href: string
  green?: boolean
}) {
  return (
    <div className="mb-6 flex flex-col items-start gap-4 small:mb-9 small:flex-row small:items-end small:justify-between">
      <div>
        <p
          className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            green ? "text-[#1F7A3A]" : "text-[#999]"
          }`}
        >
          {green && (
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#1F7A3A]" />
          )}
          {eyebrow}
        </p>
        <h2 className="text-[28px] font-normal uppercase leading-[1.05] tracking-[-0.03em] small:text-[44px]">
          {title}
        </h2>
      </div>
      <LocalizedClientLink
        href={href}
        className="border-b-2 border-[#0A0A0A] pb-0.5 text-[13px] font-extrabold uppercase tracking-[0.04em]"
      >
        {link}
      </LocalizedClientLink>
    </div>
  )
}

function ProductCard({ product }: { product: HomeCard }) {
  return (
    <div className="group overflow-hidden rounded-[22px] bg-[#F8F7F4] transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#E8E6E0,#F8F7F4_50%,#E8E6E0)]">
        <LocalizedClientLink href={product.href} className="absolute inset-0">
          <div className="absolute inset-[30%] rounded-full bg-white/40 blur-[40px]" />
          {product.image ? (
            <>
              <Image
                src={product.image}
                alt={product.title}
                fill
                quality={60}
                sizes="(max-width: 767px) calc((100vw - 46px) / 2), 25vw"
                className={`relative z-[1] object-cover transition duration-500 ${
                  product.hoverImage
                    ? "motion-safe:group-hover:opacity-0"
                    : "motion-safe:group-hover:scale-105"
                }`}
              />
              {product.hoverImage && (
                <Image
                  src={product.hoverImage}
                  alt=""
                  aria-hidden="true"
                  fill
                  quality={60}
                  sizes="(max-width: 767px) calc((100vw - 46px) / 2), 25vw"
                  className="pointer-events-none relative z-[1] object-cover opacity-0 transition duration-500 motion-safe:group-hover:scale-105 motion-safe:group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <span className="relative z-[1] flex h-full items-center justify-center text-[42px] font-extrabold uppercase tracking-[-0.04em] text-black/[0.08] small:text-[64px]">
              {product.placeholder}
            </span>
          )}
          {product.outOfStock && (
            <span className="absolute left-9 top-3 z-[3] rounded-full bg-[#0A0A0A] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#F4F2ED]">
              Out of stock
            </span>
          )}
          <DeliveryBadge label={product.badge} />
        </LocalizedClientLink>
        <SavedToggle
          item={{
            id: product.id,
            title: product.title,
            href: product.href,
            image: product.image,
            price: product.price,
            compareAt: product.compareAt,
            badge: product.badge,
            eta: product.eta,
          }}
          className="absolute right-3 top-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F2ED]/90 text-[#0A0A0A] backdrop-blur transition hover:scale-105 aria-pressed:text-[#C1440E]"
          label="Save to saved items"
        />
      </div>
      <LocalizedClientLink
        href={product.href}
        className="block px-3.5 pb-3.5 pt-3 small:px-[18px] small:pb-[18px]"
      >
        <p className="mb-1 text-[13.5px] font-semibold leading-[1.3] text-[#0A0A0A]">
          {product.title}
        </p>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-[15px] font-extrabold text-[#0A0A0A]">
            {product.price}
          </span>
          {product.compareAt && (
            <span className="text-[12px] font-bold text-[#999] line-through">
              {product.compareAt}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#777]">{product.eta}</p>
        {product.colours.length > 1 && (
          <div className="mt-2 flex gap-1.5" aria-label="Available colours">
            {product.colours.slice(0, 8).map(({ label, hex }) => (
              <span
                key={label}
                title={label}
                aria-label={label}
                className="h-2.5 w-2.5 rounded-full border border-black/15"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}
      </LocalizedClientLink>
    </div>
  )
}
