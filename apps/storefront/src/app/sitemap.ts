import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getBaseURL } from "@lib/util/env"
import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()
  const staticPaths = [
    "",
    "/store",
    "/clearance",
    "/faq",
    "/privacy",
    "/terms",
    "/track",
  ]
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === "" || path === "/store" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/store" ? 0.9 : 0.5,
  }))

  const [categories, collectionsResult] = await Promise.all([
    listCategories({ limit: 100 }).catch(() => []),
    listCollections({ limit: "100" }).catch(() => ({
      collections: [],
      count: 0,
    })),
  ])

  entries.push(
    ...categories
      .filter((category) => category.handle)
      .map((category) => ({
        url: `${baseUrl}/categories/${category.handle}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...collectionsResult.collections
      .filter((collection) => collection.handle)
      .map((collection) => ({
        url: `${baseUrl}/collections/${collection.handle}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  )

  const firstPage = await listProducts({
    countryCode: "nz",
    queryParams: { limit: 100, fields: "handle,updated_at" },
  }).catch(() => ({
    response: { products: [], count: 0 },
    nextPage: null,
  }))
  const pageCount = Math.ceil(firstPage.response.count / 100)
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      listProducts({
        countryCode: "nz",
        pageParam: index + 2,
        queryParams: { limit: 100, fields: "handle,updated_at" },
      }).then(({ response }) => response.products)
    )
  ).catch(() => [])
  const products = [
    ...firstPage.response.products,
    ...remainingPages.flat(),
  ]

  entries.push(
    ...products
      .filter((product) => product.handle)
      .map((product) => ({
        url: `${baseUrl}/products/${product.handle}`,
        lastModified: product.updated_at
          ? new Date(product.updated_at)
          : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
  )

  return entries
}
