import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartDrawerWrapper from "@modules/layout/components/cart-drawer/server-wrapper"
import NavSavedLink from "@modules/saved/components/nav-saved-link"

import MuseNavClient from "./muse-nav-client"

type NavLink = {
  label: string
  href: string
}

type SearchProductLink = {
  title: string
  href: string
  image?: string
  keywords: string
}

const byRankThenName = (
  a: HttpTypes.StoreProductCategory,
  b: HttpTypes.StoreProductCategory
) => (a.rank ?? 0) - (b.rank ?? 0) || a.name.localeCompare(b.name)

const getVisibleCategoryLinks = (
  categories: HttpTypes.StoreProductCategory[]
) => {
  const rootCategories = categories.filter(
    (category) => !category.parent_category_id
  )
  const source = rootCategories.length ? rootCategories : categories

  return [...source]
    .sort(byRankThenName)
    .filter((category) => category.handle)
    .slice(0, 4)
    .map<NavLink>((category) => ({
      label: category.name,
      href: `/categories/${category.handle}`,
    }))
}

function MuseAnnouncementBar() {
  const messages = [
    "Free NZ delivery on orders over $200",
    "30-day returns on eligible orders",
    "Tracked delivery on every order",
  ]

  return (
    <div className="relative h-8">
      {messages.map((message, index) => (
        <span
          key={message}
          className={`announcement-item absolute inset-0 flex items-center justify-center gap-2.5 px-4 text-[11.5px] font-semibold tracking-[0.04em] transition-opacity duration-500 ${
            index === 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C8D050"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {index === 0 ? (
              <path d="M5 12h14M12 5l7 7-7 7" />
            ) : index === 1 ? (
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </>
            )}
          </svg>
          {message}
        </span>
      ))}
    </div>
  )
}

export default async function Nav() {
  const categories = await listCategories({
    fields: "id,name,handle,rank,parent_category_id",
  }).catch(() => [])

  const categoryLinks = getVisibleCategoryLinks(categories)
  // Product matches are fetched only after the shopper types. Preloading a
  // product index in the global navigation made every route and every
  // router.refresh() pay for an unrelated catalogue request.
  const productLinks: SearchProductLink[] = []

  return (
    <>
      <div className="relative h-8 overflow-hidden bg-[#0A0A0A] text-[#F4F2ED]">
        <div className="muse-utility-inner">
          <div className="muse-utility-message"><MuseAnnouncementBar /></div>
          <nav aria-label="Utility navigation" className="muse-utility-links">
            <LocalizedClientLink href="/track">Track order</LocalizedClientLink>
            <LocalizedClientLink href="/faq">Help</LocalizedClientLink>
            <LocalizedClientLink href="/account">Sign in</LocalizedClientLink>
          </nav>
        </div>
      </div>

      <div className="muse-sticky-header sticky inset-x-0 top-0 z-50">

        <header
          id="muse-nav"
          className="h-16 border-b border-white/[0.08] bg-[rgba(10,10,10,0.96)] text-white backdrop-blur-[16px] transition-transform duration-300"
        >
          <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 large:px-8">
            <div className="flex items-center gap-1.5">
              <MuseNavClient
                categoryLinks={categoryLinks}
                productLinks={productLinks}
              />

              <div className="hidden">
                <LocalizedClientLink href="/store" className="muse-nav-link">
                  Shop All
                </LocalizedClientLink>

                <div className="group relative flex h-full items-center">
                  <button className="muse-nav-button flex items-center gap-1">
                    Collections
                    <svg
                      className="transition-transform duration-200 group-hover:rotate-180"
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M2 4l4 4 4-4" />
                    </svg>
                  </button>
                  <div className="absolute left-0 top-full z-10 mt-px hidden min-w-[200px] flex-col gap-1 rounded-b-[16px] border border-t-0 border-white/10 bg-[#0A0A0A] p-3 group-hover:flex">
                    {categoryLinks.map((category) => (
                      <LocalizedClientLink
                        key={category.href}
                        href={category.href}
                        className="rounded-[10px] px-3 py-2.5 text-[13px] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        {category.label}
                      </LocalizedClientLink>
                    ))}
                    <div className="my-1 h-px bg-white/[0.08]" />
                    <LocalizedClientLink
                      href="/store"
                      className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#C8D050]"
                    >
                      View all
                    </LocalizedClientLink>
                  </div>
                </div>

                <LocalizedClientLink
                  href="/clearance"
                  className="text-[11px] font-black uppercase tracking-[0.14em] text-[#C1440E] transition hover:opacity-80"
                >
                  Clearance
                </LocalizedClientLink>

                <LocalizedClientLink href="/track" className="muse-nav-link">
                  Track
                </LocalizedClientLink>
                <LocalizedClientLink href="/faq" className="muse-nav-link">
                  FAQ / Help
                </LocalizedClientLink>
              </div>
            </div>

            <LocalizedClientLink
              href="/"
              className="flex min-h-11 items-center justify-center transition hover:opacity-75"
              aria-label="MUSE home"
              data-testid="nav-store-link"
            >
              <img
                src="/muse-logo-long.png"
                alt="MUSE"
                className="h-7 w-auto large:h-[30px]"
              />
            </LocalizedClientLink>

            <div className="flex items-center justify-end gap-2.5">
              <button
                id="search-btn-desktop"
                className="hidden p-[7px] text-white/50 transition hover:text-white large:flex"
                aria-label="Search"
                type="button"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>

              <LocalizedClientLink
                href="/account"
                className="hidden text-[11px] font-black uppercase tracking-[0.14em] text-white/60 transition hover:text-white large:block"
                data-testid="nav-account-link"
                aria-label="Account"
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6"/></svg>
              </LocalizedClientLink>

              <NavSavedLink />

              <Suspense
                fallback={
                  <button
                    className="flex h-11 w-11 items-center justify-center text-[#0A0A0A]"
                    type="button"
                    aria-label="Loading bag"
                    disabled
                  >
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>
                  </button>
                }
              >
                <CartDrawerWrapper />
              </Suspense>
            </div>
          </div>
        </header>
        <nav
          aria-label="Main navigation"
          className="hidden h-[53px] border-b border-muse-border bg-white large:block"
        >
          <div className="mx-auto flex h-full max-w-[1440px] items-center justify-center gap-1 px-8">
            <LocalizedClientLink href="/store?sort=newest" className="muse-retail-nav-item">
              New in
            </LocalizedClientLink>
            {categoryLinks.map((category) => (
              <LocalizedClientLink
                key={category.href}
                href={category.href}
                className="muse-retail-nav-item"
              >
                {category.label}
              </LocalizedClientLink>
            ))}
            <LocalizedClientLink href="/store?stock=nz-stock" className="muse-retail-nav-item">
              NZ Stock
            </LocalizedClientLink>
            <LocalizedClientLink href="/store" className="muse-retail-nav-item">
              Brands
            </LocalizedClientLink>
            <LocalizedClientLink href="/clearance" className="muse-retail-nav-item text-muse-orange">
              Clearance
            </LocalizedClientLink>
          </div>
        </nav>
      </div>
    </>
  )
}
