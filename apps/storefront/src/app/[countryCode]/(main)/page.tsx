import { Metadata } from "next"
import { HttpTypes } from "@medusajs/types"

import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCardMuse from "@modules/products/components/product-card-muse"

export const metadata: Metadata = {
  title: "MUSE | Online Store",
  description:
    "Shop footwear, apparel, and everyday essentials from MUSE with secure checkout, tracked delivery, and easy returns.",
}

type Props = {
  params: Promise<{
    countryCode: string
  }>
}

type CategoryCard = {
  title: string
  href: string
  image?: string
  count: number
}

const HOME_PRODUCT_FIELDS =
  "id,title,handle,status,subtitle,thumbnail,*images,*variants,*variants.calculated_price,*variants.options,*options,+metadata,*tags,*categories,*collection,*type"

const getProductImage = (product?: HttpTypes.StoreProduct | null) =>
  product?.thumbnail || product?.images?.[0]?.url || undefined

const getCategoryCards = (
  categories: HttpTypes.StoreProductCategory[],
  products: HttpTypes.StoreProduct[]
): CategoryCard[] => {
  const rootCategories = categories.filter(
    (category) => !category.parent_category_id && category.handle
  )
  const source = rootCategories.length
    ? rootCategories
    : categories.filter((category) => category.handle)

  const backendCategoryCards = source
    .sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0) || a.name.localeCompare(b.name)
    )
    .slice(0, 3)
    .map((category, index) => {
      const categoryProducts = products.filter((product) =>
        product.categories?.some((item) => item.id === category.id)
      )
      const previewProduct = categoryProducts[0] ?? products[index]

      return {
        title: category.name,
        href: `/categories/${category.handle}`,
        image: getProductImage(previewProduct),
        count: categoryProducts.length,
      }
    })

  if (backendCategoryCards.length) {
    return backendCategoryCards
  }

  const productGroups = [
    {
      title: "Footwear",
      href: "/store?category=footwear",
      keywords: ["shoe", "sneaker", "runner", "asics", "onitsuka", "nike"],
    },
    {
      title: "Apparel",
      href: "/store?category=apparel",
      keywords: ["shirt", "short", "sweat", "pants", "tee", "hoodie"],
    },
    {
      title: "Outerwear",
      href: "/store?category=outerwear",
      keywords: ["jacket", "puffer", "coat", "vest"],
    },
  ]

  return productGroups
    .map((group) => {
      const matchedProducts = products.filter((product) => {
        const haystack = [
          product.title,
          product.subtitle,
          product.handle,
          product.type?.value,
          product.collection?.title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return group.keywords.some((keyword) => haystack.includes(keyword))
      })

      return {
        title: group.title,
        href: group.href,
        image: getProductImage(matchedProducts[0]),
        count: matchedProducts.length,
      }
    })
    .filter((group) => group.count > 0)
    .slice(0, 3)
}

export default async function Home(props: Props) {
  const { countryCode } = await props.params

  const [{ response }, categories] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: {
        limit: 12,
        fields: HOME_PRODUCT_FIELDS,
      },
    }).catch(() => ({ response: { products: [], count: 0 } })),
    listCategories().catch(() => []),
  ])

  const products = response.products
  const heroProduct = products[0]
  const heroImage = getProductImage(heroProduct)
  const heroPrice = heroProduct
    ? getProductPrice({ product: heroProduct }).cheapestPrice?.calculated_price
    : undefined
  const heroFulfilment = heroProduct ? getFulfilmentState(heroProduct) : undefined
  const categoryCards = getCategoryCards(categories, products)
  const featuredProducts = products.slice(0, 8)

  return (
    <main className="bg-muse-cream text-muse-black">
      <section className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 small:grid-cols-[0.92fr_1.08fr] small:gap-12 small:px-8 small:py-12">
        <div className="flex min-h-[520px] flex-col justify-center">
          <p className="mb-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muse-text-light">
            <span className="h-px w-8 bg-muse-text-light" />
            New season essentials
          </p>
          <h1 className="max-w-[760px] text-[42px] font-black leading-[0.98] tracking-[-0.045em] xsmall:text-[52px] small:text-[76px]">
            Everyday style, ready to shop.
          </h1>
          <p className="mt-5 max-w-[560px] text-[16px] leading-[1.7] text-muse-text-muted small:text-[18px]">
            Browse the latest footwear, outerwear, and wardrobe staples in one
            place. Simple shopping, secure checkout, and tracked delivery.
          </p>
          <div className="mt-8 flex flex-col gap-3 xsmall:flex-row">
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-[54px] items-center justify-center rounded-[8px] bg-muse-black px-7 text-[12px] font-black uppercase tracking-[0.12em] text-muse-cream transition hover:bg-muse-orange"
            >
              Shop all
            </LocalizedClientLink>
            {categoryCards[0] && (
              <LocalizedClientLink
                href={categoryCards[0].href}
                className="inline-flex h-[54px] items-center justify-center rounded-[8px] border border-muse-black px-7 text-[12px] font-black uppercase tracking-[0.12em] text-muse-black transition hover:bg-white"
              >
                Shop {categoryCards[0].title}
              </LocalizedClientLink>
            )}
          </div>
          <div className="mt-8 grid max-w-[620px] grid-cols-3 gap-3 text-sm">
            {[
              ["Secure", "checkout"],
              ["Tracked", "delivery"],
              ["Easy", "returns"],
            ].map(([title, label]) => (
              <div
                key={title}
                className="border-l border-muse-border pl-4 text-muse-text-muted"
              >
                <p className="font-black text-muse-black">{title}</p>
                <p>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <LocalizedClientLink
          href={heroProduct?.handle ? `/products/${heroProduct.handle}` : "/store"}
          className="group relative block min-h-[520px] overflow-hidden rounded-[8px] bg-muse-cream-deep"
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt={heroProduct?.title ?? "Featured product"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full min-h-[520px] items-center justify-center bg-muse-cream-deep text-[clamp(72px,12vw,150px)] font-black tracking-[-0.06em] text-black/[0.06]">
              MUSE
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(0,0,0,0.45))]" />
          <div className="absolute bottom-5 left-5 right-5 rounded-[8px] bg-white/92 p-5 backdrop-blur">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-muse-orange">
              Featured product
            </p>
            <div className="flex flex-col gap-2 xsmall:flex-row xsmall:items-end xsmall:justify-between">
              <div>
                <h2 className="text-[22px] font-black leading-tight tracking-[-0.025em]">
                  {heroProduct?.title ?? "Shop the latest arrivals"}
                </h2>
                <p className="mt-1 text-sm text-muse-text-muted">
                  {heroFulfilment?.deliveryLabel ?? "Browse current products"}
                </p>
              </div>
              {heroPrice && (
                <p className="text-[20px] font-black text-muse-black">
                  {heroPrice}
                </p>
              )}
            </div>
          </div>
        </LocalizedClientLink>
      </section>

      {categoryCards.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pb-14 small:px-8">
          <SectionHead
            eyebrow="Browse by category"
            title="Find your next piece"
            href="/store"
            link="View all"
          />
          <div className="grid gap-3 small:grid-cols-3">
            {categoryCards.map((category, index) => (
              <LocalizedClientLink
                key={category.href}
                href={category.href}
                className="group relative min-h-[320px] overflow-hidden rounded-[8px] bg-muse-cream-deep"
              >
                {category.image ? (
                  <img
                    src={category.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[64px] font-black tracking-[-0.05em] text-black/[0.06]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,0.58))]" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
                    {category.count || "Shop"} items
                  </p>
                  <h3 className="mt-1 text-[28px] font-black tracking-[-0.03em]">
                    {category.title}
                  </h3>
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1440px] px-5 pb-16 small:px-8">
        <SectionHead
          eyebrow="Featured products"
          title="Popular right now"
          href="/store"
          link="Shop all"
        />
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 small:grid-cols-4 small:gap-4">
            {featuredProducts.map((product, index) => (
              <ProductCardMuse
                key={product.id}
                product={product}
                countryCode={countryCode}
                position={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-muse-border bg-muse-cream-warm px-6 py-14 text-center">
            <h2 className="text-2xl font-black tracking-[-0.03em]">
              Products are being added.
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-muse-text-muted">
              Once products are published in Medusa, they will appear here
              automatically.
            </p>
          </div>
        )}
      </section>

      <section className="border-y border-muse-border bg-muse-cream-warm">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-14 small:grid-cols-[0.8fr_1.2fr] small:px-8 small:py-18">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muse-text-light">
              Why shop here
            </p>
            <h2 className="mt-2 max-w-[440px] text-[34px] font-black leading-[1.05] tracking-[-0.035em] small:text-[48px]">
              A straightforward online store.
            </h2>
          </div>
          <div className="grid gap-3 xsmall:grid-cols-2">
            {[
              [
                "Current products",
                "The homepage uses products published in your Medusa store.",
              ],
              [
                "Clear delivery labels",
                "Shipping messaging follows each product's fulfilment state.",
              ],
              [
                "Fast product discovery",
                "Categories and featured items point shoppers straight to buying.",
              ],
              [
                "Secure checkout",
                "Customers can move from product discovery into the existing cart flow.",
              ],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-[8px] border border-muse-border bg-muse-cream p-5"
              >
                <h3 className="font-black tracking-[-0.01em]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muse-text-muted">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 small:px-8">
        <div className="grid gap-5 rounded-[8px] bg-muse-black p-7 text-muse-cream small:grid-cols-[1fr_auto] small:items-center small:p-10">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muse-yellow">
              Stay updated
            </p>
            <h2 className="mt-2 text-[30px] font-black leading-tight tracking-[-0.035em] small:text-[42px]">
              New arrivals, restocks, and offers.
            </h2>
          </div>
          <LocalizedClientLink
            href="/store"
            className="inline-flex h-[54px] items-center justify-center rounded-[8px] bg-muse-yellow px-7 text-[12px] font-black uppercase tracking-[0.12em] text-muse-black transition hover:bg-muse-yellow-deep"
          >
            Browse products
          </LocalizedClientLink>
        </div>
      </section>
    </main>
  )
}

function SectionHead({
  eyebrow,
  title,
  link,
  href,
}: {
  eyebrow: string
  title: string
  link: string
  href: string
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 small:mb-8 small:flex-row small:items-end small:justify-between">
      <div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-muse-text-light">
          {eyebrow}
        </p>
        <h2 className="text-[30px] font-black leading-tight tracking-[-0.035em] small:text-[44px]">
          {title}
        </h2>
      </div>
      <LocalizedClientLink
        href={href}
        className="text-[12px] font-black uppercase tracking-[0.12em] text-muse-black underline decoration-muse-black/30 underline-offset-4 transition hover:decoration-muse-black"
      >
        {link}
      </LocalizedClientLink>
    </div>
  )
}
