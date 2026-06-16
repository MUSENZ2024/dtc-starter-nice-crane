"use server"

import { sdk } from "@lib/config"

export type StoreProductTag = {
  id: string
  name?: string
  value: string
  products?: { id: string }[]
}

export const listProductTags = async (
  queryParams: { limit?: string } = {}
): Promise<{ product_tags: StoreProductTag[]; count: number }> => {
  return sdk.client
    .fetch<{ product_tags: StoreProductTag[]; count?: number }>(
      "/store/product-tags",
      {
        method: "GET",
        query: {
          limit: queryParams.limit ?? "100",
          fields: "id,name,value,*products",
        },
        cache: "no-store",
      }
    )
    .then(({ product_tags, count }) => ({
      product_tags,
      count: count ?? product_tags.length,
    }))
}
