"use server"

import { sdk } from "@lib/config"

export type StoreProductTag = {
  id: string
  name?: string
  value: string
  products?: { id: string; status?: string }[]
}

export const listProductTags = async (
  queryParams: { limit?: string; value?: string | string[] } = {},
): Promise<{ product_tags: StoreProductTag[]; count: number }> => {
  const requestedLimit = Number.parseInt(queryParams.limit ?? "100", 10)
  const pageLimit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? requestedLimit
    : 100

  const fetchPage = (offset: number) =>
    sdk.client.fetch<{
      product_tags: StoreProductTag[]
      count?: number
      limit?: number
      offset?: number
    }>(
      "/store/product-tags",
      {
        method: "GET",
        query: {
          limit: String(pageLimit),
          offset: String(offset),
          ...(queryParams.value ? { value: queryParams.value } : {}),
          fields: "id,name,value,products.id,products.status",
        },
        next: { revalidate: 300 },
        cache: "force-cache",
      },
    )

  const fetchPageWithRetry = async (offset: number) => {
    let lastError: unknown

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await fetchPage(offset)
      } catch (error) {
        lastError = error
        if (attempt < 2) {
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * (attempt + 1)),
          )
        }
      }
    }

    throw lastError
  }

  const firstPage = await fetchPageWithRetry(0)
  const totalCount = firstPage.count ?? firstPage.product_tags.length
  const productTags = [...firstPage.product_tags]

  while (productTags.length < totalCount) {
    const page = await fetchPageWithRetry(productTags.length)
    if (page.product_tags.length === 0) break
    productTags.push(...page.product_tags)
  }

  return {
    product_tags: productTags.map((tag) => ({
      ...tag,
      products: tag.products?.filter((product) =>
        product.status ? product.status === "published" : true,
      ),
    })),
    count: totalCount,
  }
}
