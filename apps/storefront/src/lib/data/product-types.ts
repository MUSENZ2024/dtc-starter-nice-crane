"use server"

import { sdk } from "@lib/config"

export type StoreProductType = {
  id: string
  value: string
}

export const listProductTypes = async (
  queryParams: { limit?: string; value?: string | string[] } = {}
): Promise<{ product_types: StoreProductType[]; count: number }> => {
  return sdk.client.fetch<{
    product_types: StoreProductType[]
    count: number
  }>("/store/product-types", {
    method: "GET",
    query: {
      limit: queryParams.limit ?? "100",
      ...(queryParams.value ? { value: queryParams.value } : {}),
      fields: "id,value",
    },
    next: { revalidate: 300 },
    cache: "force-cache",
  })
}
