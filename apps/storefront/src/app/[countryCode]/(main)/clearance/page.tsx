import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listProductTags } from "@lib/data/product-tags"
import StoreTemplateMuse from "@modules/store/templates/store-template-muse"

export const metadata: Metadata = {
  title: "Clearance | NZ Stock Footwear & Apparel | MUSE NZ",
  description:
    "Shop MUSE NZ Clearance for selected footwear and apparel already held in Auckland. Fast 1-3 day dispatch, final sizes, past drops, and genuine markdowns while stock lasts.",
  alternates: {
    canonical: "/clearance",
  },
}

type Params = {
  searchParams: Promise<{
    sortBy?: string
    page?: string
    brand?: string
    cat?: string
    size?: string
    colour?: string
    line?: string
    badge?: string
    grid?: string
    maxPrice?: string
    minPrice?: string
    q?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function ClearancePage(props: Params) {
  notFound()

  const params = await props.params
  const searchParams = await props.searchParams

  const [categories, collectionsResponse, productTagsResponse] =
    await Promise.all([
      listCategories().catch(() => []),
      listCollections({ limit: "100" }).catch(() => ({
        collections: [],
        count: 0,
      })),
      listProductTags({ limit: "100" }).catch(() => ({
        product_tags: [],
        count: 0,
      })),
    ])

  const nzStockCollection = collectionsResponse.collections.find(
    (collection) => collection.handle === "nz-stock"
  )
  const standardCollection = collectionsResponse.collections.find(
    (collection) => collection.handle === "standard-delivery"
  )
  const clearanceCollection = collectionsResponse.collections.find(
    (collection) => collection.handle === "clearance"
  )

  return (
    <StoreTemplateMuse
      countryCode={params.countryCode}
      searchParams={searchParams}
      categories={categories}
      productTags={productTagsResponse.product_tags}
      nzStockCollectionId={nzStockCollection?.id}
      standardCollectionId={standardCollection?.id}
      clearanceCollectionId={clearanceCollection?.id}
      pageVariant="clearance"
    />
  )
}
