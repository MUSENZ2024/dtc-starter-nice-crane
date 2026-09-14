import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export type ProductKind =
  | "puffer"
  | "footwear"
  | "pants"
  | "hoodie"
  | "socks"
  | "bag"
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

type CandidatePoolInput = Omit<RecommendationInput, "limit"> & {
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
  bag: ["bag", "bags", "crossbody", "handbag", "shoulder bag", "tote"],
  accessory: [
    "accessory",
    "accessories",
    "beanie",
    "cap",
    "hat",
    "belt",
    "wallet",
  ],
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
  footwear: [
    "socks",
    "pants",
    "accessory",
    "top",
    "hoodie",
    "puffer",
    "footwear",
    "bag",
  ],
  pants: ["hoodie", "puffer", "footwear", "socks"],
  hoodie: ["pants", "puffer", "footwear", "accessory"],
  socks: ["footwear", "pants"],
  bag: ["top", "puffer", "hoodie", "pants", "footwear", "accessory"],
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
    product.metadata?.brand,
    product.metadata?.model,
    product.metadata?.style,
    product.metadata?.style_code,
    product.metadata?.colourway,
    product.metadata?.full_colourway,
    product.metadata?.primary_colour,
    product.metadata?.secondary_colour,
    product.metadata?.colour_family,
    product.metadata?.colour_tags,
    ...(product.tags?.map((tag) => tag.value) ?? []),
  ]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(
      (value): value is string | number =>
        typeof value === "string" || typeof value === "number"
    )
    .map((value) => normalizeRecommendationTerm(String(value)))
    .filter(Boolean)

const termIncludes = (terms: string[], aliases: string[]) =>
  terms.some((term) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeRecommendationTerm(alias)

      return (
        term === normalizedAlias ||
        term.includes(` ${normalizedAlias} `) ||
        term.startsWith(`${normalizedAlias} `) ||
        term.endsWith(` ${normalizedAlias}`)
      )
    })
  )

export const getProductKind = (product: HttpTypes.StoreProduct): ProductKind => {
  const terms = getProductTerms(product)
  const matchedKind = (
    Object.keys(kindAliases) as Exclude<ProductKind, "other">[]
  ).find((kind) => termIncludes(terms, kindAliases[kind]))

  return matchedKind ?? "other"
}

const getMetadataTerm = (
  product: HttpTypes.StoreProduct,
  key: "brand" | "model"
) => {
  const value = product.metadata?.[key]

  return typeof value === "string" ? normalizeRecommendationTerm(value) : ""
}

const getStableTieBreaker = (
  candidate: HttpTypes.StoreProduct,
  sourceProducts: HttpTypes.StoreProduct[]
) => {
  const value = `${sourceProducts.map((product) => product.id).join(":")}:${candidate.id}`

  return Array.from(value).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0
  )
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
    const sourceBrand = getMetadataTerm(sourceProduct, "brand")
    const candidateBrand = getMetadataTerm(candidate, "brand")
    const sourceModel = getMetadataTerm(sourceProduct, "model")
    const candidateModel = getMetadataTerm(candidate, "model")

    if (targetIndex >= 0) {
      score += (90 - targetIndex * 10) * sourceWeight
    }

    if (
      sourceColours.length &&
      candidateColours.some((colour) => sourceColours.includes(colour))
    ) {
      score += 48 * sourceWeight
    }

    // Same-brand/model products are useful alternatives, while colour and
    // target-kind matches keep supplementary recommendations outfit-aware.
    if (sourceBrand && sourceBrand === candidateBrand) {
      score += (candidateKind === sourceKind ? 18 : 8) * sourceWeight
    }

    if (sourceModel && sourceModel === candidateModel) {
      score += 24 * sourceWeight
    }

    if (candidateKind === sourceKind) {
      const sourcePrice = getProductAmount(sourceProduct)
      if (Number.isFinite(sourcePrice) && Number.isFinite(price)) {
        const priceRatio = Math.min(sourcePrice, price) / Math.max(sourcePrice, price)
        score += priceRatio * 12 * sourceWeight
      }
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
  const rankedCandidates = rankRecommendationCandidates({
    sourceProducts,
    candidates,
    excludeProductIds,
    cartSubtotal,
    requireStock: true,
  })

  // Avoid a row made entirely of one generic product type when relevant
  // supplementary categories are available. Backfill afterwards so sparse
  // catalogues can still show a complete row.
  const selected: typeof rankedCandidates = []
  const selectedIds = new Set<string>()
  const kindCounts = new Map<ProductKind, number>()

  rankedCandidates.forEach((candidate) => {
    const kind = getProductKind(candidate.product)
    if (selected.length < limit && (kindCounts.get(kind) ?? 0) < 2) {
      selected.push(candidate)
      selectedIds.add(candidate.product.id)
      kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1)
    }
  })

  rankedCandidates.forEach((candidate) => {
    if (selected.length < limit && !selectedIds.has(candidate.product.id)) {
      selected.push(candidate)
      selectedIds.add(candidate.product.id)
    }
  })

  return selected.map(({ product }) => product)
}

const rankRecommendationCandidates = ({
  sourceProducts,
  candidates,
  excludeProductIds,
  cartSubtotal,
  requireStock,
}: Omit<RecommendationInput, "limit"> & { requireStock: boolean }) => {
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
    .filter((candidate) => !requireStock || productHasStock(candidate))
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

      const priceDifference =
        getProductAmount(a.product) - getProductAmount(b.product)

      if (Number.isFinite(priceDifference) && priceDifference !== 0) {
        return priceDifference
      }

      return (
        getStableTieBreaker(a.product, sourceProducts) -
        getStableTieBreaker(b.product, sourceProducts)
      )
    })
}

// Rank a lightweight catalogue index before fetching expensive variant,
// inventory and price data for only the strongest candidates.
export const getRecommendationCandidatePool = ({
  limit = 32,
  ...input
}: CandidatePoolInput) => {
  const ranked = rankRecommendationCandidates({
    ...input,
    requireStock: false,
  })
  const selected: typeof ranked = []
  const selectedIds = new Set<string>()
  const kindCounts = new Map<ProductKind, number>()
  const maxPerKind = Math.max(2, Math.ceil(limit / 6))

  ranked.forEach((candidate) => {
    const kind = getProductKind(candidate.product)
    if (selected.length < limit && (kindCounts.get(kind) ?? 0) < maxPerKind) {
      selected.push(candidate)
      selectedIds.add(candidate.product.id)
      kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1)
    }
  })

  ranked.forEach((candidate) => {
    if (selected.length < limit && !selectedIds.has(candidate.product.id)) {
      selected.push(candidate)
      selectedIds.add(candidate.product.id)
    }
  })

  return selected.map(({ product }) => product)
}
