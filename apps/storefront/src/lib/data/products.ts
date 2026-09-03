"use server"

import { sdk } from "@lib/config"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import {
  getRandomRotationSeed,
  mulberry32,
  sortProducts,
} from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { ProductFilterParams, SortOptions } from "./products.types"
import { getAuthHeaders } from "./cookies"
import { PRODUCT_CANDIDATE_FIELDS, PRODUCT_LIST_FIELDS } from "./product-fields"
import { getRegion, retrieveRegion } from "./regions"

const DEFAULT_PRODUCT_REVALIDATE_SECONDS = 60

const STOREFRONT_HIDDEN_PRODUCT_HANDLES = new Set([
  "shorts",
  "sweatpants",
  "sweatshirt",
  "t-shirt",
  "shipping-protection",
])

const STOREFRONT_HIDDEN_PRODUCT_TITLES = new Set([
  "medusa shorts",
  "medusa sweatpants",
  "medusa sweatshirt",
  "medusa t-shirt",
  "shipping protection",
])

const isPublishedProduct = (product: HttpTypes.StoreProduct) => {
  const status = (product as HttpTypes.StoreProduct & { status?: string })
    .status

  return status ? status === "published" : true
}

const isStorefrontDiscoverableProduct = (product: HttpTypes.StoreProduct) => {
  const handle = product.handle?.trim().toLowerCase()
  const title = product.title?.trim().toLowerCase()

  return !(
    (handle && STOREFRONT_HIDDEN_PRODUCT_HANDLES.has(handle)) ||
    (title && STOREFRONT_HIDDEN_PRODUCT_TITLES.has(title))
  )
}

const withProductStatusField = (fields?: string) => {
  if (!fields) {
    return PRODUCT_LIST_FIELDS
  }

  const requestedFields = fields
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean)

  if (!requestedFields.includes("status")) {
    requestedFields.splice(3, 0, "status")
  }

  return requestedFields.join(",")
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  revalidateSeconds,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
  /**
   * Opt in to a short time-based cache instead of the default no-store
   * fetch. Use only for non-critical, high-frequency call sites (nav search
   * index, cart drawer upsells) where a brief delay before catalogue edits
   * show up is an acceptable trade for not hitting the backend on every
   * page render.
   */
  revalidateSeconds?: number
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const fields = withProductStatusField(queryParams?.fields)
  const next = {
    revalidate: revalidateSeconds ?? DEFAULT_PRODUCT_REVALIDATE_SECONDS,
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          ...(region?.id ? { region_id: region.id } : {}),
          ...queryParams,
          fields,
        },
        headers,
        next,
      }
    )
    .then(async ({ products, count }) => {
      // Lightweight listing queries omit galleries. Resolve only products
      // missing a thumbnail so every consumer gets the same primary image.
      const missingImages = products.filter(
        (product) => !product.thumbnail && !product.images?.length
      )
      const galleries = missingImages.length
        ? await sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>(
            `/store/products`,
            {
              method: "GET",
              query: {
                id: missingImages.map((product) => product.id),
                fields: "id,*images",
                limit: missingImages.length,
              },
              headers,
              next,
            }
          )
        : { products: [] }
      const imagesById = new Map(
        galleries.products.map((product) => [product.id, product.images])
      )
      products = products.map((product) => {
        const images = product.images?.length
          ? product.images
          : imagesById.get(product.id)
        return {
          ...product,
          ...(images ? { images } : {}),
          thumbnail: product.thumbnail || images?.find((image) => image.url)?.url || null,
        }
      })
      const discoverableProducts = products.filter(
        (product) =>
          isPublishedProduct(product) &&
          isStorefrontDiscoverableProduct(product)
      )
      const discoverableCount =
        discoverableProducts.length === products.length
          ? count
          : Math.max(0, count - (products.length - discoverableProducts.length))
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products: discoverableProducts,
          count: discoverableCount,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

// How many products the "random" default samples from and shuffles. Kept in
// line with the other client-sorted paths' 200-product cap for cost, but the
// window rotates around the catalogue (see fetchRandomWindow) instead of
// always sitting on the first ~200 products the backend returns by default
// (effectively "most recently uploaded first").
const RANDOM_SAMPLE_SIZE = 200

const fetchRandomWindow = async ({
  queryParams,
  countryCode,
  revalidateSeconds,
}: {
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  countryCode: string
  revalidateSeconds?: number
}) => {
  const fields = queryParams?.fields ?? PRODUCT_LIST_FIELDS

  const countProbe = await listProducts({
    pageParam: 1,
    queryParams: { ...queryParams, fields, limit: 1 },
    countryCode,
    revalidateSeconds,
  })

  const count = countProbe.response.count
  const sampleSize = Math.min(count, RANDOM_SAMPLE_SIZE)
  const maxWindowOffset = Math.max(0, count - sampleSize)
  const random = mulberry32(getRandomRotationSeed())
  const windowOffset =
    maxWindowOffset > 0 ? Math.floor(random() * (maxWindowOffset + 1)) : 0

  const pageSize = 100
  const chunkCount = Math.max(1, Math.ceil(sampleSize / pageSize))

  const productGroups = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) => index).map((index) =>
      listProducts({
        pageParam: 1,
        queryParams: {
          ...queryParams,
          fields,
          limit: Math.min(pageSize, sampleSize - index * pageSize),
          offset: windowOffset + index * pageSize,
        },
        countryCode,
        revalidateSeconds,
      }).then(({ response }) => response.products)
    )
  )

  return { products: productGroups.flat(), count }
}

export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  revalidateSeconds,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  revalidateSeconds?: number
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12
  const requestedPageForRandom = Math.max(page, 1)

  if (sortBy === "random") {
    const { products: windowProducts, count } = await fetchRandomWindow({
      queryParams,
      countryCode,
      revalidateSeconds,
    })

    const sortedProducts = sortProducts(windowProducts, sortBy)
    const pageParam = (requestedPageForRandom - 1) * limit
    const nextPage = count > pageParam + limit ? pageParam + limit : null

    return {
      response: {
        products: sortedProducts.slice(pageParam, pageParam + limit),
        count,
      },
      nextPage,
      queryParams,
    }
  }

  // Medusa accepts up to 100 products per catalogue request. The old 24-item
  // batch size made a price/fulfilment sort pay for as many as five backend
  // round trips before it could render anything. Two larger batches cover
  // more candidates with substantially less request overhead.
  const pageSize = 100
  const requestedPage = Math.max(page, 1)
  const products: HttpTypes.StoreProduct[] = []

  const firstPage = await listProducts({
    pageParam: 1,
    queryParams: {
      ...queryParams,
      fields: queryParams?.fields ?? PRODUCT_LIST_FIELDS,
      limit: pageSize,
    },
    countryCode,
    revalidateSeconds,
  })

  products.push(...firstPage.response.products)

  const count = firstPage.response.count
  const maxProductsToSort = Math.min(count, 200)
  const remainingPages = Array.from(
    { length: Math.max(0, Math.ceil(maxProductsToSort / pageSize) - 1) },
    (_, index) => index + 2
  )

  // Once the first response gives us the catalogue count, the remaining
  // pages are independent. Fetch them together instead of paying for as many
  // as four additional Medusa round trips in sequence.
  const remainingProductGroups = await Promise.all(
    remainingPages.map((nextPageParam) =>
      listProducts({
        pageParam: nextPageParam,
        queryParams: {
          ...queryParams,
          fields: queryParams?.fields ?? PRODUCT_LIST_FIELDS,
          limit: pageSize,
        },
        countryCode,
        revalidateSeconds,
      }).then(({ response }) => response.products)
    )
  )

  products.push(...remainingProductGroups.flat())

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (requestedPage - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}

const getVariantOptionValue = (
  variant: HttpTypes.StoreProductVariant,
  optionTitle: string
) => {
  const matched = variant.options?.find(
    (option) =>
      option.option?.title?.toLowerCase() === optionTitle.toLowerCase()
  )?.value

  if (matched) {
    return matched
  }

  const values =
    variant.options
      ?.map((option) => option.value)
      .filter((value): value is string => Boolean(value)) ?? []

  return values.length === 1 ? values[0] : undefined
}

const normalizeFilterValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")

const footwearSizeRows = [
  ["USM 3.5", "USW 5", "35.5", "UK 3"],
  ["USM 4", "USW 5.5", "36", "UK 3.5"],
  ["USM 4.5", "USW 6", "36.5", "UK 4"],
  ["USM 5", "USW 6.5", "37.5", "UK 4.5"],
  ["USM 5.5", "USW 7", "38", "UK 5"],
  ["USM 6", "USW 7.5", "38.5", "UK 5.5"],
  ["USM 6.5", "USW 8", "39", "UK 6"],
  ["USM 7", "USW 8.5", "40", "UK 6.5"],
  ["USM 7.5", "USW 9", "40.5", "UK 7"],
  ["USM 8", "USW 9.5", "41", "UK 7.5"],
  ["USM 8.5", "USW 10", "42", "UK 8"],
  ["USM 9", "USW 10.5", "42.5", "UK 8.5"],
  ["USM 9.5", "USW 11", "43", "UK 9"],
  ["USM 10", "USW 11.5", "44", "UK 9.5"],
  ["USM 10.5", "USW 12", "44.5", "UK 10"],
  ["USM 11", "USW 12.5", "45", "UK 10.5"],
  ["USM 11.5", "USW 13", "45.5", "UK 11"],
  ["USM 12", "USW 13.5", "46", "UK 11.5"],
  ["USM 12.5", "USW 14", "47", "UK 12"],
  ["USM 13", "USW 14.5", "47.5"],
]

const normalizeSizeValue = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/^US\s*-\s*MEN\s*/, "USM ")
    .replace(/^US\s*-\s*WOMEN\s*/, "USW ")
    .replace(/^US MEN\s*/, "USM ")
    .replace(/^US WOMEN\s*/, "USW ")
    .replace(/^MENS?\s*/, "USM ")
    .replace(/^WOMENS?\s*/, "USW ")
    .replace(/\s+/g, " ")

const sizeAliases = (size: string) => {
  const normalized = normalizeSizeValue(size)
  const stripped = normalized.replace(/^(USM|USW|UK)\s/, "")
  const row = footwearSizeRows.find((values) =>
    values.map(normalizeSizeValue).includes(normalized)
  )

  return new Set([normalized, stripped, ...(row ?? []).map(normalizeSizeValue)])
}

const selectedSizeMatchesVariant = (
  selectedSizes: string[],
  variantSize?: string
) => {
  if (!variantSize) {
    return false
  }

  const variantAliases = sizeAliases(variantSize)

  return selectedSizes.some((selectedSize) =>
    Array.from(sizeAliases(selectedSize)).some((alias) =>
      variantAliases.has(alias)
    )
  )
}

const getProductColourHandles = (product: HttpTypes.StoreProduct) =>
  new Set(
    product.tags
      ?.map((tag) => tag.value.match(/^(?:colour|color)[:/](.+)$/i)?.[1])
      .filter((value): value is string => Boolean(value))
      .map(normalizeFilterValue) ?? []
  )

const productHasColour = (
  product: HttpTypes.StoreProduct,
  selectedColours: string[]
) => {
  const selected = new Set(selectedColours.map(normalizeFilterValue))
  const taggedColours = getProductColourHandles(product)

  if (Array.from(taggedColours).some((colour) => selected.has(colour))) {
    return true
  }

  return Boolean(
    product.variants?.some((variant) => {
      const colour = getVariantOptionValue(variant, "Colour")

      return colour ? selected.has(normalizeFilterValue(colour)) : false
    })
  )
}

const getCheapestAmount = (product: HttpTypes.StoreProduct) => {
  const amounts =
    product.variants
      ?.map((variant) => variant.calculated_price?.calculated_amount)
      .filter((amount): amount is number => typeof amount === "number") ?? []

  // Medusa prices in this store are already in display currency units.
  return amounts.length ? Math.min(...amounts) : 0
}

const productHasTagValue = (product: HttpTypes.StoreProduct, value: string) =>
  Boolean(
    product.tags?.some(
      (tag) => normalizeFilterValue(tag.value) === normalizeFilterValue(value)
    )
  )

const productHasCollectionHandle = (
  product: HttpTypes.StoreProduct,
  handle: string
) => product.collection?.handle === handle

const isLikelyPufferOrApparel = (product: HttpTypes.StoreProduct) => {
  const text = [
    product.title,
    product.handle,
    product.subtitle,
    product.collection?.title,
    product.type?.value,
    ...(product.tags?.map((tag) => tag.value) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return /(puffer|jacket|hoodie|sweatshirt|shirt|shorts|pants|outerwear|apparel|clothing)/.test(
    text
  )
}

const isApparelSize = (size: string) =>
  ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL"].includes(
    normalizeSizeValue(size).replace("XXL", "2XL")
  )

const selectedSizeMatchesProductVariant = (
  product: HttpTypes.StoreProduct,
  selectedSizes: string[],
  variantSize?: string
) => {
  if (!variantSize) {
    return false
  }

  const normalizedVariantSize = normalizeSizeValue(variantSize).replace(
    "XXL",
    "2XL"
  )
  const isEuVariant = /^\d{2}(?:\.5)?$/.test(normalizedVariantSize)

  if (
    isLikelyPufferOrApparel(product) ||
    isApparelSize(normalizedVariantSize)
  ) {
    return selectedSizes.some(
      (selectedSize) =>
        normalizeSizeValue(selectedSize).replace("XXL", "2XL") ===
        normalizedVariantSize
    )
  }

  if (isEuVariant) {
    return selectedSizes.some(
      (selectedSize) =>
        normalizeSizeValue(selectedSize) === normalizedVariantSize
    )
  }

  return selectedSizeMatchesVariant(selectedSizes, variantSize)
}

const productHasStockState = (
  product: HttpTypes.StoreProduct,
  stock: ProductFilterParams["stock"]
): boolean => {
  if (!stock) {
    return true
  }

  return getFulfilmentState(product).kind === stock
}

const mergeProductsById = (productGroups: HttpTypes.StoreProduct[][]) => {
  const productsById = new Map<string, HttpTypes.StoreProduct>()

  productGroups.flat().forEach((product) => {
    productsById.set(product.id, product)
  })

  return Array.from(productsById.values())
}

export async function listProductsFiltered({
  countryCode,
  filters = {},
}: {
  countryCode: string
  filters: ProductFilterParams
}) {
  const {
    category_id,
    collection_id,
    stock,
    nz_stock_collection_id,
    tag_id,
    tag_filter_groups,
    colour_tag_id,
    tag_product_ids,
    q,
    sizes,
    colours,
    colourTagFilterApplied,
    priceMin,
    priceMax,
    sortBy = "created_at",
    page = 1,
    limit = 12,
  } = filters

  const queryParams = {
    ...(category_id?.length ? { category_id } : {}),
    ...(collection_id?.length ? { collection_id } : {}),
    ...(q ? { q } : {}),
  } as HttpTypes.FindParams & HttpTypes.StoreProductParams

  const tagFilterIds = tag_filter_groups?.flat() ?? tag_id ?? []
  const productTagIdsToFetch = Array.from(
    new Set([...tagFilterIds, ...(colour_tag_id ?? [])])
  )
  const needsClientFiltering = Boolean(
    stock ||
      sizes?.length ||
      (colours?.length &&
        (!colourTagFilterApplied ||
          (colour_tag_id?.length ?? 0) > 1 ||
          Boolean(tag_id?.length))) ||
      priceMin !== undefined ||
      priceMax !== undefined ||
      sortBy === "ships_soonest" ||
      productTagIdsToFetch.length ||
      ![
        "created_at",
        "best_sellers",
        "price_asc",
        "price_desc",
        "random",
      ].includes(sortBy)
  )

  if (!needsClientFiltering) {
    if (sortBy === "price_asc" || sortBy === "price_desc" || sortBy === "random") {
      const { response, nextPage } = await listProductsWithSort({
        page,
        queryParams: {
          ...queryParams,
          fields: PRODUCT_CANDIDATE_FIELDS,
          limit,
        },
        sortBy,
        countryCode,
        revalidateSeconds: DEFAULT_PRODUCT_REVALIDATE_SECONDS,
      })

      return {
        products: response.products,
        total: response.count,
        hasMore: Boolean(nextPage),
        nextPage: nextPage ? page + 1 : null,
      }
    }

    const { response } = await listProducts({
      pageParam: page,
      queryParams: {
        ...queryParams,
        limit,
      },
      countryCode,
      revalidateSeconds: DEFAULT_PRODUCT_REVALIDATE_SECONDS,
    })

    return {
      products: response.products,
      total: response.count,
      hasMore: page * limit < response.count,
      nextPage: page * limit < response.count ? page + 1 : null,
    }
  }

  let productsForFiltering = productTagIdsToFetch.length
    ? mergeProductsById(
        await Promise.all(
          productTagIdsToFetch.map(async (productTagId) => {
            const { response } = await listProducts({
              pageParam: 1,
              queryParams: {
                ...queryParams,
                fields: PRODUCT_CANDIDATE_FIELDS,
                tag_id: [productTagId],
                limit: 100,
              },
              countryCode,
              revalidateSeconds: DEFAULT_PRODUCT_REVALIDATE_SECONDS,
            })

            return response.products
          })
        )
      )
    : (
        await listProductsWithSort({
          page: 1,
          queryParams: {
            ...queryParams,
            fields: PRODUCT_CANDIDATE_FIELDS,
            limit: 100,
          },
          sortBy: sortBy === "ships_soonest" ? "created_at" : sortBy,
          countryCode,
          revalidateSeconds: DEFAULT_PRODUCT_REVALIDATE_SECONDS,
        })
      ).response.products

  if (sortBy === "ships_soonest" && nz_stock_collection_id) {
    const { response } = await listProducts({
      pageParam: 1,
      queryParams: {
        collection_id: [nz_stock_collection_id],
        fields: PRODUCT_CANDIDATE_FIELDS,
        limit: 100,
      },
      countryCode,
      revalidateSeconds: DEFAULT_PRODUCT_REVALIDATE_SECONDS,
    })

    productsForFiltering = mergeProductsById([
      response.products,
      productsForFiltering,
    ])
  }

  let filtered = [...productsForFiltering]

  if (stock) {
    filtered = filtered.filter((product) =>
      productHasStockState(product, stock)
    )
  }

  if (tag_filter_groups?.length || tag_id?.length) {
    filtered = filtered.filter((product) => {
      const productTagIds = new Set(product.tags?.map((tag) => tag.id) ?? [])

      return (tag_filter_groups ?? [tag_id ?? []]).every((group) =>
        group.some((id) => {
          const taggedProductIds = tag_product_ids?.[id]

          return taggedProductIds?.length
            ? taggedProductIds.includes(product.id)
            : productTagIds.has(id)
        })
      )
    })
  }

  if (colour_tag_id?.length) {
    filtered = filtered.filter((product) => {
      const productTagIds = new Set(product.tags?.map((tag) => tag.id) ?? [])

      return colour_tag_id.some((id) => productTagIds.has(id))
    })
  }

  if (sizes?.length) {
    filtered = filtered.filter((product) =>
      product.variants?.some((variant) =>
        selectedSizeMatchesProductVariant(
          product,
          sizes,
          getVariantOptionValue(variant, "Size")
        )
      )
    )
  }

  if (colours?.length && !colourTagFilterApplied) {
    filtered = filtered.filter((product) => productHasColour(product, colours))
  }

  if (priceMin !== undefined || priceMax !== undefined) {
    filtered = filtered.filter((product) => {
      const cheapest = getCheapestAmount(product)

      if (priceMin !== undefined && cheapest < priceMin) {
        return false
      }

      if (priceMax !== undefined && cheapest > priceMax) {
        return false
      }

      return true
    })
  }

  if (sortBy === "ships_soonest") {
    filtered.sort((a, b) => {
      const aRank = productHasStockState(a, "nz-stock") ? 0 : 1
      const bRank = productHasStockState(b, "nz-stock") ? 0 : 1

      return aRank - bRank
    })
  }

  const total = filtered.length
  const offset = (Math.max(page, 1) - 1) * limit
  const paginated = filtered.slice(offset, offset + limit)
  const hasMore = offset + limit < total

  return {
    products: paginated,
    total,
    hasMore,
    nextPage: hasMore ? page + 1 : null,
  }
}
