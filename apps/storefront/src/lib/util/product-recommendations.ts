import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export type ProductKind =
  | "puffer"
  | "footwear"
  | "pants"
  | "hoodie"
  | "socks"
  | "accessory"
  | "top"
  | "other"

type RecommendationInput = {
  sourceProducts: HttpTypes.StoreProduct[]
  candidates: HttpTypes.StoreProduct[]
  excludeProductIds?: Iterable<string | undefined | null>
  cartSubtotal?: number | null
  limit?: number
}

const FREE_SHIPPING_THRESHOLD = 200
const CLOSE_TO_FREE_SHIPPING = 70

const kindAliases: Record<Exclude<ProductKind, "other">, string[]> = {
  puffer: ["puffer", "nuptse", "jacket", "vest", "outerwear", "coat"],
  footwear: [
    "footwear",
    "shoe",
    "shoes",
    "sneaker",
    "sneakers",
    "slides",
    "clog",
    "clogs",
    "birkenstock",
    "birk",
    "yeezy",
    "new balance",
    "nike",
    "adidas",
    "asics",
    "onitsuka",
  ],
  pants: ["pant", "pants", "short", "shorts", "trackpant", "trackpants", "trouser", "trousers"],
  hoodie: ["hoodie", "hood", "sweatshirt", "crewneck", "fleece"],
  socks: ["sock", "socks"],
  accessory: ["accessory", "accessories", "bag", "beanie", "cap", "hat"],
  top: ["tee", "t-shirt", "shirt", "top", "jersey"],
}

const colourFamilies: Record<string, string[]> = {
  black: ["black", "triple black", "phantom", "charcoal", "anthracite"],
  grey: ["grey", "gray", "silver", "stone", "ash", "cement", "moonrock"],
  white: ["white", "cream", "sail", "bone", "egret", "ivory"],
  brown: ["brown", "taupe", "mocha", "walnut", "tan", "beige", "sand"],
  green: ["green", "olive", "khaki", "sage", "forest"],
  blue: ["blue", "navy", "indigo", "aqua"],
  red: ["red", "burgundy", "maroon", "pink", "rose"],
  yellow: ["yellow", "gold", "mustard"],
}

const recommendationTargets: Record<ProductKind, ProductKind[]> = {
  puffer: ["pants", "hoodie", "footwear", "accessory", "socks"],
  footwear: ["socks", "pants", "footwear", "accessory"],
  pants: ["hoodie", "puffer", "footwear", "socks"],
  hoodie: ["pants", "puffer", "footwear", "accessory"],
  socks: ["footwear", "pants"],
  accessory: ["puffer", "hoodie", "footwear"],
  top: ["pants", "puffer", "footwear"],
  other: ["socks", "accessory", "pants", "footwear"],
}

export const normalizeRecommendationTerm = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

const getProductTerms = (product: HttpTypes.StoreProduct) =>
  [
    product.title,
    product.subtitle,
    product.handle,
    product.collection?.title,
    product.collection?.handle,
    product.type?.value,
    ...(product.tags?.map((tag) => tag.value) ?? []),
  ]
    .map(normalizeRecommendationTerm)
    .filter(Boolean)

const termIncludes = (terms: string[], aliases: string[]) =>
  terms.some((term) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeRecommendationTerm(alias)

      return (
        term === normalizedAlias ||
        term.includes(` ${normalizedAlias} `) ||
        term.startsWith(`${normalizedAlias} `) ||
        term.endsWith(` ${normalizedAlias}`) ||
        term.includes(normalizedAlias)
      )
    })
  )

const getProductKind = (product: HttpTypes.StoreProduct): ProductKind => {
  const terms = getProductTerms(product)
  const matchedKind = (
    Object.keys(kindAliases) as Exclude<ProductKind, "other">[]
  ).find((kind) => termIncludes(terms, kindAliases[kind]))

  return matchedKind ?? "other"
}

const getColourFamilies = (product: HttpTypes.StoreProduct) => {
  const terms = getProductTerms(product)

  return Object.entries(colourFamilies)
    .filter(([, aliases]) => termIncludes(terms, aliases))
    .map(([family]) => family)
}

const variantInStock = (variant: HttpTypes.StoreProductVariant) => {
  if (!variant.manage_inventory || variant.allow_backorder) {
    return true
  }

  return (variant.inventory_quantity ?? 0) > 0
}

const productHasStock = (product: HttpTypes.StoreProduct) =>
  product.variants?.some(variantInStock) ?? false

export const isProductNZStock = (product: HttpTypes.StoreProduct) =>
  product.collection?.handle === "nz-stock" ||
  product.type?.value?.toLowerCase() === "nz stock" ||
  product.tags?.some(
    (tag) => normalizeRecommendationTerm(tag.value) === "nz stock"
  )

const getProductAmount = (product: HttpTypes.StoreProduct) =>
  getProductPrice({ product }).cheapestPrice?.calculated_price_number ?? Infinity

const scoreProduct = ({
  candidate,
  sourceProducts,
  cartGap,
}: {
  candidate: HttpTypes.StoreProduct
  sourceProducts: HttpTypes.StoreProduct[]
  cartGap: number | null
}) => {
  const candidateKind = getProductKind(candidate)
  const candidateColours = getColourFamilies(candidate)
  const price = getProductAmount(candidate)
  let score = 0

  sourceProducts.forEach((sourceProduct, index) => {
    const sourceKind = getProductKind(sourceProduct)
    const sourceColours = getColourFamilies(sourceProduct)
    const targetKinds = recommendationTargets[sourceKind]
    const targetIndex = targetKinds.indexOf(candidateKind)
    const sourceWeight = Math.max(0.55, 1 - index * 0.15)

    if (targetIndex >= 0) {
      score += (90 - targetIndex * 10) * sourceWeight
    }

    if (
      sourceColours.length &&
      candidateColours.some((colour) => sourceColours.includes(colour))
    ) {
      score += 26 * sourceWeight
    }
  })

  if (isProductNZStock(candidate)) {
    score += 18
  }

  if (cartGap && cartGap > 0 && cartGap <= CLOSE_TO_FREE_SHIPPING) {
    if (price <= cartGap + 15) {
      score += 28
    } else if (price <= 80) {
      score += 12
    }
  } else if (price <= 80) {
    score += 8
  }

  if (candidateKind === "socks" || candidateKind === "accessory") {
    score += 7
  }

  return score
}

export const getRecommendedProducts = ({
  sourceProducts,
  candidates,
  excludeProductIds,
  cartSubtotal,
  limit = 4,
}: RecommendationInput) => {
  const excluded = new Set(
    Array.from(excludeProductIds ?? [])
      .filter(Boolean)
      .map((id) => String(id))
  )
  const cartGap =
    cartSubtotal && cartSubtotal > 0
      ? Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal)
      : null

  return candidates
    .filter((candidate) => candidate.id && !excluded.has(candidate.id))
    .filter((candidate) => candidate.handle)
    .filter(productHasStock)
    .map((candidate) => ({
      product: candidate,
      score: scoreProduct({
        candidate,
        sourceProducts,
        cartGap,
      }),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      return getProductAmount(a.product) - getProductAmount(b.product)
    })
    .slice(0, limit)
    .map(({ product }) => product)
}
