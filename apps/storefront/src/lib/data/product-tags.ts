"use server"

import { sdk } from "@lib/config"

export type StoreProductTag = {
  id: string
  name?: string
  value: string
  products?: { id: string; status?: string }[]
}

export const listProductTags = async (
  queryParams: { limit?: string } = {}
): Promise<{ product_tags: StoreProductTag[]; count: number }> => {
  const fetchTags = () =>
    sdk.client.fetch<{ product_tags: StoreProductTag[]; count?: number }>(
      "/store/product-tags",
      {
        method: "GET",
        query: {
          limit: queryParams.limit ?? "100",
          fields: "id,name,value,products.id,products.status",
        },
        cache: "no-store",
      }
    )

  let result: { product_tags: StoreProductTag[]; count?: number } | undefined
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      result = await fetchTags()
      break
    } catch (error) {
      lastError = error
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
      }
    }
  }

  if (!result) throw lastError

  return {
      product_tags: result.product_tags.map((tag) => ({
        ...tag,
        products: tag.products?.filter((product) =>
          product.status ? product.status === "published" : true
        ),
      })),
      count: result.count ?? result.product_tags.length,
  }
}
