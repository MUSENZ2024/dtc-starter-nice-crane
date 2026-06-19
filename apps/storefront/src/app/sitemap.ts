import { listProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()
  const regions = await listRegions()
  const countryCodes = Array.from(
    new Set(
      regions.flatMap(
        (region) => region.countries?.map((country) => country.iso_2) ?? []
      )
    )
  ).filter((code): code is string => Boolean(code))

  const entries: MetadataRoute.Sitemap = []

  for (const countryCode of countryCodes) {
    const staticPaths = ["/store", "/privacy", "/terms", "/track"]
    entries.push(
      ...staticPaths.map((path) => ({
        url: `${baseUrl}/${countryCode}${path}`,
        changeFrequency: path === "" || path === "/store" ? "daily" : "monthly",
        priority: path === "" ? 1 : path === "/store" ? 0.9 : 0.5,
      } as MetadataRoute.Sitemap[number]))
    )

    const { response } = await listProducts({
      countryCode,
      queryParams: { limit: 100, fields: "handle,updated_at" },
    }).catch(() => ({ response: { products: [], count: 0 }, nextPage: null }))

    entries.push(
      ...response.products
        .filter((product) => product.handle)
        .map((product) => ({
          url: `${baseUrl}/${countryCode}/products/${product.handle}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
    )
  }

  return entries
}
