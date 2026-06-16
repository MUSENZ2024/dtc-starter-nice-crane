import LocalizedClientLink from "@modules/common/components/localized-client-link"

const PAYMENT_BADGES = [
  ["Visa", "/payment-badges/Visa.png"],
  ["Mastercard", "/payment-badges/mastercard.png"],
  ["Amex", "/payment-badges/Amex.png"],
  ["Apple Pay", "/payment-badges/Applepay.png"],
  ["Google Pay", "/payment-badges/Gpay.png"],
  ["Afterpay", "/payment-badges/Afterpay.png"],
  ["Klarna", "/payment-badges/Klarna.png"],
  ["PayPal", "/payment-badges/paypal.png"],
]

export default async function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#0A0A0A] text-white">
      <div className="border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-6 py-10">
          <div>
            <p className="mb-1 text-[15px] font-black text-white">
              Early access to drops + 10% off your first order
            </p>
            <p className="text-[12.5px] text-white/40">
              No spam. Just drops, restocks, and the occasional deal.
            </p>
          </div>
          <form className="flex flex-wrap gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="min-w-[220px] rounded-[8px] border border-white/[0.12] bg-white/[0.06] px-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-[#C8D050]/50"
            />
            <button
              type="submit"
              className="rounded-[8px] bg-[#C8D050] px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.1em] text-[#0A0A0A] transition hover:bg-[#B6C043]"
            >
              Join the list
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 pb-12 pt-14 large:px-8">
        <div className="grid gap-10 large:grid-cols-[1.3fr_1fr] large:items-start">
          <div className="max-w-[340px]">
            <LocalizedClientLink href="/" className="mb-5 inline-flex">
              <img
                src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png"
                alt="MUSE"
                className="h-[34px] w-auto"
              />
            </LocalizedClientLink>
            <p className="mb-4 text-[13.5px] leading-[1.7] text-white/50">
              Auckland-based curated footwear and outerwear. Built for buyers
              who want the look, the fit, and the price to make sense. Every
              order is inspected before it leaves us.
            </p>
            <p className="mb-5 text-[11px] tracking-[0.03em] text-white/25">
              Auckland, New Zealand
            </p>
            <div className="flex items-center gap-3.5">
              <a
                href="https://www.instagram.com/muse.nz"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="opacity-65 transition hover:opacity-100"
              >
                <img
                  src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/ffa7a5bb-412b-4863-8621-280e76f1ffa1.png"
                  alt=""
                  className="h-[22px] w-auto"
                />
              </a>
              <a
                href="https://www.facebook.com/muse.nz.2025"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="opacity-65 transition hover:opacity-100"
              >
                <img
                  src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/8d169842-5280-4499-9d29-d46b1a2a6a0f.png"
                  alt=""
                  className="h-[22px] w-auto"
                />
              </a>
              <a
                href="https://www.tiktok.com/@muse.nz"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="text-white opacity-65 transition hover:opacity-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid gap-8 xsmall:grid-cols-3">
            <nav aria-label="Footer shop navigation">
              <p className="mb-[18px] text-[10px] font-black uppercase tracking-[0.16em] text-[#C8D050]">
                Shop
              </p>
              <div className="flex flex-col gap-[11px] text-[13.5px] text-white/55">
                <LocalizedClientLink href="/store" className="transition hover:text-white">
                  Shop All
                </LocalizedClientLink>
                <LocalizedClientLink href="/categories/footwear" className="transition hover:text-white">
                  Footwear
                </LocalizedClientLink>
                <LocalizedClientLink href="/categories/outerwear" className="transition hover:text-white">
                  Outerwear
                </LocalizedClientLink>
                <LocalizedClientLink href="/store?tag=clearance" className="text-[#C1440E] transition hover:opacity-80">
                  Clearance
                </LocalizedClientLink>
              </div>
            </nav>

            <nav aria-label="Footer support navigation">
              <p className="mb-[18px] text-[10px] font-black uppercase tracking-[0.16em] text-[#C8D050]">
                Support
              </p>
              <div className="flex flex-col gap-[11px] text-[13.5px] text-white/55">
                <LocalizedClientLink href="/track" className="transition hover:text-white">
                  Track order
                </LocalizedClientLink>
                <LocalizedClientLink href="/faq" className="transition hover:text-white">
                  FAQ / Help
                </LocalizedClientLink>
                <a href="mailto:support@musenz.com" className="transition hover:text-white">
                  support@musenz.com
                </a>
                <span className="text-[11.5px] text-white/30">
                  Reply within 12 hours
                </span>
                <span>Auckland pickup</span>
              </div>
            </nav>

            <nav aria-label="Footer company navigation">
              <p className="mb-[18px] text-[10px] font-black uppercase tracking-[0.16em] text-[#C8D050]">
                Company
              </p>
              <div className="flex flex-col gap-[11px] text-[13.5px] text-white/55">
                <LocalizedClientLink href="/privacy" className="transition hover:text-white">
                  Privacy Policy
                </LocalizedClientLink>
                <LocalizedClientLink href="/terms" className="transition hover:text-white">
                  Terms of Service
                </LocalizedClientLink>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3.5 px-6 py-5 large:flex-row large:items-center large:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENT_BADGES.map(([alt, src]) => (
              <img
                key={alt}
                src={src}
                alt={alt}
                className="h-6 rounded bg-white px-1.5 py-1"
                loading="lazy"
              />
            ))}
          </div>
          <p className="text-[11.5px] text-white/25">
            © {new Date().getFullYear()} MUSE NZ. All rights reserved. · Prices
            in NZD · Secure checkout · Auckland, New Zealand
          </p>
        </div>
      </div>
    </footer>
  )
}
