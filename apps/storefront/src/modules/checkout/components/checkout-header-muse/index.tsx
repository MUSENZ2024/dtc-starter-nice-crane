import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CheckoutHeaderMuse() {
  return (
    <header className="bg-muse-black px-5 py-5 small:px-8">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <LocalizedClientLink
          href="/cart"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/65 transition hover:text-muse-cream"
        >
          ← Back to bag
        </LocalizedClientLink>

        <LocalizedClientLink
          href="/store"
          className="flex items-center justify-center transition hover:opacity-80"
          aria-label="MUSE store"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png"
            alt="MUSE"
            className="h-7 w-auto"
          />
        </LocalizedClientLink>

        <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/65">
          <svg className="h-3.5 w-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="hidden xsmall:inline">Secure checkout</span>
          <span className="xsmall:hidden">Secure</span>
        </div>
      </div>
    </header>
  )
}
