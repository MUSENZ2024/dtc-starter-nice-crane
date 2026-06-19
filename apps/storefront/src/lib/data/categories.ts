import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

const CATEGORY_LIST_FIELDS =
  "*category_children, products.id, products.status, *parent_category, *parent_category.parent_category"
const CATEGORY_DETAIL_FIELDS = "*category_children, products.id, products.status"

const hideDraftCategoryProducts = (
  categories: HttpTypes.StoreProductCategory[]
) =>
  categories.map((category) => ({
    ...category,
    products: category.products?.filter((product) => {
      const status = (product as HttpTypes.StoreProduct & { status?: string })
        .status

      return status ? status === "published" : true
    }),
  }))

export const listCategories = async (query?: Record<string, unknown>) => {
  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          fields: CATEGORY_LIST_FIELDS,
          limit,
          ...query,
        },
        cache: "no-store",
      }
    )
    .then(({ product_categories }) => hideDraftCategoryProducts(product_categories))
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields: CATEGORY_DETAIL_FIELDS,
          handle,
        },
        cache: "no-store",
      }
    )
    .then(({ product_categories }) => hideDraftCategoryProducts(product_categories)[0])
}
