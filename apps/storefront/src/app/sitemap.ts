import { listProducts } from "@lib/data/products"
import { getBaseURL } from "@lib/util/env"
import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()
  const staticPaths = ["", "/store", "/faq", "/privacy", "/terms", "/track"]
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === "" || path === "/store" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/store" ? 0.9 : 0.5,
  }))

  const { response } = await listProducts({
    countryCode: "nz",
    queryParams: { limit: 100, fields: "handle,updated_at" },
  }).catch(() => ({ response: { products: [], count: 0 }, nextPage: null }))

  entries.push(
    ...response.products
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
