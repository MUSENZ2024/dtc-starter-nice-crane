import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@lib/data/products.types"
import { getFulfilmentState } from "@lib/util/fulfilment-state"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

// The "random" default rotates on this cadence: long enough that paginating
// through the shuffled set (page 2, 3...) stays stable during one browsing
// session, short enough that the next visit sees a different mix.
const RANDOM_ROTATION_WINDOW_MS = 15 * 60 * 1000

export function mulberry32(seed: number) {
  let state = seed

  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getRandomRotationSeed() {
  return Math.floor(Date.now() / RANDOM_ROTATION_WINDOW_MS)
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items]
  const random = mulberry32(seed)

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
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

  if (sortBy === "random") {
    return seededShuffle(sortedProducts, getRandomRotationSeed())
  }

  return sortedProducts
}
