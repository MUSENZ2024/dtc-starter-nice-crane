import { HttpTypes } from "@medusajs/types"

import {
  getDeliveredByLabel,
  getDeliveryDateRange,
} from "@lib/util/delivery-estimate"

export type FulfilmentKind = "nz-stock" | "standard-delivery"

export type FulfilmentState = {
  kind: FulfilmentKind
  label: "NZ Stock" | "Standard Delivery"
  shortLabel: "NZ Stock" | "Standard"
  labelColor: "green" | "orange"
  badgeClassName: string
  dotClassName: string
  deliveryRange: string
  deliveryLabel: string
  supportCopy: string
  dropLabel?: string
  eyebrow: string
}

type ProductLike = Partial<HttpTypes.StoreProduct> & {
  categories?: Array<{ handle?: string | null; name?: string | null }> | null
  metadata?: Record<string, unknown> | null
}

type LineLike = Partial<
  HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
> & {
  product?: ProductLike | null
  product_handle?: string | null
  product_title?: string | null
  metadata?: Record<string, unknown> | null
}

const NZ_STOCK_ALIASES = [
  "nz-stock",
  "nz stock",
  "new zealand stock",
  "auckland stock",
  "ships in 1-3",
  "ships in 1–3",
]

const STANDARD_ALIASES = [
  "standard-delivery",
  "standard delivery",
  "13-16",
  "13–16",
  "overseas warehouse",
]

const humanizeToken = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const normalize = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

const metadataValues = (metadata?: Record<string, unknown> | null) =>
  Object.entries(metadata ?? {}).flatMap(([key, value]) => {
    if (typeof value === "string" || typeof value === "number") {
      return [`${key} ${String(value)}`]
    }

    if (Array.isArray(value)) {
      return value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map((item) => `${key} ${String(item)}`)
    }

    return []
  })

const getProduct = (item: ProductLike | LineLike): ProductLike => {
  if ("product" in item && item.product) {
    return item.product
  }

  return item as ProductLike
}

const getSearchParts = (item: ProductLike | LineLike) => {
  const product = getProduct(item)
  const line = item as LineLike

  return [
    product.handle,
    product.title,
    product.subtitle,
    product.description,
    product.collection?.handle,
    product.collection?.title,
    product.type?.value,
    line.product_handle,
    line.product_title,
    line.title,
    line.variant?.title,
    ...(product.tags?.map((tag) => tag.value) ?? []),
    ...(product.categories?.flatMap((category) => [
      category.handle,
      category.name,
    ]) ?? []),
    ...metadataValues(product.metadata),
    ...metadataValues(line.metadata),
  ].filter(Boolean) as string[]
}

const hasAlias = (parts: string[], aliases: string[]) => {
  const haystack = parts.join(" ").toLowerCase()

  return aliases.some((alias) => haystack.includes(alias))
}

const findDropLabel = (item: ProductLike | LineLike) => {
  const product = getProduct(item)
  const explicit =
    product.metadata?.drop_label ??
    product.metadata?.drop ??
    product.metadata?.season_drop

  if (typeof explicit === "string" && explicit.trim()) {
    return humanizeToken(explicit)
  }

  const candidates = [
    ...(product.tags?.map((tag) => tag.value) ?? []),
    product.collection?.handle,
    product.collection?.title,
    ...(product.categories?.flatMap((category) => [
      category.handle,
      category.name,
    ]) ?? []),
  ].filter((value): value is string => Boolean(value))

  const drop = candidates.find((candidate) => {
    const value = normalize(candidate)
    return value.includes("drop") && !STANDARD_ALIASES.includes(value)
  })

  return drop ? humanizeToken(drop) : undefined
}

export function getFulfilmentState(
  item: ProductLike | LineLike | null | undefined
): FulfilmentState {
  const parts = item ? getSearchParts(item) : []
  const isNzStock = hasAlias(parts, NZ_STOCK_ALIASES)
  const isStandard = hasAlias(parts, STANDARD_ALIASES)
  const kind: FulfilmentKind =
    isNzStock && !isStandard ? "nz-stock" : "standard-delivery"
  const dropLabel = item ? findDropLabel(item) : undefined

  if (kind === "nz-stock") {
    const deliveryRange = getDeliveryDateRange(1, 3)

    return {
      kind,
      label: "NZ Stock",
      shortLabel: "NZ Stock",
      labelColor: "green",
      badgeClassName: "bg-muse-green text-white",
      dotClassName: "bg-muse-green",
      deliveryRange,
      deliveryLabel: "Ships in 1-3 days",
      supportCopy: "Held locally and usually dispatched from Auckland.",
      dropLabel,
      eyebrow: dropLabel ? `${dropLabel} · NZ Stock` : "NZ Stock",
    }
  }

  const deliveryRange = getDeliveryDateRange(13, 16)

  return {
    kind,
    label: "Standard Delivery",
    shortLabel: "Standard",
    labelColor: "orange",
    badgeClassName: "bg-muse-orange text-white",
    dotClassName: "bg-muse-orange",
    deliveryRange,
    deliveryLabel: getDeliveredByLabel(13, 16),
    supportCopy: "Tracked delivery with NZ Post on the final leg.",
    dropLabel,
    eyebrow: dropLabel
      ? `${dropLabel} · Standard Delivery`
      : "Standard Delivery",
  }
}

export function getCartFulfilmentSummary(
  items: Array<ProductLike | LineLike> | null | undefined
) {
  const states = (items ?? []).map(getFulfilmentState)
  const hasNzStock = states.some((state) => state.kind === "nz-stock")
  const hasStandard = states.some((state) => state.kind === "standard-delivery")
  const fullOrderRange =
    hasStandard || !hasNzStock
      ? getDeliveryDateRange(13, 16)
      : getDeliveryDateRange(1, 3)

  return {
    states,
    hasMixed: hasNzStock && hasStandard,
    fullOrderRange,
    fullOrderLabel:
      hasNzStock && hasStandard
        ? `Some items ship sooner. Full order estimate: ${fullOrderRange}`
        : `Full order estimate: ${fullOrderRange}`,
  }
}
