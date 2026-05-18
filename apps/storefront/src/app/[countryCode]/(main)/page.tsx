import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "MUSE NZ | Curated Footwear & Outerwear",
  description:
    "Auckland-based curated footwear and outerwear with NZ Post tracking, 30-day money back support, and clean delivery timelines.",
}

const heroImage =
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1400&q=85"

const placeholders = [
  {
    title: "1996 Retro Puffer Jacket - Black",
    price: "NZ$180",
    tag: "Best seller",
    href: "/products/1996-retro-puffer-jacket-black",
    image:
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "9060 Style Runner - Sea Salt",
    price: "NZ$160",
    tag: "Pre-order",
    href: "/store",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Retro Puffer Vest - Navy",
    price: "NZ$145",
    tag: "Winter drop",
    href: "/store",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Everyday Court Sneaker - Grey",
    price: "NZ$150",
    tag: "On hand",
    href: "/store",
    image:
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=900&q=85",
  },
]

const deliverySteps = [
  ["01", "Order placed", "Instant confirmation and order details."],
  ["02", "Order processed", "Stock is checked, packed, and queued."],
  ["03", "Tracking emailed", "Live translated updates appear on MUSE tracking."],
  ["04", "Arrives in New Zealand", "NZ Post takes over final mile delivery."],
  ["05", "Delivered", "Usually 13-16 days from order."],
]

export default async function Home() {
  return (
    <main className="bg-[#F4F2ED] text-[#0A0A0A]">
      <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(200,208,80,0.24),transparent_34%),radial-gradient(circle_at_16%_72%,rgba(193,68,14,0.2),transparent_32%)]" />
        <div className="content-container relative grid min-h-[calc(100vh-112px)] gap-10 py-10 small:grid-cols-[1.02fr_0.98fr] small:items-center small:py-16">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8D050] backdrop-blur">
              4.9 rated by NZ buyers
            </div>
            <h1 className="max-w-4xl text-[52px] font-black leading-[0.9] tracking-[-0.07em] small:text-[96px]">
              The pieces everyone asks about.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/68 small:text-lg">
              Curated footwear and outerwear, priced for the fit not the flex.
              Clear shipping windows, live tracking, NZ Post final delivery,
              and 30-day money back support.
            </p>
            <div className="mt-8 flex flex-col gap-3 xsmall:flex-row">
              <LocalizedClientLink
                href="/store"
                className="inline-flex h-14 items-center justify-center rounded-full bg-[#C8D050] px-8 text-[12px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-white"
              >
                Shop the drop
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/products/1996-retro-puffer-jacket-black"
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 text-[12px] font-black uppercase tracking-[0.16em] text-white backdrop-blur transition hover:bg-white hover:text-black"
              >
                View featured piece
              </LocalizedClientLink>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["13-16", "day delivery"],
                ["NZ Post", "final mile"],
                ["30-day", "money back"],
              ].map(([value, label]) => (
                <div key={value} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xl font-black tracking-[-0.04em] text-[#C8D050]">{value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[36px] border border-white/10 bg-white/10 p-3 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#D8D1C4]">
                <img src={heroImage} alt="MUSE featured outerwear" className="h-full w-full object-cover" />
                <div className="absolute left-4 right-4 top-4 flex justify-between gap-3">
                  <span className="rounded-full bg-black/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#C8D050] backdrop-blur">
                    Winter ready
                  </span>
                  <span className="rounded-full bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-black backdrop-blur">
                    NZD pricing
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-[24px] bg-white/85 p-5 shadow-xl backdrop-blur-xl">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C1440E]">
                    Featured product
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <p className="text-2xl font-black tracking-[-0.04em] text-black">
                      1996 Retro Puffer
                    </p>
                    <p className="rounded-full bg-black px-4 py-2 text-sm font-black text-[#C8D050]">
                      NZ$180
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-[24px] bg-[#C8D050] px-5 py-4 text-sm font-black text-black shadow-xl small:block">
              Live order tracking included
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#C8D050] py-3">
        <div className="content-container flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-black/75">
          <span>Pre-order and save</span>
          <span>Free NZ shipping over $200</span>
          <span>Auckland pickup</span>
          <span>4.9 star reviews</span>
        </div>
      </section>

      <section className="content-container py-16 small:py-24">
        <div className="mb-10 flex flex-col gap-4 small:flex-row small:items-end small:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">Best sellers</p>
            <h2 className="mt-2 max-w-2xl text-4xl font-black leading-[0.95] tracking-[-0.06em] small:text-6xl">
              Shop-ready cards before your products are imported.
            </h2>
          </div>
          <LocalizedClientLink href="/store" className="text-[12px] font-black uppercase tracking-[0.16em] text-black underline decoration-2 underline-offset-8">
            View all products
          </LocalizedClientLink>
        </div>

        <div className="grid gap-4 xsmall:grid-cols-2 small:grid-cols-4">
          {placeholders.map((product) => (
            <LocalizedClientLink key={product.title} href={product.href} className="group overflow-hidden rounded-[28px] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#E8E3D6]">
                <img src={product.image} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-black backdrop-blur">
                  {product.tag}
                </div>
              </div>
              <div className="p-4">
                <p className="min-h-[40px] text-sm font-black leading-5 tracking-[-0.02em]">{product.title}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-base font-black text-[#C1440E]">{product.price}</p>
                  <span className="rounded-full bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                    View
                  </span>
                </div>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 small:py-24">
        <div className="content-container grid gap-10 small:grid-cols-[0.8fr_1.2fr] small:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">How delivery works</p>
            <h2 className="mt-2 text-4xl font-black leading-[0.95] tracking-[-0.06em] small:text-6xl">
              The wait is easier when it is explained.
            </h2>
            <p className="mt-5 text-base leading-7 text-black/60">
              The audit showed trust and shipping uncertainty were hurting conversion.
              This section turns the delivery model into a clear buyer promise instead
              of a mystery after checkout.
            </p>
            <a href="https://www.musenz.com/track" className="mt-7 inline-flex h-12 items-center rounded-full bg-black px-6 text-[12px] font-black uppercase tracking-[0.16em] text-white">
              Track an order
            </a>
          </div>
          <div className="grid gap-3">
            {deliverySteps.map(([num, title, body]) => (
              <div key={num} className="grid grid-cols-[56px_1fr] gap-4 rounded-[28px] border border-black/5 bg-[#F8F7F4] p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-black text-[#C8D050]">
                  {num}
                </div>
                <div>
                  <p className="text-base font-black tracking-[-0.02em]">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-black/55">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-container py-16 small:py-24">
        <div className="overflow-hidden rounded-[36px] bg-black text-white">
          <div className="grid gap-8 p-8 small:grid-cols-[1fr_1fr] small:p-12">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C8D050]">Why MUSE converts better</p>
              <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.06em] small:text-6xl">
                Give buyers fewer reasons to hesitate.
              </h2>
            </div>
            <div className="grid gap-3">
              {[
                "Clear pricing in NZD before cart",
                "Shipping window repeated before checkout",
                "Tracking page linked from every key surface",
                "Trust proof above the product grid",
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-bold text-white/80">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
