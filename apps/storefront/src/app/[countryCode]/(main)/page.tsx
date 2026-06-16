import { Metadata } from "next"
import { HttpTypes } from "@medusajs/types"

import { listProducts } from "@lib/data/products"
import { getDeliveredByLabel } from "@lib/util/delivery-estimate"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SavedToggle from "@modules/saved/components/saved-toggle"

import DropCountdown from "./drop-countdown"
import InstagramFeed from "./instagram-feed"
import NuptseSlideshow from "./nuptse-slideshow"
import RealProofSection from "./real-proof-section"

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
  id: string
  title: string
  price: string
  compareAt?: string
  badge: string
  href: string
  image?: string | null
  placeholder: string
  eta: string
}

const PLACEHOLDER_CARDS: HomeCard[] = [
  {
    title: "Retro Runner - Sea Salt",
    id: "home-preview-runner-sea-salt",
    price: "NZ$160",
    compareAt: "NZ$280",
    badge: "Coming soon",
    href: "/store",
    placeholder: "02",
    eta: "Coming soon",
  },
  {
    title: "Everyday Court Sneaker - Grey",
    id: "home-preview-court-grey",
    price: "NZ$150",
    compareAt: "NZ$240",
    badge: "Drop preview",
    href: "/store",
    placeholder: "03",
    eta: "Drop preview",
  },
  {
    title: "Puffer Vest - Navy",
    id: "home-preview-puffer-vest-navy",
    price: "NZ$145",
    compareAt: "NZ$260",
    badge: "Winter preview",
    href: "/store",
    placeholder: "04",
    eta: "Winter preview",
  },
]

const HOW_STEPS = [
  [
    "1",
    "Choose your item",
    "Shop either our NZ Stock collection for faster delivery or our full catalogue for the widest range.",
  ],
  [
    "2",
    "We quality-check every order",
    "Every order is inspected before dispatch to make sure everything arrives as expected.",
  ],
  [
    "3",
    "Tracked shipping",
    "You'll receive tracking updates as your order moves through the delivery network.",
  ],
  [
    "4",
    "Delivered to your door",
    "Most Standard Delivery orders arrive within 13-16 days. NZ Stock orders typically arrive within 1-3 business days.",
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

const getCardFromProduct = (
  product: HttpTypes.StoreProduct,
  index: number,
  deliveryLabel: string
): HomeCard => {
  const { cheapestPrice } = getProductPrice({ product })

  return {
    title: product.title || "MUSE product",
    id: product.id,
    price: cheapestPrice?.calculated_price || "NZ$180",
    compareAt:
      cheapestPrice?.original_price &&
      cheapestPrice.original_price !== cheapestPrice.calculated_price
        ? cheapestPrice.original_price
        : "NZ$500",
    badge: index === 1 ? "NZ Stock" : "Standard",
    href: `/products/${product.handle}`,
    image: getPrimaryImage(product),
    placeholder: String(index + 1).padStart(2, "0"),
    eta: index === 1 ? "Ships in 1-3 days" : deliveryLabel,
  }
}

export default async function Home(props: Props) {
  const { countryCode } = await props.params
  const deliveryLabel = getDeliveredByLabel()
  const fallbackPuffer: HomeCard = {
    id: "home-fallback-puffer",
    title: "TNF 1996 Retro Nuptse - Black",
    price: "NZ$180",
    compareAt: "NZ$500",
    badge: "Standard",
    href: "/products/1996-retro-puffer-jacket-black",
    placeholder: "01",
    eta: deliveryLabel,
  }

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

  const nuptseProducts = await listProducts({
    countryCode,
    queryParams: {
      limit: 12,
      q: "nuptse",
      fields: "id,title,handle,thumbnail,*images",
    },
  })
    .then(({ response }) => response.products)
    .catch(() => [])

  const nuptseSlides = nuptseProducts
    .flatMap((product) => {
      const image = getPrimaryImage(product)
      return image ? [{ src: image, title: product.title ?? "" }] : []
    })
    .slice(0, 12)

  const puffer =
    products.find((product) =>
      `${product.title} ${product.handle}`.toLowerCase().includes("puffer")
    ) || products[0]

  const featuredCard = puffer
    ? getCardFromProduct(puffer, 0, deliveryLabel)
    : fallbackPuffer
  const productCards = [
    featuredCard,
    ...products
      .filter((product) => product.id !== puffer?.id)
      .slice(0, 3)
      .map((product, index) => getCardFromProduct(product, index + 1, deliveryLabel)),
    ...PLACEHOLDER_CARDS,
  ].slice(0, 4)

  return (
    <main className="bg-[#F4F2ED] text-[#0A0A0A]">
      <section className="mx-auto grid max-w-[1320px] gap-9 px-[18px] py-10 small:grid-cols-[0.9fr_1.1fr] small:gap-14 small:px-8 small:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#999]">
            <span className="h-px w-8 bg-[#999]" />
            Winter drop · live now
          </p>
          <h1 className="max-w-[760px] text-[44px] font-extrabold leading-[0.94] tracking-[-0.055em] xsmall:text-[48px] small:text-[84px]">
            The Nuptse.
            <br />
            Finally priced like a&nbsp;jacket,{" "}
            <span className="italic text-[#C1440E]">not a flex.</span>
          </h1>
          <p className="mt-6 max-w-[610px] text-[17px] leading-[1.55] text-[#666] small:text-[22px]">
            Premium winter essentials without the retail markup. Tracked
            delivery. Real Kiwi support. 30-day money back.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <LocalizedClientLink
              href={featuredCard.href}
              className="inline-flex h-[58px] items-center justify-center rounded-full bg-[#0A0A0A] px-4 text-center text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#F4F2ED] transition hover:bg-[#C1440E] small:px-8 small:text-[13px]"
            >
              Shop Nuptse $180
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-[58px] items-center justify-center rounded-full border-2 border-[#0A0A0A] px-4 text-center text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#0A0A0A] transition hover:bg-white small:px-8 small:text-[13px]"
            >
              Shop all
            </LocalizedClientLink>
          </div>
          <p className="mt-8 text-[14px] text-[#666]">
            Tracked delivery, NZ-based support, and 30-day returns.
          </p>
        </div>

        <LocalizedClientLink
          href={featuredCard.href}
          className="relative block"
        >
          <div className="relative aspect-[0.98] overflow-hidden rounded-[34px] bg-[#0A0A0A] shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
            {featuredCard.image ? (
              <img
                src={featuredCard.image}
                alt={featuredCard.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#2A2A2A,#0A0A0A)] text-[clamp(90px,16vw,190px)] font-extrabold tracking-[-0.08em] text-white/10">
                MUSE
              </div>
            )}
            <span className="absolute right-5 top-5 rounded-full bg-[#C8D050] px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#0A0A0A]">
              Winter Drop
            </span>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(10,10,10,0.2))]" />
            <div className="absolute bottom-5 left-5 max-w-[280px] rounded-[18px] bg-white/92 p-4 shadow-xl backdrop-blur-xl small:max-w-[330px] small:rounded-[24px] small:p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#C1440E]">
                Featured · Standard Delivery
              </p>
              <p className="mt-2 text-[18px] font-extrabold leading-[1.15] tracking-[-0.03em] small:text-[20px]">
                TNF 1996 Retro Nuptse — Black
              </p>
              <p className="mt-2 text-[13px] text-[#666]">
                <strong className="text-[#0A0A0A]">$180 NZD</strong> ·{" "}
                {deliveryLabel}
              </p>
            </div>
          </div>
        </LocalizedClientLink>
      </section>

      <section className="mx-auto mb-14 max-w-[1320px] px-[18px] small:mb-20 small:px-8">
        <div className="grid grid-cols-2 gap-6 rounded-[20px] bg-[#0A0A0A] px-[18px] py-6 text-center text-[#F4F2ED] small:grid-cols-4 small:gap-4 small:rounded-[28px] small:p-8">
          {[
            ["57★", "verified reviews"],
            ["4.9★", "verified rating"],
            ["13-16", "days to your door"],
            ["30-day", "money back"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-[22px] font-extrabold leading-none tracking-[-0.025em] text-[#C8D050] small:text-[28px]">
                {value}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#BBB]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="bestsellers"
        className="mx-auto mb-20 max-w-[1320px] px-[18px] small:px-8"
      >
        <SectionHead
          eyebrow="What's moving"
          title="Best sellers this month"
          link="View all →"
          href="/store"
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

      <section
        id="how"
        className="mx-[18px] mb-14 max-w-[1320px] overflow-hidden rounded-[24px] bg-[#0A0A0A] px-6 py-12 text-[#F4F2ED] small:mx-auto small:mb-20 small:rounded-[32px] small:px-14 small:py-20"
      >
        <div className="relative z-[1] mb-10 text-center small:mb-12">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C8D050]">
            How it works
          </p>
          <h2 className="mx-auto max-w-[660px] text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] small:text-[48px]">
            From our warehouse to&nbsp;your&nbsp;door
          </h2>
        </div>
        <div className="relative z-[1] grid grid-cols-2 gap-2.5 small:grid-cols-4 small:gap-4">
          {HOW_STEPS.map(([num, title, body]) => (
            <div
              key={num}
              className="rounded-[16px] border border-white/10 bg-white/[0.04] p-5 small:rounded-[22px] small:p-7"
            >
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#C8D050] text-sm font-extrabold text-[#0A0A0A]">
                {num}
              </div>
              <h3 className="mb-1.5 text-[15px] font-bold text-[#F4F2ED]">
                {title}
              </h3>
              <p className="text-[12.5px] leading-[1.6] text-[#999]">{body}</p>
            </div>
          ))}
        </div>
      </section>

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
            <h2 className="mb-4 text-[28px] font-extrabold leading-[1.05] tracking-[-0.025em] small:text-[42px]">
              Why our prices are different
            </h2>
            <p className="text-[15.5px] leading-[1.65] text-[#666]">
              You might have noticed our prices sit lower than traditional
              retail. That&apos;s because our products are UA / replica pieces,
              sourced through trusted manufacturing partners rather than official
              retail channels.
              <br />
              <br />
              We&apos;re upfront about that because we&apos;d rather keep things clear
              from the start. You&apos;re not paying retail markup, brand-store
              pricing, or extra overheads - you&apos;re paying for a product that
              gives you the look and feel you want at a more accessible price.
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

      <RealProofSection />

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
              <p className="text-sm tracking-[0.08em] text-[#C1440E]">
                ★★★★★
              </p>
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
            Get first access when the next colour or size run lands.
          </h2>
          <div className="mx-auto mt-8 flex max-w-[520px] flex-col gap-3 xsmall:flex-row">
            <input
              aria-label="Email address"
              placeholder="Email address"
              className="min-h-[64px] flex-1 rounded-full border border-white/15 bg-white/[0.06] px-6 text-[16px] text-white outline-none placeholder:text-white/35 focus:border-[#C8D050]"
            />
            <button className="min-h-[64px] rounded-full bg-[#C8D050] px-8 text-[12px] font-black uppercase tracking-[0.14em] text-[#0A0A0A]">
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
        <h2 className="text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] small:text-[44px]">
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
            <img
              src={product.image}
              alt={product.title}
              className="relative z-[1] h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="relative z-[1] flex h-full items-center justify-center text-[42px] font-extrabold uppercase tracking-[-0.04em] text-black/[0.08] small:text-[64px]">
              {product.placeholder}
            </span>
          )}
          <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-[#F4F2ED]/90 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#0A0A0A] backdrop-blur">
            <span
              className={`h-[7px] w-[7px] rounded-full ${
                product.badge === "NZ Stock" ? "bg-[#1F7A3A]" : "bg-[#C1440E]"
              }`}
            />
            {product.badge}
          </span>
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
        <div className="mt-2 flex gap-1">
          {["available", "available", "available", "low", "available", ""].map(
            (status, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full ${
                  status === "low"
                    ? "bg-[#C1440E]"
                    : status === "available"
                    ? "bg-[#333]"
                    : "bg-[#333]/30"
                }`}
              />
            )
          )}
        </div>
      </LocalizedClientLink>
    </div>
  )
}
