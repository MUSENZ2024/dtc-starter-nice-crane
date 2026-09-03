import { visa, mastercard, amex, applepay, gpay, afterpay, klarna, paypal, logo, instagram, facebook } from "assets/performance/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import NewsletterForm from "@modules/marketing/components/newsletter-form"

const PAYMENT_BADGES = [
  ["Visa", visa],
  ["Mastercard", mastercard],
  ["Amex", amex],
  ["Apple Pay", applepay],
  ["Google Pay", gpay],
  ["Afterpay", afterpay],
  ["Klarna", klarna],
  ["PayPal", paypal],
] as const

export default async function Footer() {
  return (
    <footer className="muse-site-footer w-full border-t border-muse-border bg-white text-muse-black">
      <div className="muse-footer-newsletter border-b border-muse-border">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-6 py-10">
          <div>
            <p className="mb-1 text-[15px] font-medium text-muse-black">
              $20 off your first order over $150 + first access to new drops.
            </p>
            <p className="text-[12.5px] text-muse-text-muted">
              No spam. Just restocks, new products, and the occasional deal.
            </p>
          </div>
          <NewsletterForm source="footer_signup" />
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 pb-12 pt-14 large:px-8">
        <div className="muse-footer-columns grid gap-10 large:grid-cols-[1fr_2fr] large:items-start">
          <div className="max-w-[340px]">
            <LocalizedClientLink href="/" className="mb-5 inline-flex">
              <img
                src={logo.src} width={logo.width} height={logo.height} loading="lazy"
                alt="MUSE"
                className="h-[34px] w-auto"
              />
            </LocalizedClientLink>
            <p className="mb-4 text-[13.5px] leading-[1.7] text-muse-text-muted">
              An online store for footwear, apparel, and everyday essentials.
              Shop current products with secure checkout, tracked delivery, and
              local support.
            </p>
            <p className="mb-5 text-[11px] tracking-[0.03em] text-muse-text-muted">
              Auckland, New Zealand
            </p>
            <div className="muse-footer-social flex items-center gap-3.5">
              <a
                href="https://www.instagram.com/muse.nz"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="opacity-65 transition hover:opacity-100"
              >
                <img
                  src={instagram.src} width={instagram.width} height={instagram.height} loading="lazy"
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
                  src={facebook.src} width={facebook.width} height={facebook.height} loading="lazy"
                  alt=""
                  className="h-[22px] w-auto"
                />
              </a>
              <a
                href="https://www.tiktok.com/@muse.nz"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="text-muse-black transition hover:opacity-70"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="muse-footer-links grid gap-8 small:grid-cols-3">
            <nav aria-label="Footer shop navigation">
              <p className="mb-[18px] font-heading text-[18px] font-medium uppercase tracking-[0.06em] text-muse-black">
                Shop
              </p>
              <div className="flex flex-col gap-[11px] text-[13.5px] text-muse-text-muted">
                <LocalizedClientLink
                  href="/store"
                  className="transition hover:text-muse-black"
                >
                  Shop All
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/categories/footwear"
                  className="transition hover:text-muse-black"
                >
                  Footwear
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/categories/outerwear"
                  className="transition hover:text-muse-black"
                >
                  Outerwear
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/clearance"
                  className="text-[#C1440E] transition hover:opacity-80"
                >
                  Clearance
                </LocalizedClientLink>
              </div>
            </nav>

            <nav aria-label="Footer support navigation">
              <p className="mb-[18px] font-heading text-[18px] font-medium uppercase tracking-[0.06em] text-muse-black">
                Support
              </p>
              <div className="flex flex-col gap-[11px] text-[13.5px] text-muse-text-muted">
                <LocalizedClientLink
                  href="/track"
                  className="transition hover:text-muse-black"
                >
                  Track order
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/faq"
                  className="transition hover:text-muse-black"
                >
                  FAQ / Help
                </LocalizedClientLink>
                <a
                  href="mailto:support@musenz.com"
                  className="transition hover:text-muse-black"
                >
                  support@musenz.com
                </a>
                <span className="text-[11.5px] text-muse-text-muted">
                  Reply within 12 hours
                </span>
                <span>Auckland pickup</span>
              </div>
            </nav>

            <nav aria-label="Footer company navigation">
              <p className="mb-[18px] font-heading text-[18px] font-medium uppercase tracking-[0.06em] text-muse-black">
                Company
              </p>
              <div className="flex flex-col gap-[11px] text-[13.5px] text-muse-text-muted">
                <LocalizedClientLink
                  href="/privacy"
                  className="transition hover:text-muse-black"
                >
                  Privacy Policy
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/terms"
                  className="transition hover:text-muse-black"
                >
                  Terms of Service
                </LocalizedClientLink>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div className="muse-footer-bottom border-t border-muse-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3.5 px-6 py-5 large:flex-row large:items-center large:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENT_BADGES.map(([alt, src]) => (
              <img
                key={alt}
                src={src.src}
                width={src.width}
                height={src.height}
                alt={alt}
                className="h-6 w-auto bg-white px-1.5 py-1"
                loading="lazy"
              />
            ))}
          </div>
          <p className="text-[11.5px] text-muse-text-muted">
            © {new Date().getFullYear()} MUSE NZ. All rights reserved. · Prices
            in NZD · Secure checkout · Auckland, New Zealand
          </p>
        </div>
      </div>
    </footer>
  )
}
