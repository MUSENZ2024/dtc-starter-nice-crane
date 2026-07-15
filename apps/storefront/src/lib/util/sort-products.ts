import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@lib/data/products.types"
import { getFulfilmentState } from "@lib/util/fulfilment-state"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  const sortedProducts = [...products] as MinPricedProduct[]

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Precompute the minimum price for each product
    sortedProducts.forEach((product) => {
      const prices =
        product.variants
          ?.map((variant) => variant?.calculated_price?.calculated_amount)
          .filter((amount): amount is number => typeof amount === "number") ??
        []

      product._minPrice = prices.length ? Math.min(...prices) : Infinity
    })

    // Sort products based on the precomputed minimum prices
    sortedProducts.sort((a, b) => {
      const diff = a._minPrice! - b._minPrice!
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "best_sellers") {
    sortedProducts.sort((a, b) => {
      const soldCount = (product: HttpTypes.StoreProduct) => {
        const value = product.metadata?.sold_count
        const parsed = typeof value === "number" ? value : Number(value)

        return Number.isFinite(parsed) ? parsed : 0
      }
      const bestseller = (product: HttpTypes.StoreProduct) =>
        product.metadata?.bestseller === true ? 1 : 0

      return (
        bestseller(b) - bestseller(a) ||
        soldCount(b) - soldCount(a) ||
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  if (sortBy === "ships_soonest") {
    sortedProducts.sort((a, b) => {
      const aRank = getFulfilmentState(a).kind === "nz-stock" ? 0 : 1
      const bRank = getFulfilmentState(b).kind === "nz-stock" ? 0 : 1

      return (
        aRank - bRank ||
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  return sortedProducts
}
