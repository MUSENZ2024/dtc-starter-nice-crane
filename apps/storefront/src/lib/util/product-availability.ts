type AvailabilityVariant = {
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
  metadata?: Record<string, unknown> | null
}

type ProductWithAvailability = {
  variants?: AvailabilityVariant[] | null
}

const getVariantStockQuantity = (variant: AvailabilityVariant) => {
  if (typeof variant.inventory_quantity === "number") {
    return variant.inventory_quantity
  }

  const metadataQuantity = variant.metadata?.nz_stock_quantity

  if (typeof metadataQuantity === "number") {
    return metadataQuantity
  }

  if (typeof metadataQuantity === "string") {
    const parsed = Number.parseInt(metadataQuantity, 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  return 0
}

export const isVariantPurchasable = (variant?: AvailabilityVariant | null) => {
  if (!variant) {
    return false
  }

  if (!variant.manage_inventory || variant.allow_backorder) {
    return true
  }

  return getVariantStockQuantity(variant) > 0
}

export const isProductOutOfStock = (
  product?: ProductWithAvailability | null
) => {
  const variants = product?.variants ?? []

  return variants.length > 0 && !variants.some(isVariantPurchasable)
}
