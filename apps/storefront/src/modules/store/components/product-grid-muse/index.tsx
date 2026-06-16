import { listProductsFiltered } from "@lib/data/products"
import { ProductFilterParams } from "@lib/data/products.types"
import { HttpTypes } from "@medusajs/types"
import ProductCardMuse from "@modules/products/components/product-card-muse"
import ActiveFilterChips from "@modules/store/components/active-filter-chips"
import LoadMoreMuse from "@modules/store/components/load-more-muse"
import SortSelectMuse from "@modules/store/components/sort-select-muse"

type Props = {
  countryCode: string
  filters: ProductFilterParams
  searchParams: Record<string, string | undefined>
  categories: HttpTypes.StoreProductCategory[]
  tagLabels?: Record<string, string>
  gridView?: "standard" | "dense"
  emptyTitle?: string
  emptyDescription?: string
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
}: Props) {
  const result = await listProductsFiltered({
    countryCode,
    filters,
  }).catch(() => ({ products: [], total: 0, hasMore: false }))

  const page = filters.page ?? 1
  const limit = filters.limit ?? 12
  const showing = Math.min(result.products.length, result.total)
  const categoryLabels = Object.fromEntries(
    categories.map((category) => [category.id, category.name])
  )

  return (
    <div className="min-w-0 pb-24 small:pb-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="whitespace-nowrap text-[13px] font-medium text-muse-text-muted">
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
          <SortSelectMuse currentSort={filters.sortBy ?? "created_at"} />
        </div>
      </div>

      {result.products.length === 0 ? (
        <div className="rounded-[22px] bg-muse-cream-warm px-6 py-24 text-center">
          <p className="mb-2 text-[17px] font-black tracking-tight">
            {emptyTitle}
          </p>
          <p className="text-[14px] text-muse-text-muted">
            {emptyDescription}
          </p>
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
              product={product}
              countryCode={countryCode}
              position={(page - 1) * limit + index + 1}
            />
          ))}
        </div>
      )}

      <LoadMoreMuse
        showing={showing}
        total={result.total}
        hasMore={result.hasMore}
        currentPage={page}
        pageSize={limit}
      />
    </div>
  )
}
