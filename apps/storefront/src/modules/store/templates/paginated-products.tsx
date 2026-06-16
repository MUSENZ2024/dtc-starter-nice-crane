import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

const FALLBACK_REGION = {
  id: "",
  name: "New Zealand",
  currency_code: "nzd",
  countries: [{ iso_2: "nz", display_name: "New Zealand" }],
} as HttpTypes.StoreRegion

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const { products, count } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })
    .then(({ response }) => response)
    .catch(() => ({ products: [], count: 0 }))

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-muse-border bg-muse-cream-warm px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-muse-black">No products found</h2>
        <p className="mt-2 text-sm text-muse-text-muted">
          Try clearing your filters or check back soon for new arrivals.
        </p>
        <LocalizedClientLink
          href="/store"
          className="mt-6 inline-flex rounded-full bg-muse-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-muse-cream"
        >
          Clear filters
        </LocalizedClientLink>
      </div>
    )
  }

  const region = (await getRegion(countryCode)) ?? FALLBACK_REGION
  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
