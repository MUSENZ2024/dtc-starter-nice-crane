import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listProductTags } from "@lib/data/product-tags"
import { listRegions } from "@lib/data/regions"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import StoreTemplateMuse from "@modules/store/templates/store-template-muse"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export async function generateStaticParams() {
  const product_categories = await listCategories().catch(() => [])

  if (!product_categories.length) {
    return []
  }

  const countryCodes = await listRegions()
    .then((regions: StoreRegion[]) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat(),
    )
    .catch(() => [])

  const categoryHandles = product_categories.map(
    (category: HttpTypes.StoreProductCategory) => category.handle,
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: string) => ({
        countryCode,
        category: [handle],
      })),
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const title = `${productCategory.name} | MUSE NZ`

    const description =
      productCategory.description ??
      `Shop ${productCategory.name.toLowerCase()} at MUSE NZ with tracked delivery and clear fulfilment estimates.`

    return {
      title,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

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
    (collection) => collection.handle?.trim() === "nz-stock",
  )
  const standardCollection = collectionsResponse.collections.find(
    (collection) => collection.handle === "standard-delivery",
  )

  return (
    <StoreTemplateMuse
      countryCode={params.countryCode}
      searchParams={searchParams}
      categories={categories}
      productTags={productTagsResponse.product_tags}
      nzStockCollectionId={nzStockCollection?.id}
      standardCollectionId={standardCollection?.id}
      pageVariant="category"
      category={productCategory}
    />
  )
}
