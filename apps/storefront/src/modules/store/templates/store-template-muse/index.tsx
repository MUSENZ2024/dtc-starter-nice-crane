import { Suspense } from "react"

import { ProductFilterParams, SortOptions } from "@lib/data/products.types"
import { StoreProductTag } from "@lib/data/product-tags"
import { HttpTypes } from "@medusajs/types"
import FilterBarMobileMuse from "@modules/store/components/filter-bar-mobile-muse"
import FilterRailMuse from "@modules/store/components/filter-rail-muse"
import ProductGridMuse from "@modules/store/components/product-grid-muse"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { buildDynamicTagFilters } from "@modules/store/utils/dynamic-filter-options"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const APPAREL_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "2XL"]

const SHOE_SIZE_GROUPS = [
  {
    label: "US Men",
    sizes: [
      "USM 3.5",
      "USM 4",
      "USM 4.5",
      "USM 5",
      "USM 5.5",
      "USM 6",
      "USM 6.5",
      "USM 7",
      "USM 7.5",
      "USM 8",
      "USM 8.5",
      "USM 9",
      "USM 9.5",
      "USM 10",
      "USM 10.5",
      "USM 11",
      "USM 11.5",
      "USM 12",
      "USM 12.5",
      "USM 13",
    ],
  },
  {
    label: "US Women",
    sizes: [
      "USW 5",
      "USW 5.5",
      "USW 6",
      "USW 6.5",
      "USW 7",
      "USW 7.5",
      "USW 8",
      "USW 8.5",
      "USW 9",
      "USW 9.5",
      "USW 10",
      "USW 10.5",
      "USW 11",
      "USW 11.5",
      "USW 12",
      "USW 12.5",
      "USW 13",
      "USW 13.5",
      "USW 14",
      "USW 14.5",
    ],
  },
  {
    label: "EU",
    sizes: [
      "35.5",
      "36",
      "36.5",
      "37.5",
      "38",
      "38.5",
      "39",
      "40",
      "40.5",
      "41",
      "42",
      "42.5",
      "43",
      "44",
      "44.5",
      "45",
      "45.5",
      "46",
      "47",
      "47.5",
    ],
  },
  {
    label: "UK",
    sizes: [
      "UK 3",
      "UK 3.5",
      "UK 4",
      "UK 4.5",
      "UK 5",
      "UK 5.5",
      "UK 6",
      "UK 6.5",
      "UK 7",
      "UK 7.5",
      "UK 8",
      "UK 8.5",
      "UK 9",
      "UK 9.5",
      "UK 10",
      "UK 10.5",
      "UK 11",
      "UK 11.5",
      "UK 12",
    ],
  },
]

const COLOURS = [
  { value: "Black", hex: "#1A1A1A" },
  { value: "White", hex: "#FFFFFF", border: true },
  { value: "Brown", hex: "#3D2817" },
  { value: "Navy", hex: "#1E3A5F" },
  { value: "Green", hex: "#264929" },
  { value: "Orange", hex: "#C8542D" },
  { value: "Grey", hex: "#A4A4A4" },
  { value: "Cream", hex: "#D4C4A8" },
  { value: "Pink", hex: "#E8B4C8" },
  { value: "Purple", hex: "#5A3D6E" },
]

type StoreSearchParams = Record<string, string | undefined>

type Props = {
  countryCode: string
  searchParams: StoreSearchParams
  categories: HttpTypes.StoreProductCategory[]
  productTags: StoreProductTag[]
  nzStockCollectionId?: string
  standardCollectionId?: string
  clearanceCollectionId?: string
  pageVariant?: "store" | "clearance"
}

const splitParam = (value?: string) => value?.split(",").filter(Boolean)

const resolveTagIds = (
  handles: string[] | undefined,
  tags: StoreProductTag[]
) => {
  if (!handles?.length) {
    return undefined
  }

  const ids = handles
    .map((handle) => tags.find((tag) => tag.value === handle)?.id)
    .filter((id): id is string => Boolean(id))

  return ids.length ? ids : undefined
}

const resolveColourTagIds = (
  colours: string[] | undefined,
  tags: StoreProductTag[]
) => {
  if (!colours?.length) {
    return undefined
  }

  const selected = new Set(
    colours.map((colour) => colour.trim().toLowerCase().replace(/[\s_]+/g, "-"))
  )
  const ids = tags
    .filter((tag) => {
      const colour = tag.value.match(/^(?:colour|color)[:/](.+)$/i)?.[1]

      return colour
        ? selected.has(colour.trim().toLowerCase().replace(/[\s_]+/g, "-"))
        : false
    })
    .map((tag) => tag.id)

  return ids.length ? ids : undefined
}

const resolveTagProductIds = (
  tagIds: string[] | undefined,
  tags: StoreProductTag[]
) => {
  if (!tagIds?.length) {
    return undefined
  }

  const tagProductIds = Object.fromEntries(
    tagIds.map((tagId) => [
      tagId,
      tags
        .find((tag) => tag.id === tagId)
        ?.products?.map((product) => product.id) ?? [],
    ])
  )

  return Object.values(tagProductIds).some((productIds) => productIds.length)
    ? tagProductIds
    : undefined
}

const getStockCollectionIds = ({
  stock,
  nzStockCollectionId,
  standardCollectionId,
}: {
  stock?: string
  nzStockCollectionId?: string
  standardCollectionId?: string
}) => {
  if (stock === "nz-stock" && nzStockCollectionId) {
    return [nzStockCollectionId]
  }

  if (stock === "standard-delivery" && standardCollectionId) {
    return [standardCollectionId]
  }

  return undefined
}

export default function StoreTemplateMuse({
  countryCode,
  searchParams,
  categories,
  productTags,
  nzStockCollectionId,
  standardCollectionId,
  clearanceCollectionId,
  pageVariant = "store",
}: Props) {
  const isClearance = pageVariant === "clearance"
  const childCategories = categories.filter(
    (category) =>
      category.parent_category_id || !category.category_children?.length
  )
  const filterCategories = childCategories.length ? childCategories : categories
  const { brands, lines, badges, tagLabels } =
    buildDynamicTagFilters(productTags)

  const activeBrandHandles = splitParam(searchParams.brand) ?? []
  const activeLineHandles = splitParam(searchParams.line) ?? []
  const activeLineParents = new Set(
    activeLineHandles
      .map((handle) => lines.find((line) => line.value === handle)?.brand)
      .filter(Boolean)
  )
  const activeTagHandles = [
    ...activeBrandHandles.filter((brand) => !activeLineParents.has(brand)),
    ...activeLineHandles,
    ...(splitParam(searchParams.badge) ?? []),
    ...(isClearance && !clearanceCollectionId ? ["clearance"] : []),
  ]
  const activeColourHandles = splitParam(searchParams.colour)
  const activeColourTagIds = resolveColourTagIds(activeColourHandles, productTags)
  const activeTagIds = resolveTagIds(activeTagHandles, productTags)
  const activeTagProductIds = resolveTagProductIds(activeTagIds, productTags)
  const stockFilter =
    isClearance
      ? "nz-stock"
      : searchParams.stock === "nz-stock" ||
        searchParams.stock === "standard-delivery"
      ? searchParams.stock
      : undefined
  const stockCollectionIds = getStockCollectionIds({
    stock: stockFilter,
    nzStockCollectionId,
    standardCollectionId,
  })
  const collectionIds =
    isClearance && clearanceCollectionId
      ? [clearanceCollectionId]
      : stockCollectionIds

  const filters: ProductFilterParams = {
    sortBy: (searchParams.sortBy as SortOptions) ?? "created_at",
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: searchParams.grid === "dense" ? 20 : 12,
    q: searchParams.q,
    stock: isClearance ? "nz-stock" : stockCollectionIds ? undefined : stockFilter,
    tag_id: activeTagIds,
    colour_tag_id: activeColourTagIds,
    tag_product_ids: activeTagProductIds,
    category_id: splitParam(searchParams.cat),
    collection_id: collectionIds?.length ? collectionIds : undefined,
    sizes: splitParam(searchParams.size),
    colours: activeColourHandles,
    colourTagFilterApplied: Boolean(activeColourTagIds?.length),
    priceMax: searchParams.maxPrice
      ? parseInt(searchParams.maxPrice)
      : undefined,
    priceMin: searchParams.minPrice
      ? parseInt(searchParams.minPrice)
      : undefined,
  }

  const activeFilterCount = [
    isClearance ? undefined : searchParams.stock,
    activeBrandHandles.length + activeLineHandles.length + (splitParam(searchParams.badge)?.length ?? 0),
    filters.category_id?.length,
    filters.sizes?.length,
    filters.colours?.length,
    filters.priceMax,
    filters.priceMin,
    searchParams.q,
  ].filter(Boolean).length
  const gridView = searchParams.grid === "dense" ? "dense" : "standard"
  const basePath = isClearance ? "clearance" : "store"

  return (
    <main className="min-h-screen bg-muse-cream font-inter text-muse-black">
      <div className="mx-auto max-w-[1400px] px-[18px] pt-5 text-[12px] font-medium tracking-[0.03em] text-muse-text-light small:px-8">
        <a
          href={`/${countryCode}`}
          className="transition hover:text-muse-orange"
        >
          Home
        </a>
        <span className="mx-2 opacity-60">/</span>
        {isClearance ? "Clearance" : "Shop All"}
      </div>

      <section className="mx-auto max-w-[1400px] px-[18px] pb-6 pt-7 small:px-8 small:pb-8">
        {isClearance ? (
          <ClearanceHero countryCode={countryCode} searchParams={searchParams} />
        ) : (
          <>
            <h1 className="text-[clamp(36px,5vw,56px)] font-black leading-none tracking-[-0.04em]">
              Shop All
            </h1>
            <p className="mt-3 max-w-[590px] text-[15px] leading-[1.65] text-muse-text-muted">
              Retro footwear and outerwear, curated for NZ. Filter by NZ Stock for
              fast shipping, or Standard Delivery for our full overseas range. Every
              item is inspected before dispatch.
            </p>
            <CategoryTiles
              countryCode={countryCode}
              categories={filterCategories}
              searchParams={searchParams}
              basePath={basePath}
            />
          </>
        )}
      </section>

      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 border-b border-muse-border px-[18px] pb-4 small:px-8">
        <div className="flex items-center gap-4">
          <div className="hidden text-[13px] font-medium text-muse-text-muted small:block">
            Refine the range
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GridToggle
            countryCode={countryCode}
            searchParams={searchParams}
            view={gridView}
            basePath={basePath}
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-0 px-[18px] py-7 small:grid-cols-[248px_1fr] small:gap-10 small:px-8 small:py-8">
        <aside className="hidden small:block">
          <FilterRailMuse
            brands={brands}
            lines={lines}
            badges={badges}
            apparelSizes={APPAREL_SIZES}
            shoeSizeGroups={SHOE_SIZE_GROUPS}
            colours={COLOURS}
            categories={filterCategories}
            searchParams={searchParams}
          />
        </aside>
        <Suspense fallback={<SkeletonProductGrid />}>
          <ProductGridMuse
            countryCode={countryCode}
            filters={filters}
            searchParams={searchParams}
            categories={filterCategories}
            tagLabels={tagLabels}
            gridView={gridView}
            emptyTitle={
              isClearance ? "Nothing matches your filters" : undefined
            }
            emptyDescription={
              isClearance
                ? "The best clearance pieces move fast. Clear a few filters or shop the latest NZ-stock arrivals."
                : undefined
            }
          />
        </Suspense>
      </div>

      {isClearance && <ClearanceConfidenceSection />}

      <FilterBarMobileMuse
        activeFilterCount={activeFilterCount}
        brands={brands}
        lines={lines}
        badges={badges}
        apparelSizes={APPAREL_SIZES}
        shoeSizeGroups={SHOE_SIZE_GROUPS}
        colours={COLOURS}
        categories={filterCategories}
        searchParams={searchParams}
      />
    </main>
  )
}

function GridToggle({
  countryCode,
  searchParams,
  view,
  basePath,
}: {
  countryCode: string
  searchParams: StoreSearchParams
  view: "standard" | "dense"
  basePath: "store" | "clearance"
}) {
  const hrefFor = (nextView: "standard" | "dense") => {
    const params = new URLSearchParams()

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "grid" && key !== "page") {
        params.set(key, value)
      }
    })

    if (nextView === "dense") {
      params.set("grid", nextView)
    }

    const query = params.toString()
    return query
      ? `/${countryCode}/${basePath}?${query}`
      : `/${countryCode}/${basePath}`
  }

  return (
    <div className="hidden rounded-full bg-muse-cream-deep p-1 small:flex">
      <a
        href={hrefFor("standard")}
        aria-label="Standard product grid"
        className={`flex h-8 w-9 items-center justify-center rounded-full transition ${
          view === "standard" ? "bg-white text-muse-black" : "text-muse-text-muted"
        }`}
      >
        <GridIcon />
      </a>
      <a
        href={hrefFor("dense")}
        aria-label="Dense product grid"
        className={`flex h-8 w-9 items-center justify-center rounded-full transition ${
          view === "dense" ? "bg-white text-muse-black" : "text-muse-text-muted"
        }`}
      >
        <LargeGridIcon />
      </a>
    </div>
  )
}

function CategoryTiles({
  countryCode,
  categories,
  searchParams,
  basePath = "store",
}: {
  countryCode: string
  categories: HttpTypes.StoreProductCategory[]
  searchParams: StoreSearchParams
  basePath?: "store" | "clearance"
}) {
  const activeCats = splitParam(searchParams.cat) ?? []

  const hrefFor = (categoryId?: string) => {
    const params = new URLSearchParams()

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "cat" && key !== "page") {
        params.set(key, value)
      }
    })

    if (categoryId) {
      params.set("cat", categoryId)
    }

    const query = params.toString()
    return query
      ? `/${countryCode}/${basePath}?${query}`
      : `/${countryCode}/${basePath}`
  }

  return (
    <div className="no-scrollbar mt-6 flex gap-2.5 overflow-x-auto pb-1">
      <a
        href={hrefFor()}
        className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold transition ${
          activeCats.length
            ? "border-muse-border bg-muse-cream-warm hover:border-muse-black"
            : "border-muse-black bg-muse-black text-muse-cream"
        }`}
      >
        All
      </a>
      {categories.slice(0, 8).map((category) => {
        const active = activeCats.includes(category.id)

        return (
          <a
            key={category.id}
            href={hrefFor(category.id)}
            className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold transition ${
              active
                ? "border-muse-black bg-muse-black text-muse-cream"
                : "border-muse-border bg-muse-cream-warm hover:border-muse-black"
            }`}
          >
            {category.name}
          </a>
        )
      })}
    </div>
  )
}

function hrefWithParams({
  countryCode,
  searchParams,
  next,
}: {
  countryCode: string
  searchParams: StoreSearchParams
  next?: Record<string, string | undefined>
}) {
  const params = new URLSearchParams()

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== "page") {
      params.set(key, value)
    }
  })

  Object.entries(next ?? {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
  })

  const query = params.toString()
  return query ? `/${countryCode}/clearance?${query}` : `/${countryCode}/clearance`
}

function ClearanceHero({
  countryCode,
  searchParams,
}: {
  countryCode: string
  searchParams: StoreSearchParams
}) {
  const chips = [
    { label: "Sneakers", next: { q: "sneaker" } },
    { label: "Apparel", next: { q: "apparel" } },
    { label: "Under $100", next: { maxPrice: "100" } },
    { label: "30%+ Off", next: { badge: "30-off" } },
    { label: "Final Sizes", next: { badge: "final-sizes" } },
    { label: "NZ Stock Only", next: { stock: undefined } },
  ]

  const proofs = [
    ["NZ Stock only", "Held locally and ready to move."],
    ["Auckland dispatch", "Most orders ship in 1-3 business days."],
    ["Genuine markdowns", "Selected past drops, final sizes, and slow movers."],
    ["Most styles will not restock", "Ends when sold out, without fake countdowns."],
  ]

  return (
    <div className="grid gap-6 small:grid-cols-[minmax(0,1fr)_360px] small:items-end">
      <div>
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-muse-orange">
          Selected NZ stock
        </p>
        <h1 className="max-w-[760px] text-[clamp(42px,7vw,88px)] font-black leading-[0.92] tracking-[-0.04em]">
          Clearance
        </h1>
        <p className="mt-4 max-w-[650px] text-[15px] leading-[1.7] text-muse-text-muted small:text-[16px]">
          Selected NZ-stock footwear and apparel, priced to clear and ready to
          ship from Auckland in 1-3 days. Genuine markdowns on final sizes,
          past drops, and limited leftover stock.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {chips.map((chip) => (
            <a
              key={chip.label}
              href={hrefWithParams({
                countryCode,
                searchParams,
                next: chip.next,
              })}
              className="rounded-full border border-muse-border bg-muse-cream-warm px-4 py-2.5 text-[12.5px] font-bold transition hover:border-muse-black hover:bg-white"
            >
              {chip.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 small:grid-cols-1">
        {proofs.map(([title, body]) => (
          <div
            key={title}
            className="rounded-[16px] border border-muse-border bg-muse-cream-warm p-4"
          >
            <p className="text-[12px] font-black uppercase tracking-[0.08em]">
              {title}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-[1.55] text-muse-text-muted">
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClearanceConfidenceSection() {
  const faqs = [
    [
      "What does NZ Stock mean?",
      "It means the item is already held locally in Auckland and is ready for fast dispatch.",
    ],
    [
      "How fast does clearance ship?",
      "Most clearance orders ship from Auckland in 1-3 business days.",
    ],
    [
      "Will sold-out clearance items restock?",
      "Usually not. Most clearance styles are last pairs, final sizes, past drops, or leftover stock we do not plan to restock.",
    ],
    [
      "Can I return clearance items?",
      "Items marked Final Sale are not returnable for change of mind. Faulty items are still covered under your rights under New Zealand consumer law.",
    ],
  ]

  return (
    <section className="mx-auto max-w-[1400px] px-[18px] pb-24 small:px-8">
      <div className="grid gap-8 border-t border-muse-border pt-10 small:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-muse-orange">
            Why these styles are discounted
          </p>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black leading-none tracking-[-0.035em]">
            Past drops, final sizes, limited leftover stock.
          </h2>
          <p className="mt-4 max-w-[560px] text-[14px] leading-[1.75] text-muse-text-muted">
            These products are part of selected NZ stock we are ready to move on
            from. They are the same authentic MUSE styles, just priced to clear
            while stock lasts.
          </p>
        </div>

        <div className="grid gap-3">
          {faqs.map(([question, answer]) => (
            <details
              key={question}
              className="group rounded-[16px] border border-muse-border bg-muse-cream-warm px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-[14px] font-black">
                {question}
              </summary>
              <p className="mt-3 text-[13.5px] leading-[1.65] text-muse-text-muted">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-[18px] bg-muse-black px-5 py-5 text-muse-cream small:flex small:items-center small:justify-between">
        <p className="text-[13px] font-semibold leading-[1.7] text-muse-cream/80">
          Authentic products, fast Auckland dispatch, secure checkout, and clear
          returns information. The MUSE standard, even on clearance.
        </p>
        <LocalizedClientLink
          href="/faq"
          className="mt-4 inline-flex rounded-full bg-muse-yellow px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-muse-black transition hover:bg-muse-yellow-deep small:mt-0"
        >
          Returns info
        </LocalizedClientLink>
      </div>
    </section>
  )
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current stroke-2"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function LargeGridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current stroke-2"
    >
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" />
      <rect x="13" y="13" width="8" height="8" />
    </svg>
  )
}
