import LocalizedClientLink from "@modules/common/components/localized-client-link";

export default async function Footer() {
  return (
    <footer className="w-full bg-[#0A0A0A] text-white">
      <div className="content-container flex flex-col w-full py-16 small:py-24">
        <div className="grid gap-12 small:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr]">
          <div className="max-w-md">
            <LocalizedClientLink href="/" className="inline-flex">
              <img
                src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png"
                alt="MUSE"
                className="h-10 w-auto"
              />
            </LocalizedClientLink>
            <p className="mt-6 text-sm leading-7 text-white/60">
              Auckland-based curated footwear and outerwear. Built for buyers
              who want the look, the fit, and the price to make sense.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="https://www.instagram.com/muse.nz/?hl=en" target="_blank" rel="noreferrer">
                <img src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/ffa7a5bb-412b-4863-8621-280e76f1ffa1.png" alt="Instagram" className="h-7 w-7" />
              </a>
              <a href="https://www.facebook.com/muse.nz.2025" target="_blank" rel="noreferrer">
                <img src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/8d169842-5280-4499-9d29-d46b1a2a6a0f.png" alt="Facebook" className="h-7 w-7" />
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C8D050]">Shop</p>
            <div className="mt-5 grid gap-3 text-sm text-white/65">
              <LocalizedClientLink href="/store" className="hover:text-white">Shop all</LocalizedClientLink>
              <LocalizedClientLink href="/store" className="hover:text-white">On hand</LocalizedClientLink>
              <LocalizedClientLink href="/store" className="hover:text-white">Outerwear</LocalizedClientLink>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C8D050]">Support</p>
            <div className="mt-5 grid gap-3 text-sm text-white/65">
              <a href="https://www.musenz.com/track" className="hover:text-white">Track order</a>
              <a href="mailto:support@musenz.com" className="hover:text-white">support@musenz.com</a>
              <span>Auckland pickup</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C8D050]">Buyer trust</p>
            <div className="mt-5 grid gap-3 text-sm text-white/65">
              <span>30-day money back</span>
              <span>13-16 day delivery</span>
              <span>NZ Post final mile</span>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/35 small:flex-row small:items-center small:justify-between">
          <p>© {new Date().getFullYear()} MUSE NZ. All rights reserved.</p>
          <p>Prices in NZD · Secure checkout · Auckland, New Zealand</p>
        </div>
      </div>
    </footer>
  );
}
