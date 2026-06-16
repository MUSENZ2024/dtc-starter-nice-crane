import { Metadata } from "next"

import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listProductTags } from "@lib/data/product-tags"
import StoreTemplateMuse from "@modules/store/templates/store-template-muse"

export const metadata: Metadata = {
  title: "Shop All - MUSE NZ",
  description:
    "Retro footwear and outerwear. NZ Stock ships in 1-3 days. Standard Delivery in 13-16 days.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: string
    page?: string
    stock?: string
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

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams

  const [categories, collectionsResponse, productTagsResponse] = await Promise.all([
    listCategories().catch(() => []),
    listCollections({ limit: "100" }).catch(() => ({ collections: [], count: 0 })),
    listProductTags({ limit: "100" }).catch(() => ({ product_tags: [], count: 0 })),
  ])

  const nzStockCollection = collectionsResponse.collections.find(
    (collection) => collection.handle === "nz-stock"
  )
  const standardCollection = collectionsResponse.collections.find(
    (collection) => collection.handle === "standard-delivery"
  )

  return (
    <StoreTemplateMuse
      countryCode={params.countryCode}
      searchParams={searchParams}
      categories={categories}
      productTags={productTagsResponse.product_tags}
      nzStockCollectionId={nzStockCollection?.id}
      standardCollectionId={standardCollection?.id}
    />
  )
}
