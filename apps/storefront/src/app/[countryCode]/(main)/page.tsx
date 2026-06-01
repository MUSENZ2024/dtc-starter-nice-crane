import { Metadata } from "next"
import { HttpTypes } from "@medusajs/types"

import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "MUSE NZ | Retro Puffers & Runners",
  description:
    "Retro puffers and runners curated for NZ, with Standard Delivery, live tracking, and 30-day money back support.",
}

type Props = {
  params: Promise<{
    countryCode: string
  }>
}

type HomeCard = {
  title: string
  price: string
  compareAt?: string
  badge: string
  href: string
  image?: string | null
  placeholder?: string
}

const FALLBACK_PUFFER: HomeCard = {
  title: "1996 Retro Puffer Jacket - Black",
  price: "NZ$180",
  compareAt: "NZ$500",
  badge: "Standard Delivery",
  href: "/products/1996-retro-puffer-jacket-black",
  placeholder: "01",
}

const PLACEHOLDER_CARDS: HomeCard[] = [
  {
    title: "Retro Runner - Sea Salt",
    price: "NZ$160",
    compareAt: "NZ$280",
    badge: "Coming soon",
    href: "/store",
    placeholder: "02",
  },
  {
    title: "Everyday Court Sneaker - Grey",
    price: "NZ$150",
    compareAt: "NZ$240",
    badge: "Drop preview",
    href: "/store",
    placeholder: "03",
  },
  {
    title: "Puffer Vest - Navy",
    price: "NZ$145",
    compareAt: "NZ$260",
    badge: "Winter preview",
    href: "/store",
    placeholder: "04",
  },
]

const HOW_STEPS = [
  [
    "01",
    "Pick your piece",
    "Choose your colour and size before checkout. Clear NZD pricing, no mystery fees.",
  ],
  [
    "02",
    "We source & inspect",
    "Your order is checked by our overseas partner before it moves into transit.",
  ],
  [
    "03",
    "Ships to New Zealand",
    "Standard Delivery usually lands in 13-16 days with tracked movement.",
  ],
  [
    "04",
    "NZ Post final mile",
    "Once it arrives in New Zealand, NZ Post handles the final delivery to you.",
  ],
]

const REVIEWS = [
  [
    "R",
    "Ranen",
    "Auckland",
    "The price made me unsure at first, but tracking was clear and the jacket arrived exactly like the photos.",
  ],
  [
    "S",
    "Sarah",
    "Hamilton",
    "Way warmer than I expected. The delivery updates helped because I knew when it landed in New Zealand.",
  ],
  [
    "J",
    "Jayden",
    "Wellington",
    "Easy checkout, clean sizing, and the puffer looks proper. Would buy another colour.",
  ],
]

const NZ_STOCK_PLACEHOLDERS = [
  ["01", "Fast-moving sizes", "NZ Stock module placeholder"],
  ["02", "Footwear drop", "Coming after import"],
  ["03", "Outerwear restock", "Coming after import"],
]

const getPrimaryImage = (product?: HttpTypes.StoreProduct | null) =>
  product?.thumbnail || product?.images?.[0]?.url || null

const getCardFromProduct = (product: HttpTypes.StoreProduct): HomeCard => {
  const { cheapestPrice } = getProductPrice({ product })

  return {
    title: product.title || "MUSE Product",
    price: cheapestPrice?.calculated_price || "NZ$180",
    compareAt:
      cheapestPrice?.original_price &&
      cheapestPrice.original_price !== cheapestPrice.calculated_price
        ? cheapestPrice.original_price
        : "NZ$500",
    badge: "Standard Delivery",
    href: `/products/${product.handle}`,
    image: getPrimaryImage(product),
  }
}

export default async function Home(props: Props) {
  const { countryCode } = await props.params

  const products = await listProducts({
    countryCode,
    queryParams: {
      limit: 4,
      q: "puffer",
      fields: "id,title,handle,thumbnail,*images,*variants.calculated_price",
    },
  })
    .then(({ response }) => response.products)
    .catch(() => [])

  const puffer =
    products.find((product) =>
      `${product.title} ${product.handle}`.toLowerCase().includes("puffer")
    ) || products[0]

  const featuredCard = puffer ? getCardFromProduct(puffer) : FALLBACK_PUFFER
  const productCards = [
    featuredCard,
    ...products
      .filter((product) => product.id !== puffer?.id)
      .slice(0, 3)
      .map(getCardFromProduct),
    ...PLACEHOLDER_CARDS,
  ].slice(0, 4)

  const heroImage = featuredCard.image

  return (
    <main className="bg-[#F4F2ED] text-[#0A0A0A]">
      <section className="mx-auto grid max-w-[1320px] gap-10 px-[18px] py-10 small:grid-cols-[0.9fr_1.1fr] small:px-8 small:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
            Winter drop · live now
          </p>
          <h1 className="max-w-[680px] text-[48px] font-black leading-[0.9] tracking-[-0.065em] small:text-[84px]">
            The Nuptse. Finally priced like a jacket,{" "}
            <span className="italic text-[#C1440E]">not a flex.</span>
          </h1>
          <p className="mt-6 max-w-[560px] text-[15px] leading-7 text-[#555] small:text-[17px]">
            Retro puffers and runners curated for NZ. Same silhouette, same
            winter-ready feel, none of the licensed retail markup. Standard
            Delivery, live tracking, and 30-day money back support.
          </p>
          <div className="mt-8 flex flex-col gap-3 xsmall:flex-row">
            <LocalizedClientLink
              href={featuredCard.href}
              className="inline-flex h-14 items-center justify-center rounded-full bg-[#0A0A0A] px-8 text-[12px] font-black uppercase tracking-[0.14em] text-[#F4F2ED] transition hover:bg-[#C1440E]"
            >
              Shop Nuptse $180
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-14 items-center justify-center rounded-full border border-[#D8D4C9] bg-white px-8 text-[12px] font-black uppercase tracking-[0.14em] text-[#0A0A0A] transition hover:border-[#0A0A0A]"
            >
              Shop all
            </LocalizedClientLink>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3 text-[13px] text-[#666]">
            <span className="tracking-[0.08em] text-[#C1440E]">★★★★★</span>
            <span>
              <strong className="text-[#0A0A0A]">4.9</strong> from{" "}
              <strong className="text-[#0A0A0A]">47 verified reviews</strong>
            </span>
            <span className="hidden text-[#999] xsmall:inline">·</span>
            <span>247 sold this season</span>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[0.98] overflow-hidden rounded-[34px] bg-[#E8E3D6] shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
            {heroImage ? (
              <img
                src={heroImage}
                alt={featuredCard.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#2A2A2A,#0A0A0A)] text-[clamp(90px,16vw,190px)] font-black tracking-[-0.08em] text-white/10">
                MUSE
              </div>
            )}
            <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#0A0A0A] shadow-sm backdrop-blur">
              Standard Delivery
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-[24px] bg-white/88 p-5 shadow-xl backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C1440E]">
                Featured · Standard Delivery
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <p className="max-w-[360px] text-2xl font-black leading-7 tracking-[-0.04em]">
                  {featuredCard.title}
                </p>
                <p className="rounded-full bg-[#0A0A0A] px-4 py-2 text-sm font-black text-[#C8D050]">
                  {featuredCard.price}
                </p>
              </div>
              <p className="mt-2 text-xs font-semibold text-[#666]">
                Ships in 13-16 days · tracked end-to-end
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-[1320px] px-[18px] small:px-8">
        <div className="grid overflow-hidden rounded-[26px] bg-[#0A0A0A] text-[#F4F2ED] xsmall:grid-cols-2 small:grid-cols-4">
          {[
            ["4.9★", "verified rating"],
            ["47", "verified reviews"],
            ["13-16", "days to your door"],
            ["30-day", "money back"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-b border-white/10 p-6 last:border-b-0 xsmall:border-r xsmall:last:border-r-0 small:border-b-0"
            >
              <p className="text-4xl font-black tracking-[-0.05em] text-[#C8D050]">
                {value}
              </p>
              <p className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/50">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-[1320px] px-[18px] small:px-8">
        <div className="mb-8 flex flex-col gap-3 small:flex-row small:items-end small:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
              Best sellers
            </p>
            <h2 className="mt-2 text-[34px] font-black leading-[0.98] tracking-[-0.045em] small:text-[52px]">
              Built for the first click.
            </h2>
          </div>
          <LocalizedClientLink
            href="/store"
            className="text-[12px] font-black uppercase tracking-[0.14em] underline decoration-2 underline-offset-8"
          >
            View all products
          </LocalizedClientLink>
        </div>

        <div className="grid grid-cols-2 gap-3 small:grid-cols-4 small:gap-4">
          {productCards.map((product) => (
            <ProductCard key={`${product.title}-${product.href}`} product={product} />
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto mb-20 max-w-[1320px] px-[18px] small:px-8">
        <div className="rounded-[32px] bg-[#0A0A0A] px-6 py-12 text-[#F4F2ED] small:px-12 small:py-16">
          <div className="mb-10 max-w-[620px]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C8D050]">
              How MUSE works
            </p>
            <h2 className="mt-3 text-[34px] font-black leading-[0.98] tracking-[-0.045em] small:text-[52px]">
              Clear delivery beats vague promises.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/55">
              Your order moves through a two-leg shipment: our overseas
              International Carrier first, then NZ Post once it reaches New
              Zealand.
            </p>
          </div>
          <div className="grid gap-3 xsmall:grid-cols-2 small:grid-cols-4">
            {HOW_STEPS.map(([num, title, body]) => (
              <div
                key={num}
                className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#C8D050]/40 hover:bg-white/[0.07]"
              >
                <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#C8D050] text-sm font-black text-[#0A0A0A]">
                  {num}
                </div>
                <p className="text-[15px] font-black">{title}</p>
                <p className="mt-2 text-[12.5px] leading-6 text-white/50">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-[1320px] px-[18px] small:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#2A2A2A,#0A0A0A)] p-8 text-[#F4F2ED] small:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,rgba(200,208,80,0.18),transparent_44%),radial-gradient(ellipse_at_90%_82%,rgba(193,68,14,0.16),transparent_54%)]" />
          <div className="relative max-w-[560px]">
            <p className="mb-3 inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#C8D050]">
              <span className="h-2 w-2 rounded-full bg-[#C8D050]" />
              Winter drop
            </p>
            <h2 className="text-[34px] font-black leading-[0.98] tracking-[-0.045em] small:text-[58px]">
              TNF 1996 Retro Puffer
            </h2>
            <p className="mt-4 max-w-[470px] text-[15px] leading-7 text-white/65">
              Your core outerwear product is already doing the work. Build the
              homepage around it, then let future footwear and colour drops fill
              the placeholders.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LocalizedClientLink
                href={featuredCard.href}
                className="inline-flex h-13 items-center rounded-full bg-[#C8D050] px-7 text-[12px] font-black uppercase tracking-[0.14em] text-[#0A0A0A]"
              >
                Shop the puffer
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/store"
                className="inline-flex h-13 items-center rounded-full border border-white/15 px-7 text-[12px] font-black uppercase tracking-[0.14em] text-white"
              >
                View colours
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-20 grid max-w-[1320px] gap-8 rounded-[32px] bg-[#FDF4EF] px-7 py-12 small:grid-cols-[0.9fr_1.1fr] small:px-12 small:py-16">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
            Why our prices look like this
          </p>
          <h2 className="mt-3 text-[34px] font-black leading-[0.98] tracking-[-0.045em] small:text-[48px]">
            The value has to be explained before checkout.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[#555]">
            The audit showed that cheaper pricing can create doubt unless the
            model is stated plainly. This is the trust block that makes the
            offer feel intentional, not suspicious.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            "No local retail markup on standard-delivery items.",
            "Sourced through verified overseas manufacturing partners.",
            "Tracked end-to-end, with NZ Post for final delivery.",
            "Backed by MUSE support and 30-day money back.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[22px] bg-white/70 px-5 py-4 text-sm font-bold leading-6 text-[#333]"
            >
              <span className="mr-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#C1440E] text-[10px] text-white">
                ✓
              </span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-[1320px] px-[18px] small:px-8">
        <div className="mb-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1F7A3A]">
            NZ Stock
          </p>
          <h2 className="mt-2 text-[34px] font-black leading-[0.98] tracking-[-0.045em] small:text-[52px]">
            Fast-shipping slots for future stock.
          </h2>
        </div>
        <div className="grid gap-3 small:grid-cols-3">
          {NZ_STOCK_PLACEHOLDERS.map(([num, title, body]) => (
            <div key={num} className="rounded-[26px] bg-[#F8F7F4] p-5">
              <div className="mb-4 flex aspect-[1.1] items-center justify-center rounded-[20px] bg-[#E8E6E0] text-6xl font-black tracking-[-0.08em] text-black/10">
                {num}
              </div>
              <p className="text-lg font-black tracking-[-0.03em]">{title}</p>
              <p className="mt-1 text-sm text-[#666]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-[1320px] rounded-[32px] bg-[#F8F7F4] px-6 py-12 small:px-10 small:py-16">
        <div className="mb-9 flex flex-col gap-4 small:flex-row small:items-end small:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
              Reviews
            </p>
            <h2 className="mt-2 text-[34px] font-black leading-[0.98] tracking-[-0.045em] small:text-[52px]">
              Real proof, close to the buy moment.
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-6xl font-black tracking-[-0.06em]">4.9</p>
            <div>
              <p className="text-[#C1440E]">★★★★★</p>
              <p className="text-sm font-semibold text-[#666]">
                47 verified reviews
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 small:grid-cols-3">
          {REVIEWS.map(([initial, name, city, quote]) => (
            <div key={name} className="rounded-[22px] bg-[#F4F2ED] p-6">
              <p className="text-sm tracking-[0.08em] text-[#C1440E]">★★★★★</p>
              <p className="mt-4 min-h-[96px] text-[14.5px] leading-7 text-[#333]">
                “{quote}”
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-[#E8E6E0] pt-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#E8E6E0] text-sm font-black text-[#666]">
                  {initial}
                </div>
                <div>
                  <p className="text-sm font-black">
                    {name}{" "}
                    <span className="text-[10px] uppercase tracking-[0.08em] text-[#1F7A3A]">
                      verified
                    </span>
                  </p>
                  <p className="text-xs text-[#777]">{city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-[1320px] px-[18px] text-center small:px-8">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
          Instagram
        </p>
        <h2 className="mt-2 text-[34px] font-black tracking-[-0.045em] small:text-[44px]">
          Seen on @muse.nz
        </h2>
        <div className="mt-8 grid grid-cols-3 gap-2 small:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <a
              key={index}
              href="https://www.instagram.com/muse.nz/?hl=en"
              className="flex aspect-square items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#E8E6E0,#F8F7F4)] text-4xl font-black tracking-[-0.08em] text-black/10 transition hover:scale-[1.02]"
              target="_blank"
              rel="noreferrer"
            >
              {index + 1}
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-24 max-w-[1320px] px-[18px] small:px-8">
        <div className="overflow-hidden rounded-[32px] bg-[#0A0A0A] px-6 py-12 text-center text-[#F4F2ED] small:px-12 small:py-16">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C8D050]">
            Drop access
          </p>
          <h2 className="mx-auto mt-3 max-w-[680px] text-[34px] font-black leading-[1] tracking-[-0.045em] small:text-[48px]">
            Get first access when the next colour or size run lands.
          </h2>
          <div className="mx-auto mt-8 flex max-w-[460px] flex-col gap-2 xsmall:flex-row">
            <input
              aria-label="Email address"
              placeholder="Email address"
              className="h-14 flex-1 rounded-full border border-white/15 bg-white/[0.06] px-5 text-sm text-white outline-none placeholder:text-white/35"
            />
            <button className="h-14 rounded-full bg-[#C8D050] px-7 text-[12px] font-black uppercase tracking-[0.14em] text-[#0A0A0A]">
              Join
            </button>
          </div>
          <p className="mt-4 text-xs text-white/35">
            No spam. Just restocks, drops, and delivery updates.
          </p>
        </div>
      </section>
    </main>
  )
}

function ProductCard({ product }: { product: HomeCard }) {
  return (
    <LocalizedClientLink
      href={product.href}
      className="group overflow-hidden rounded-[22px] bg-[#F8F7F4] transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#E8E6E0]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#E8E6E0,#F8F7F4)] text-7xl font-black tracking-[-0.08em] text-black/10">
            {product.placeholder}
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#0A0A0A] backdrop-blur">
          {product.badge}
        </div>
      </div>
      <div className="px-1 pb-2 pt-4">
        <p className="min-h-[42px] text-[14px] font-black leading-5 tracking-[-0.02em]">
          {product.title}
        </p>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-black">{product.price}</span>
            {product.compareAt && (
              <span className="text-xs font-bold text-[#999] line-through">
                {product.compareAt}
              </span>
            )}
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#C1440E]">
            View
          </span>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
