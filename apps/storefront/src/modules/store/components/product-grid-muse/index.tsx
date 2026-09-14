import { listProductsFiltered } from "@lib/data/products"
import { ProductFilterParams } from "@lib/data/products.types"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import ProductCardMuse, {
  ProductCardMuseProduct,
} from "@modules/products/components/product-card-muse"
import ActiveFilterChips from "@modules/store/components/active-filter-chips"
import LoadMoreMuse from "@modules/store/components/load-more-muse"
import SortSelectMuse from "@modules/store/components/sort-select-muse"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  countryCode: string
  filters: ProductFilterParams
  searchParams: Record<string, string | undefined>
  categories: HttpTypes.StoreProductCategory[]
  tagLabels?: Record<string, string>
  gridView?: "standard" | "dense"
  emptyTitle?: string
  emptyDescription?: string
  basePath: string
  invalidPageParam?: boolean
}

const PROMOTIONAL_TAG_LABELS: Record<string, string> = {
  sale: "On sale",
  "on-sale": "On sale",
  bestseller: "Bestseller",
  "best-seller": "Bestseller",
  "best-sellers": "Bestseller",
}

const getPromotionalBadge = (product: HttpTypes.StoreProduct) => {
  const tags = product.tags ?? []

  for (const tag of tags) {
    const value = tag.value?.toLowerCase()
    if (!value) {
      continue
    }

    const match = value.match(/^(?:badge|status)[:/](.+)$/)
    const handle = match?.[1] ?? value
    const label = PROMOTIONAL_TAG_LABELS[handle]

    if (label) {
      return label
    }
  }

  return undefined
}

const toProductCard = (
  product: HttpTypes.StoreProduct
): ProductCardMuseProduct => {
  const fulfilment = getFulfilmentState(product)
  const { cheapestPrice } = getProductPrice({ product })
  const rrp =
    typeof product.metadata?.rrp_nzd === "string"
      ? product.metadata.rrp_nzd
      : undefined

  return {
    id: product.id,
    title: product.title || "MUSE product",
    handle: product.handle,
    thumbnail: product.thumbnail,
    images: product.images,
    brand:
      typeof product.metadata?.brand === "string"
        ? product.metadata.brand
        : undefined,
    price: cheapestPrice?.calculated_price,
    compareAt: rrp ? `$${rrp} RRP` : undefined,
    fulfilment: {
      shortLabel: fulfilment.shortLabel,
      dotClassName: fulfilment.dotClassName,
      deliveryLabel: fulfilment.deliveryLabel,
    },
    promotionalBadge: getPromotionalBadge(product),
    options: product.options?.map((option) => ({
      id: option.id,
      title: option.title,
    })),
    variants: product.variants?.map((variant) => ({
      id: variant.id,
      inventory_quantity: variant.inventory_quantity,
      manage_inventory: variant.manage_inventory,
      allow_backorder: variant.allow_backorder,
      options: variant.options?.map((option) => ({
        option_id: option.option_id,
        value: option.value,
        option:
          "option" in option && option.option
            ? { title: option.option.title }
            : undefined,
      })),
    })),
  }
}

export default async function ProductGridMuse({
  countryCode,
  filters,
  searchParams,
  categories,
  tagLabels = {},
  gridView = "standard",
  emptyTitle = "No styles match your filters",
  emptyDescription = "Try removing a filter or clearing all.",
  basePath,
  invalidPageParam = false,
}: Props) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 12
  const result = invalidPageParam
    ? { products: [], total: 0, hasMore: false }
    : await listProductsFiltered({
        countryCode,
        filters,
      }).catch(() => ({ products: [], total: 0, hasMore: false }))
  const totalPages = Math.ceil(result.total / limit)
  const isOutOfRange =
    invalidPageParam || (result.total > 0 && page > Math.max(1, totalPages))
  const showing = Math.min(result.products.length, result.total)
  const categoryLabels = Object.fromEntries(
    categories.map((category) => [category.id, category.name])
  )
  const recoveryParams = new URLSearchParams()

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key !== "page" && value) recoveryParams.set(key, value)
  })

  const recoveryHref = `/${basePath}${
    recoveryParams.size ? `?${recoveryParams.toString()}` : ""
  }`

  if (isOutOfRange) {
    return (
      <div className="min-w-0 pb-24 small:pb-0">
        <div
          className="rounded-[22px] bg-muse-cream-warm px-6 py-24 text-center"
          role="alert"
        >
          <h2 className="mb-2 text-[20px] font-black tracking-tight">
            That catalogue page does not exist
          </h2>
          <p className="mx-auto max-w-md text-[14px] leading-6 text-muse-text-muted">
            The range may have changed, or the page number in this link is no
            longer available.
          </p>
          <LocalizedClientLink
            href={recoveryHref}
            className="mt-6 inline-flex rounded-full bg-muse-black px-6 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-muse-cream transition hover:bg-muse-orange"
          >
            Back to the first page
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0 pb-24 small:pb-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span
            className="whitespace-nowrap text-[13px] font-medium text-muse-text-muted"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong className="text-muse-black">{showing}</strong> of{" "}
            {result.total} styles
          </span>
          <ActiveFilterChips
            searchParams={searchParams}
            categoryLabels={categoryLabels}
            tagLabels={tagLabels}
          />
        </div>
        <div className="hidden small:block">
          <SortSelectMuse currentSort={filters.sortBy ?? "random"} />
        </div>
      </div>

      {result.products.length === 0 ? (
        <div className="rounded-[22px] bg-muse-cream-warm px-6 py-24 text-center">
          <p className="mb-2 text-[17px] font-black tracking-tight">
            {emptyTitle}
          </p>
          <p className="text-[14px] text-muse-text-muted">{emptyDescription}</p>
        </div>
      ) : (
        <div
          className={
            gridView === "dense"
              ? "grid grid-cols-2 gap-2.5 small:grid-cols-4 small:gap-3 medium:grid-cols-5"
              : "grid grid-cols-2 gap-2.5 small:grid-cols-3 small:gap-4 medium:grid-cols-4"
          }
        >
          {result.products.map((product, index) => (
            <ProductCardMuse
              key={product.id}
              product={toProductCard(product)}
              countryCode={countryCode}
              position={(page - 1) * limit + index + 1}
            />
          ))}
        </div>
      )}

      <LoadMoreMuse
        showing={showing}
        total={result.total}
        currentPage={page}
        pageSize={limit}
      />
    </div>
  )
}
