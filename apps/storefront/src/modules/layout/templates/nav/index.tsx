import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <div className="bg-[#0A0A0A] px-10 py-2.5 text-center text-xs font-medium tracking-[0.04em] text-[#F4F2ED]">
        Free NZ delivery over $200 · 30-day money back{" "}
        <a
          href="https://www.musenz.com/track"
          className="ml-2 border-b border-[#C8D050] pb-px font-semibold text-[#C8D050]"
        >
          track your order -&gt;
        </a>
      </div>
      <header className="relative h-20 mx-auto border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl duration-200">
        <nav className="content-container text-white flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center gap-8">
            <div className="h-full small:hidden">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
            <div className="hidden small:flex items-center gap-8 text-[12px] font-bold uppercase tracking-[0.14em] text-white/65">
              <LocalizedClientLink href="/store" className="hover:text-[#C8D050]">
                Shop All
              </LocalizedClientLink>
              <LocalizedClientLink href="/store" className="hover:text-[#C8D050]">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#1F7A3A]" />
                NZ Stock
              </LocalizedClientLink>
              <LocalizedClientLink href="/store" className="hover:text-[#C8D050]">
                Drops
              </LocalizedClientLink>
              <LocalizedClientLink href="/store" className="hover:text-[#C8D050]">
                Footwear
              </LocalizedClientLink>
              <LocalizedClientLink href="/store" className="hover:text-[#C8D050]">
                Outerwear
              </LocalizedClientLink>
              <a href="https://www.musenz.com/track" className="hover:text-[#C8D050]">
                Track
              </a>
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity"
              data-testid="nav-store-link"
            >
              <img
                src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png"
                alt="MUSE"
                className="h-8 w-auto"
              />
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/65 hover:text-[#C8D050]"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="rounded-full bg-[#C8D050] px-5 py-2 text-[12px] font-black uppercase tracking-[0.14em] text-black hover:bg-white"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
