"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { ProductFilterParams, SortOptions } from "./products.types"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { PRODUCT_LIST_FIELDS } from "./product-fields"
import { getRegion, retrieveRegion } from "./regions"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
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

  const next = {
    ...(await getCacheOptions("products")),
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
          fields: PRODUCT_LIST_FIELDS,
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12
  const pageSize = 24
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
  })

  products.push(...firstPage.response.products)

  const count = firstPage.response.count
  const maxProductsToSort = Math.min(count, 120)

  for (
    let pageParam = 2;
    products.length < maxProductsToSort;
    pageParam += 1
  ) {
    const {
      response: { products: nextProducts },
    } = await listProducts({
      pageParam,
      queryParams: {
        ...queryParams,
        fields: queryParams?.fields ?? PRODUCT_LIST_FIELDS,
        limit: pageSize,
      },
      countryCode,
    })

    if (!nextProducts.length) {
      break
    }

    products.push(...nextProducts)
  }

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
    (option) => option.option?.title?.toLowerCase() === optionTitle.toLowerCase()
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
  value.trim().toLowerCase().replace(/[\s_]+/g, "-")

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

  return amounts.length ? Math.min(...amounts) / 100 : 0
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

  const normalizedVariantSize = normalizeSizeValue(variantSize).replace("XXL", "2XL")
  const isEuVariant = /^\d{2}(?:\.5)?$/.test(normalizedVariantSize)

  if (isLikelyPufferOrApparel(product) || isApparelSize(normalizedVariantSize)) {
    return selectedSizes.some(
      (selectedSize) =>
        normalizeSizeValue(selectedSize).replace("XXL", "2XL") ===
        normalizedVariantSize
    )
  }

  if (isEuVariant) {
    return selectedSizes.some(
      (selectedSize) => normalizeSizeValue(selectedSize) === normalizedVariantSize
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

  const haystack = [
    product.collection?.handle,
    product.collection?.title,
    product.type?.value,
    product.subtitle,
    product.description,
    ...(product.tags?.map((tag) => tag.value) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (stock === "nz-stock") {
    return (
      productHasCollectionHandle(product, "nz-stock") ||
      productHasTagValue(product, "nz-stock") ||
      haystack.includes("nz-stock") ||
      haystack.includes("nz stock") ||
      haystack.includes("ships in 1-3")
    )
  }

  const explicitlyStandard =
    productHasCollectionHandle(product, "standard-delivery") ||
    productHasTagValue(product, "standard-delivery") ||
    haystack.includes("standard-delivery") ||
    haystack.includes("standard delivery") ||
    haystack.includes("13-16") ||
    haystack.includes("13–16")

  return explicitlyStandard || !productHasStockState(product, "nz-stock")
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
    tag_id,
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

  const serverTagIds =
    tag_id?.length || (colour_tag_id?.length === 1 && !tag_id?.length)
      ? [...(tag_id ?? []), ...(tag_id?.length ? [] : colour_tag_id ?? [])]
      : undefined

  const queryParams = {
    ...(category_id?.length ? { category_id } : {}),
    ...(collection_id?.length ? { collection_id } : {}),
    ...(serverTagIds?.length ? { tag_id: serverTagIds } : {}),
    ...(q ? { q } : {}),
  } as HttpTypes.FindParams & HttpTypes.StoreProductParams

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
      (tag_id?.length ?? 0) > 1 ||
      !["created_at", "best_sellers", "price_asc", "price_desc"].includes(sortBy)
  )

  if (!needsClientFiltering) {
    if (sortBy === "price_asc" || sortBy === "price_desc") {
      const { response, nextPage } = await listProductsWithSort({
        page,
        queryParams: {
          ...queryParams,
          limit,
        },
        sortBy,
        countryCode,
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
    })

    return {
      products: response.products,
      total: response.count,
      hasMore: page * limit < response.count,
      nextPage: page * limit < response.count ? page + 1 : null,
    }
  }

  const productsForFiltering =
    colour_tag_id?.length && colourTagFilterApplied
      ? mergeProductsById(
          await Promise.all(
            colour_tag_id.map(async (colourTagId) => {
              const { response } = await listProducts({
                pageParam: 1,
                queryParams: {
                  ...queryParams,
                  tag_id: [colourTagId],
                  limit: 100,
                },
                countryCode,
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
              limit: 100,
            },
            sortBy: sortBy === "ships_soonest" ? "created_at" : sortBy,
            countryCode,
          })
        ).response.products

  let filtered = [...productsForFiltering]

  if (stock) {
    filtered = filtered.filter((product) => productHasStockState(product, stock))
  }

  if (tag_id?.length) {
    filtered = filtered.filter((product) => {
      const productTagIds = new Set(product.tags?.map((tag) => tag.id) ?? [])

      return tag_id.every((id) => {
        const taggedProductIds = tag_product_ids?.[id]

        return taggedProductIds?.length
          ? taggedProductIds.includes(product.id)
          : productTagIds.has(id)
      })
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
      const aRank =
        productHasCollectionHandle(a, "nz-stock") ||
        productHasStockState(a, "nz-stock")
          ? 0
          : 1
      const bRank =
        productHasCollectionHandle(b, "nz-stock") ||
        productHasStockState(b, "nz-stock")
          ? 0
          : 1

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
