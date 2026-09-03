import { listProducts } from "@lib/data/products"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCardMuse, {
  ProductCardMuseProduct,
} from "@modules/products/components/product-card-muse"
import { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Find Your Spring Rotation",
  description:
    "The pairs defining the season: low-profile runners, silver finishes, technical trail shoes and everyday neutrals, curated by MUSE NZ.",
  alternates: {
    canonical: "/collections/spring-rotation",
  },
  openGraph: {
    title: "Find Your Spring Rotation | MUSE NZ",
    description:
      "A curated spring edit of low-profile runners, silver finishes, technical trail shoes and everyday neutrals.",
    images: ["/campaigns/spring-rotation/artboard-1.jpg"],
  },
}

const FEATURED_HANDLES = [
  "asics-onitsuka-tiger-mexico-66-silver-off-white",
  "salomon-xt-6-light-pink",
  "new-balance-204l-lunar-new-year-linen-shadow-red-u204l8ov",
  "adidas-handball-spezial-earth-strata-gum",
  "new-balance-204l-mushroom-arid-stone-u204lmma",
  "new-balance-204l-cortado-stone-pink-u204l273",
  "salomon-xt-6-white-footwear-silver",
  "dr-martens-adrian-smooth-leather-tassel-loafers-black",
] as const

const toProductCard = (
  product: HttpTypes.StoreProduct
): ProductCardMuseProduct => {
  const fulfilment = getFulfilmentState(product)
  const { cheapestPrice } = getProductPrice({ product })

  return {
    id: product.id,
    title: product.title || "MUSE product",
    handle: product.handle,
    thumbnail: product.thumbnail,
    images: product.images,
    brand:
      typeof product.metadata?.brand === "string"
        ? product.metadata.brand
        : undefined,
    price: cheapestPrice?.calculated_price,
    fulfilment: {
      shortLabel: fulfilment.shortLabel,
      dotClassName: fulfilment.dotClassName,
      deliveryLabel: fulfilment.deliveryLabel,
    },
    options: product.options?.map((option) => ({
      id: option.id,
      title: option.title,
    })),
    variants: product.variants?.map((variant) => ({
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
}

export default async function SpringRotationPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const { response } = await listProducts({
    countryCode,
    queryParams: {
      handle: [...FEATURED_HANDLES],
      limit: FEATURED_HANDLES.length,
    },
  })
  const productByHandle = new Map(
    response.products.map((product) => [product.handle, product])
  )
  const products = FEATURED_HANDLES.map((handle) =>
    productByHandle.get(handle)
  ).filter((product): product is HttpTypes.StoreProduct => Boolean(product))

  return (
    <main className="muse-spring-restyle min-h-screen bg-white font-inter text-muse-black">
      <section className="content-container pb-6 pt-4 small:pb-8 small:pt-8">
        <div className="muse-spring-hero">
          <div className="muse-spring-art">
          <Image
            src="/campaigns/spring-rotation/artboard-1.jpg"
            alt="The shoes featured in the MUSE spring rotation"
            fill
            priority
            quality={75}
            sizes="(max-width: 1023px) 28vw, 50vw"
            className="object-cover object-center"
          />
          </div>
          <div className="muse-spring-copy">
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-muse-orange">
              MUSE seasonal edit · Spring 2026
            </p>
            <h1>
              Find Your Spring Rotation
            </h1>
            <p className="mt-5 max-w-[520px] text-[16px] leading-7 text-muse-text-muted">
              The pairs defining the season. Low-profile runners, silver
              finishes, technical trail shoes and everyday neutrals—curated
              for your spring rotation.
            </p>
            <LocalizedClientLink
              href="#shop-the-rotation"
              className="mt-7 inline-flex min-h-12 items-center justify-center bg-muse-black px-6 py-3 text-[12px] font-medium uppercase tracking-[0.08em] text-white transition hover:bg-muse-orange"
            >
              Shop the rotation
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      <section
        id="shop-the-rotation"
        className="content-container scroll-mt-24 pb-14 small:pb-24"
      >
        <div className="mb-7 flex items-end justify-between gap-5 small:mb-9">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-muse-text-muted">
              {products.length} styles · One spring edit
            </p>
            <h2 className="text-[clamp(30px,5vw,58px)] font-black uppercase leading-[0.9] tracking-[-0.05em]">
              Shop the rotation
            </h2>
          </div>
          <span className="hidden rounded-full bg-muse-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-muse-yellow small:inline-flex">
            Curated by MUSE
          </span>
        </div>

        <p className="mb-5 max-w-[650px] text-sm leading-6 text-muse-text-muted">
          Compare prices in NZD and delivery estimates below. Open a pair for
          its size guide, more photos, and full product details.
        </p>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 small:grid-cols-4 small:gap-4">
            {products.map((product, index) => (
              <ProductCardMuse
                key={product.id}
                product={toProductCard(product)}
                countryCode={countryCode}
                position={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] bg-muse-cream-warm px-6 py-16 text-center">
            <h2 className="text-[20px] font-black tracking-tight">
              The rotation is being refreshed
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-muse-text-muted">
              One or more featured pairs are currently unavailable. Browse the
              full MUSE range while the edit is updated.
            </p>
            <LocalizedClientLink
              href="/store"
              className="mt-6 inline-flex min-h-12 items-center rounded-full bg-muse-black px-6 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-muse-cream"
            >
              Shop all styles
            </LocalizedClientLink>
          </div>
        )}
      </section>

      <section className="content-container pb-10 small:pb-16" aria-labelledby="spring-shopping-help">
        <h2 id="spring-shopping-help" className="mb-5">Before you choose your pair</h2>
        <div className="muse-spring-help">
          <details>
            <summary>Which size should I choose?</summary>
            <p>Open the product page to view its size options and size guide before adding your pair to the bag.</p>
          </details>
          <details>
            <summary>When will my pair arrive?</summary>
            <p>Each product shows its delivery estimate and fulfilment label. NZ Stock and Standard Delivery can have different timings. Check your selected pair before ordering.</p>
            <LocalizedClientLink href="/faq">Delivery questions</LocalizedClientLink>
          </details>
          <details>
            <summary>Returns or a question before ordering?</summary>
            <p>Check the returns terms and exclusions before buying, or ask MUSE support if you need help choosing.</p>
            <LocalizedClientLink href="/faq">Read the FAQ and returns information</LocalizedClientLink>
            <a href="mailto:support@musenz.com">Email MUSE support</a>
          </details>
        </div>
      </section>

      <section className="content-container pb-16 small:pb-24">
        <div className="overflow-hidden rounded-[24px] bg-muse-black px-6 py-8 text-muse-cream small:grid small:grid-cols-[1fr_auto] small:items-center small:gap-8 small:px-10 small:py-10">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muse-yellow">
              Ready when you are
            </p>
            <h2 className="mt-2 text-[30px] font-black uppercase leading-none tracking-[-0.04em] small:text-[44px]">
              Make it your rotation
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-muse-cream/65">
              NZD pricing · Tracked delivery · NZ-based support
            </p>
          </div>
          <a
            href="#shop-the-rotation"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-muse-yellow px-6 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-muse-black transition hover:bg-muse-yellow-deep small:mt-0"
          >
            Shop the rotation
          </a>
        </div>
      </section>
    </main>
  )
}
