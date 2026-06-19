import { StoreProductTag } from "@lib/data/product-tags"

export type TagFilterOption = {
  value: string
  label: string
  count: number
}

export type LineFilterOption = TagFilterOption & {
  brand: string
}

type TagGroup =
  | "brand"
  | "line"
  | "model"
  | "badge"
  | "drop"
  | "status"
  | "colour"
  | "color"

type NormalizedTag = StoreProductTag & {
  group?: TagGroup
  handle: string
  label: string
  count: number
}

const GROUP_PREFIX_PATTERN =
  /^(brand|line|model|badge|drop|status|colour|color)[:/](.+)$/i

const SPECIAL_WORD_LABELS: Record<string, string> = {
  asics: "ASICS",
  nz: "NZ",
  uk: "UK",
  usa: "USA",
  ugg: "UGG",
  xt: "XT",
  v2k: "V2K",
  dr: "Dr.",
}

const STATUS_HANDLES = new Set([
  "sale",
  "best-seller",
  "best-sellers",
  "new-arrival",
  "new-arrivals",
])

const getProductCount = (tag: StoreProductTag) => tag.products?.length ?? 0

const titleize = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase()

      if (SPECIAL_WORD_LABELS[lower]) {
        return SPECIAL_WORD_LABELS[lower]
      }

      if (/^\d+[a-z]?$/i.test(part)) {
        return part.toUpperCase()
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(" ")

const normalizeTag = (tag: StoreProductTag): NormalizedTag => {
  const match = tag.value.match(GROUP_PREFIX_PATTERN)
  const group = match?.[1]?.toLowerCase() as TagGroup | undefined
  const handle = match?.[2] ?? tag.value
  const label =
    typeof tag.name === "string" && tag.name.trim()
      ? tag.name.trim()
      : titleize(handle)

  return {
    ...tag,
    group,
    handle,
    label,
    count: getProductCount(tag),
  }
}

const isBadgeTag = (tag: NormalizedTag) =>
  tag.group === "badge" ||
  tag.group === "drop" ||
  tag.group === "status" ||
  STATUS_HANDLES.has(tag.handle) ||
  tag.handle.endsWith("-drop") ||
  tag.handle.endsWith("-drops")

const isColourTag = (tag: NormalizedTag) =>
  tag.group === "colour" || tag.group === "color"

const findBrandForLine = (line: NormalizedTag, brands: NormalizedTag[]) =>
  brands
    .filter((brand) => line.handle.startsWith(`${brand.handle}-`))
    .sort((a, b) => b.handle.length - a.handle.length)[0]

const getLineLabel = (line: NormalizedTag, brand: NormalizedTag) => {
  const lineHandle = line.handle.replace(`${brand.handle}-`, "")
  const fallback = titleize(lineHandle)

  if (line.label === titleize(line.handle)) {
    return fallback
  }

  return (
    line.label.replace(new RegExp(`^${brand.label}\\s+`, "i"), "") || fallback
  )
}

const byCountThenLabel = <T extends { count: number; label: string }>(
  a: T,
  b: T
) => b.count - a.count || a.label.localeCompare(b.label)

export const buildDynamicTagFilters = (tags: StoreProductTag[]) => {
  const normalized = tags
    .map(normalizeTag)
    .filter((tag) => tag.value && tag.count > 0)
  const merchTags = normalized.filter(
    (tag) => !isBadgeTag(tag) && !isColourTag(tag)
  )
  const explicitBrands = merchTags.filter((tag) => tag.group === "brand")

  const inferredBrands = merchTags.filter((tag) =>
    merchTags.some(
      (candidate) =>
        candidate.value !== tag.value &&
        candidate.handle.startsWith(`${tag.handle}-`)
    )
  )

  const brandByValue = new Map<string, NormalizedTag>()

  ;[...explicitBrands, ...inferredBrands].forEach((tag) => {
    brandByValue.set(tag.value, tag)
  })

  const lineTags = merchTags.filter((tag) => {
    if (tag.group === "line" || tag.group === "model") {
      return true
    }

    return Boolean(findBrandForLine(tag, Array.from(brandByValue.values())))
  })

  const lineValues = new Set(lineTags.map((tag) => tag.value))

  merchTags.forEach((tag) => {
    if (!lineValues.has(tag.value)) {
      brandByValue.set(tag.value, tag)
    }
  })

  const brandTags = Array.from(brandByValue.values()).sort(byCountThenLabel)
  const brands = brandTags.map<TagFilterOption>((tag) => ({
    value: tag.value,
    label: tag.label,
    count: tag.count,
  }))

  const lines = lineTags
    .map((tag) => {
      const brand = findBrandForLine(tag, brandTags)

      if (!brand) {
        return null
      }

      return {
        value: tag.value,
        label: getLineLabel(tag, brand),
        brand: brand.value,
        count: tag.count,
      }
    })
    .filter((item): item is LineFilterOption => Boolean(item))
    .sort(byCountThenLabel)

  const badges = normalized
    .filter(isBadgeTag)
    .map<TagFilterOption>((tag) => ({
      value: tag.value,
      label: tag.label,
      count: tag.count,
    }))
    .sort(byCountThenLabel)

  const tagLabels = Object.fromEntries([
    ...brands.map((tag) => [tag.value, tag.label]),
    ...lines.map((tag) => [tag.value, tag.label]),
    ...badges.map((tag) => [tag.value, tag.label]),
  ])

  return {
    brands,
    lines,
    badges,
    tagLabels,
  }
}
