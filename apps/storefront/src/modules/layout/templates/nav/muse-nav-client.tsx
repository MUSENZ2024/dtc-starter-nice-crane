"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react"
import { createPortal } from "react-dom"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams, useRouter } from "next/navigation"

type Props = {
  categoryLinks: { label: string; href: string }[]
  productLinks: SearchProductLink[]
}

type DrawerLink = {
  label: string
  href: string
  accent?: "red"
}

type SearchProductLink = {
  title: string
  href: string
  image?: string
  keywords: string
}

type LiveSearchProductLink = Omit<SearchProductLink, "keywords">

type SuggestionLink = {
  title: string
  subtitle: string
  href: string
  keywords: string
  accent?: "green" | "orange"
}

const synonymMap: Record<string, string[]> = {
  nuptse: ["puffer", "north face", "jacket", "tnf"],
  tnf: ["north face", "nuptse", "puffer", "jacket"],
  "9060": ["new balance", "nb", "sneaker", "shoe"],
  birks: ["birkenstock", "birk", "slide", "sandal"],
  birkenstock: ["birks", "birk", "slide", "sandal"],
  "fast shipping": ["NZ Stock", "Auckland", "ships fast"],
  sale: ["Clearance", "markdown", "discount"],
}

const curatedCollections: SuggestionLink[] = [
  {
    title: "Shop All",
    subtitle: "Browse the full MUSE catalogue",
    href: "/store",
    keywords: "shop all store catalogue products browse all",
  },
  {
    title: "Clearance",
    subtitle: "Genuine markdowns, NZ stock first",
    href: "/clearance",
    keywords: "sale clearance markdown discount deal",
    accent: "orange",
  },
  {
    title: "New Balance",
    subtitle: "Search 9060 and other NB pairs",
    href: "/store?q=new+balance",
    keywords: "new balance nb 9060 sneaker shoe",
  },
  {
    title: "Nike",
    subtitle: "Search Nike sneakers and apparel",
    href: "/store?q=nike",
    keywords: "nike air jordan dunk shox tn sneaker shoe",
  },
  {
    title: "North Face Puffers",
    subtitle: "Nuptse, TNF and winter jackets",
    href: "/store?q=north+face+puffer",
    keywords: "nuptse tnf north face puffer jacket outerwear",
  },
  {
    title: "Birkenstock",
    subtitle: "Birks, clogs, slides and sandals",
    href: "/store?q=birkenstock",
    keywords: "birks birkenstock clog slide sandal",
  },
]

const helpSuggestions: SuggestionLink[] = [
  {
    title: "Shipping times",
    subtitle: "NZ Stock vs Standard Delivery",
    href: "/faq#shipping",
    keywords:
      "shipping delivery fast shipping nz stock standard delivery dispatch how long",
  },
  {
    title: "Returns and exchanges",
    subtitle: "Sizing, returns and money-back guarantee",
    href: "/faq#returns",
    keywords: "return exchange size sizing refund money back guarantee",
  },
  {
    title: "Ask for a shoe",
    subtitle: "Can not find the pair? Contact MUSE",
    href: "mailto:support@musenz.com?subject=Shoe%20request",
    keywords: "shoe request contact help find pair source item",
  },
]

const normalize = (value: string) => value.trim().toLowerCase()

const expandQuery = (query: string) => {
  const normalized = normalize(query)
  const terms = new Set(normalized.split(/\s+/).filter(Boolean))

  Object.entries(synonymMap).forEach(([trigger, synonyms]) => {
    if (normalized.includes(trigger)) {
      terms.add(trigger)
      synonyms.forEach((synonym) => {
        synonym
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .forEach((term) => terms.add(term))
      })
    }
  })

  return Array.from(terms)
}

const matchesTerms = (haystack: string, terms: string[]) => {
  const normalized = normalize(haystack)

  return terms.some((term) => normalized.includes(term))
}

const localizeHref = (href: string, countryCode?: string | string[]) => {
  if (href.startsWith("mailto:")) {
    return href
  }

  return href
}

export default function MuseNavClient({ categoryLinks, productLinks }: Props) {
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchPanelTop, setSearchPanelTop] = useState(96)
  const [query, setQuery] = useState("")
  const [liveProductLinks, setLiveProductLinks] = useState<
    LiveSearchProductLink[]
  >([])
  const [isProductSearchLoading, setIsProductSearchLoading] = useState(false)
  const searchTouchStartY = useRef<number | null>(null)
  const searchRequestId = useRef(0)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileSearchTriggerRef = useRef<HTMLButtonElement>(null)
  const menuDialogRef = useRef<HTMLElement>(null)
  const searchDialogRef = useRef<HTMLDivElement>(null)
  const menuReturnFocusRef = useRef<HTMLElement | null>(null)
  const searchReturnFocusRef = useRef<HTMLElement | null>(null)
  const router = useRouter()
  const { countryCode } = useParams()
  const country = Array.isArray(countryCode)
    ? countryCode[0]
    : countryCode ?? "nz"

  const collectionSuggestions = useMemo(
    () => [
      ...curatedCollections,
      ...categoryLinks.map<SuggestionLink>((category) => ({
        title: category.label,
        subtitle: "Browse this collection",
        href: category.href,
        keywords: category.label,
      })),
    ],
    [categoryLinks]
  )

  const searchResults = useMemo(() => {
    const terms = expandQuery(query)

    if (terms.length < 1) {
      return {
        products: productLinks.slice(0, 4),
        collections: collectionSuggestions.slice(0, 4),
        help: helpSuggestions.slice(0, 3),
      }
    }

    const matchedProducts = liveProductLinks.length
      ? liveProductLinks
      : productLinks
          .filter((product) =>
            matchesTerms(`${product.title} ${product.keywords}`, terms)
          )
          .slice(0, 5)

    return {
      products: matchedProducts,
      collections: collectionSuggestions
        .filter((item) => matchesTerms(`${item.title} ${item.keywords}`, terms))
        .slice(0, 4),
      help: helpSuggestions
        .filter((item) => matchesTerms(`${item.title} ${item.keywords}`, terms))
        .slice(0, 3),
    }
  }, [collectionSuggestions, liveProductLinks, productLinks, query])

  const hasExactResults =
    searchResults.products.length +
      searchResults.collections.length +
      searchResults.help.length >
      0 || isProductSearchLoading
  const searchStatus = isProductSearchLoading
    ? `Searching for ${query.trim()}`
    : query.trim().length >= 2
    ? `${searchResults.products.length} product ${
        searchResults.products.length === 1 ? "result" : "results"
      } found for ${query.trim()}`
    : "Search suggestions ready"

  const restoreFocus = useCallback((target: HTMLElement | null) => {
    window.requestAnimationFrame(() => target?.focus())
  }, [])

  const openMenu = useCallback((trigger: HTMLElement) => {
    menuReturnFocusRef.current = trigger
    setSearchOpen(false)
    setMenuOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    restoreFocus(menuReturnFocusRef.current)
  }, [restoreFocus])

  const openSearch = useCallback((trigger?: HTMLElement | null) => {
    const nav = document.getElementById("muse-nav")
    if (nav) {
      nav.style.transform = ""
    }
    searchReturnFocusRef.current =
      trigger ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null)
    setMenuOpen(false)
    setSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    restoreFocus(searchReturnFocusRef.current)
  }, [restoreFocus])

  const toggleSearch = useCallback(
    (trigger?: HTMLElement | null) => {
      if (searchOpen) {
        closeSearch()
      } else {
        openSearch(trigger)
      }
    },
    [closeSearch, openSearch, searchOpen]
  )

  useEffect(() => {
    if (!searchOpen) {
      return
    }

    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      searchRequestId.current += 1
      setLiveProductLinks([])
      setIsProductSearchLoading(false)
      return
    }

    const controller = new AbortController()
    const requestId = searchRequestId.current + 1
    searchRequestId.current = requestId
    setLiveProductLinks([])
    setIsProductSearchLoading(true)

    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({
        countryCode: country,
        q: trimmedQuery,
      })

      try {
        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: "default",
          signal: controller.signal,
        })

        if (!response.ok || requestId !== searchRequestId.current) {
          setLiveProductLinks([])
          return
        }

        const payload = (await response.json()) as {
          products?: LiveSearchProductLink[]
        }

        if (requestId === searchRequestId.current) {
          setLiveProductLinks(payload.products ?? [])
        }
      } catch (_error) {
        if (
          !controller.signal.aborted &&
          requestId === searchRequestId.current
        ) {
          setLiveProductLinks([])
        }
      } finally {
        if (
          !controller.signal.aborted &&
          requestId === searchRequestId.current
        ) {
          setIsProductSearchLoading(false)
        }
      }
    }, 180)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [country, query, searchOpen])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".announcement-item")
    if (items.length <= 1) {
      return
    }

    let index = 0
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const interval = setInterval(() => {
      items[index].style.opacity = "0"
      index = (index + 1) % items.length
      items[index].style.opacity = "1"
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const nav = document.getElementById("muse-nav")

    if (searchOpen) {
      if (nav) {
        nav.style.transform = ""
      }
      return
    }

    let lastY = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      if (nav) {
        nav.style.transform = y > lastY && y > 80 ? "translateY(-100%)" : ""
      }
      lastY = y
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [searchOpen])

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen, searchOpen])

  useEffect(() => {
    const desktopButton = document.getElementById("search-btn-desktop")
    desktopButton?.setAttribute("aria-expanded", String(searchOpen))
    desktopButton?.setAttribute("aria-controls", "search-bar")
    const onDesktopSearchClick = () => {
      if (searchOpen) {
        closeSearch()
      } else {
        openSearch(desktopButton)
      }
    }

    desktopButton?.addEventListener("click", onDesktopSearchClick)

    return () => {
      desktopButton?.removeEventListener("click", onDesktopSearchClick)
    }
  }, [closeSearch, openSearch, searchOpen])

  useEffect(() => {
    if (!searchOpen) {
      return
    }

    const measureSearchPanelTop = () => {
      const nav = document.getElementById("muse-nav")
      const bottom = nav?.getBoundingClientRect().bottom
      setSearchPanelTop(Math.max(0, Math.round(bottom || 0)))
    }

    measureSearchPanelTop()
    window.addEventListener("resize", measureSearchPanelTop)
    window.addEventListener("scroll", measureSearchPanelTop, { passive: true })

    return () => {
      window.removeEventListener("resize", measureSearchPanelTop)
      window.removeEventListener("scroll", measureSearchPanelTop)
    }
  }, [searchOpen])

  useEffect(() => {
    const dialog = searchOpen
      ? searchDialogRef.current
      : menuOpen
      ? menuDialogRef.current
      : null
    if (!dialog) {
      return
    }

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",")
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => element.offsetParent !== null)

    window.requestAnimationFrame(() => {
      const preferred = searchOpen
        ? dialog.querySelector<HTMLElement>("#search-input")
        : dialog.querySelector<HTMLElement>('[aria-label="Close menu"]')
      ;(preferred ?? focusable()[0])?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        if (searchOpen) {
          closeSearch()
        } else {
          closeMenu()
        }
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const items = focusable()
      if (!items.length) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [closeMenu, closeSearch, menuOpen, searchOpen])

  function submitSearch() {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      return
    }

    const next = new URLSearchParams()
    next.set("q", trimmedQuery)
    router.push(`${localizeHref("/store", countryCode)}?${next.toString()}`)
    closeSearch()
  }

  function handleSearchTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startY = searchTouchStartY.current
    searchTouchStartY.current = null

    if (startY === null) {
      return
    }

    const endY = event.changedTouches[0]?.clientY
    if (typeof endY === "number" && startY - endY > 70) {
      closeSearch()
    }
  }

  const primaryLinks: DrawerLink[] = [
    { label: "Home", href: "/" },
    { label: "Shop All", href: "/store" },
    ...categoryLinks,
    { label: "Clearance", href: "/clearance", accent: "red" as const },
  ]

  const secondaryLinks = [
    { label: "FAQ / Help", href: "/faq" },
    { label: "Track Order", href: "/track" },
    { label: "Account", href: "/account" },
  ]

  return (
    <>
      <button
        ref={menuTriggerRef}
        className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] large:hidden"
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu-dialog"
        onClick={(event) => openMenu(event.currentTarget)}
        type="button"
      >
        <span className="block h-[1.5px] w-5 rounded bg-white" />
        <span className="block h-[1.5px] w-5 rounded bg-white" />
        <span className="block h-[1.5px] w-5 rounded bg-white" />
      </button>

      <button
        ref={mobileSearchTriggerRef}
        className="flex h-11 w-11 items-center justify-center text-white/70 transition hover:text-white large:hidden"
        aria-label="Search"
        aria-expanded={searchOpen}
        aria-controls="search-bar"
        onClick={(event) => toggleSearch(event.currentTarget)}
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

      {mounted &&
        menuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[250] large:hidden">
            <button
              type="button"
              className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
              onClick={closeMenu}
              aria-label="Close menu backdrop"
            />

            <aside
              ref={menuDialogRef}
              id="mobile-menu-dialog"
              className="absolute bottom-0 left-0 top-0 flex h-dvh w-[min(340px,90vw)] flex-col bg-[#0A0A0A] text-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
                <img
                  src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png"
                  alt="MUSE"
                  className="h-[22px] w-auto"
                />
                <h2 id="mobile-menu-title" className="sr-only">
                  Mobile menu
                </h2>
                <button
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className="flex h-11 w-11 items-center justify-center text-white/70 transition hover:text-white"
                  type="button"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
                {primaryLinks.map((link) => (
                  <LocalizedClientLink
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`rounded-[12px] px-4 py-[15px] text-[22px] font-black transition hover:bg-white/[0.05] ${
                      link.accent === "red" ? "text-[#C1440E]" : "text-white"
                    }`}
                  >
                    {link.label}
                  </LocalizedClientLink>
                ))}

                <div className="my-2 h-px bg-white/[0.08]" />

                {secondaryLinks.map((link) => (
                  <LocalizedClientLink
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-[12px] px-4 py-[13px] text-[13px] font-black uppercase tracking-[0.1em] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    {link.label}
                  </LocalizedClientLink>
                ))}

                <div className="mt-4 rounded-[16px] border border-white/[0.08] bg-white/[0.04] px-[18px] py-4">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#C8D050]">
                    Backed by our guarantee
                  </p>
                  <p className="text-[12px] leading-[1.6] text-white/70">
                    30-day money-back - inspected before dispatch -
                    Auckland-based
                  </p>
                </div>
              </nav>

              <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4">
                <span className="text-[12px] text-white/65">NZ - NZD</span>
                <span className="text-[12px] text-white/65">
                  © 2026 MUSE NZ
                </span>
              </div>
            </aside>
          </div>,
          document.body
        )}

      {mounted &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close search"
              aria-hidden={!searchOpen}
              tabIndex={searchOpen ? 0 : -1}
              className="fixed inset-x-0 bottom-0 z-[9998] bg-black/25 transition-opacity duration-300"
              style={{
                position: "fixed",
                display: "block",
                top: `${searchPanelTop}px`,
                left: 0,
                // 100vw includes the desktop scrollbar. At a 390px test
                // viewport that made this closed backdrop 407px wide and
                // leaked horizontal overflow into every page, including PDPs.
                width: "100%",
                height: `calc(100dvh - ${searchPanelTop}px)`,
                zIndex: 9998,
                opacity: searchOpen ? 1 : 0,
                pointerEvents: searchOpen ? "auto" : "none",
              }}
              onClick={closeSearch}
            />

            <div
              ref={searchDialogRef}
              id="search-bar"
              className={`fixed inset-x-0 z-[9999] overflow-hidden rounded-b-[24px] border-t border-white/[0.08] bg-[#0A0A0A] px-4 text-white shadow-2xl ring-1 ring-white/[0.06] large:px-6 ${
                searchOpen
                  ? "h-[75vh] opacity-100 small:!h-[412px]"
                  : "h-0 opacity-0 small:!h-0"
              }`}
              style={{
                position: "fixed",
                top: `${searchPanelTop}px`,
                right: 0,
                left: 0,
                zIndex: 9999,
                pointerEvents: searchOpen ? "auto" : "none",
              }}
              onTouchStart={(event) => {
                searchTouchStartY.current = event.touches[0]?.clientY ?? null
              }}
              onTouchEnd={handleSearchTouchEnd}
              role="dialog"
              aria-modal="true"
              aria-labelledby="search-dialog-title"
              aria-hidden={!searchOpen}
              inert={!searchOpen}
            >
              <div className="mx-auto max-w-[1440px] py-3">
                <h2 id="search-dialog-title" className="sr-only">
                  Search MUSE
                </h2>
                <p
                  className="sr-only"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {searchStatus}
                </p>
                <div className="flex min-h-12 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] pl-4 pr-1">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    id="search-input"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        submitSearch()
                      }
                    }}
                    placeholder="Search Nuptse, 9060, Birks, NZ Stock..."
                    className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/45 small:text-sm"
                    aria-label="Search products, collections and help"
                  />
                  {isProductSearchLoading && (
                    <span
                      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-[#C8D050]"
                      aria-hidden="true"
                    />
                  )}
                  {query && (
                    <button
                      className="flex min-h-11 items-center px-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/70 transition hover:text-white"
                      type="button"
                      onClick={() => setQuery("")}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    className="flex min-h-11 items-center px-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/70 transition hover:text-white"
                    type="button"
                    onClick={closeSearch}
                  >
                    Cancel
                  </button>
                </div>

                <div className="max-h-[calc(75vh-76px)] overflow-y-auto py-4 small:max-h-[336px]">
                  {hasExactResults ? (
                    <div className="grid gap-5 large:grid-cols-[1.1fr_0.9fr_0.9fr]">
                      <SuggestionGroup title="Products">
                        {searchResults.products.length ? (
                          searchResults.products.map((product) => (
                            <a
                              key={product.href}
                              href={localizeHref(product.href, countryCode)}
                              className="flex items-center gap-3 rounded-[10px] px-2 py-2 transition hover:bg-white/[0.06]"
                              onClick={closeSearch}
                            >
                              <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-white/[0.06]">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={`${product.title} product result`}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-[13px] font-bold">
                                  {product.title}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-white/70">
                                  View product
                                </span>
                              </span>
                            </a>
                          ))
                        ) : isProductSearchLoading ? (
                          <EmptyGroupText text="Searching products..." />
                        ) : (
                          <EmptyGroupText text="No product title matched yet." />
                        )}
                      </SuggestionGroup>

                      <SuggestionGroup title="Collections / Drop Pages">
                        {searchResults.collections.length ? (
                          searchResults.collections.map((item) => (
                            <SearchSuggestionLink
                              key={item.href}
                              item={item}
                              countryCode={countryCode}
                              onClick={closeSearch}
                            />
                          ))
                        ) : (
                          <EmptyGroupText text="Try NZ Stock, Clearance or a brand." />
                        )}
                      </SuggestionGroup>

                      <SuggestionGroup title="FAQ / Help Answers">
                        {searchResults.help.length ? (
                          searchResults.help.map((item) => (
                            <SearchSuggestionLink
                              key={item.href}
                              item={item}
                              countryCode={countryCode}
                              onClick={closeSearch}
                            />
                          ))
                        ) : (
                          <EmptyGroupText text="Shipping and returns help lives here." />
                        )}
                      </SuggestionGroup>
                    </div>
                  ) : (
                    <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.04] p-5">
                      <p className="text-[20px] font-black">No exact match</p>
                      <p className="mt-2 text-[13px] leading-6 text-white/55">
                        Try: Nuptse, New Balance, NZ Stock
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["Nuptse", "New Balance", "NZ Stock"].map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => setQuery(term)}
                            className="rounded-full border border-white/[0.12] px-3 py-2 text-[12px] font-bold text-white/75 transition hover:border-[#C8D050] hover:text-white"
                          >
                            {term}
                          </button>
                        ))}
                        <a
                          href="mailto:support@musenz.com?subject=Shoe%20request"
                          className="rounded-full bg-[#C8D050] px-3 py-2 text-[12px] font-black text-[#0A0A0A] transition hover:opacity-85"
                        >
                          Shoe request / contact
                        </a>
                      </div>
                    </div>
                  )}

                  {query.trim().length >= 2 && (
                    <a
                      href={localizeHref(
                        `/store?q=${encodeURIComponent(query.trim())}`,
                        countryCode
                      )}
                      className="mt-4 flex items-center justify-between rounded-[12px] border border-white/[0.08] px-4 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-[#C8D050] transition hover:bg-white/[0.05]"
                      onClick={closeSearch}
                    >
                      View all results for "{query.trim()}"
                      <span aria-hidden="true">-&gt;</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  )
}

function SuggestionGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function SearchSuggestionLink({
  item,
  countryCode,
  onClick,
}: {
  item: SuggestionLink
  countryCode?: string | string[]
  onClick: () => void
}) {
  const href = localizeHref(item.href, countryCode)

  return (
    <a
      href={href}
      className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-2.5 transition hover:bg-white/[0.06]"
      onClick={onClick}
    >
      <span>
        <span className="block text-[13px] font-bold">{item.title}</span>
        <span className="mt-0.5 block text-[11px] text-white/70">
          {item.subtitle}
        </span>
      </span>
      {item.accent && (
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            item.accent === "green" ? "bg-[#C8D050]" : "bg-[#C1440E]"
          }`}
        />
      )}
    </a>
  )
}

function EmptyGroupText({ text }: { text: string }) {
  return <p className="px-2 py-2 text-[12px] text-white/70">{text}</p>
}
