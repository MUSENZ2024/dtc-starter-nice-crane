export type FulfillmentItemReference = {
  line_item_id?: string | null
  quantity?: unknown
}

export type FulfillmentReference = {
  id: string
  shipped_at?: string | Date | null
  items?: FulfillmentItemReference[] | null
}

export type OrderItemQuantity = {
  id: string
  quantity: unknown
}

function toQuantity(value: unknown): number {
  if (typeof value === "number") return value
  if (value && typeof value === "object" && "numeric_" in (value as Record<string, unknown>)) {
    return Number((value as { numeric_: unknown }).numeric_) || 0
  }
  const coerced = Number(value)
  return Number.isFinite(coerced) ? coerced : 0
}

export function getShipmentItemQuantities(items?: FulfillmentItemReference[] | null): Map<string, number> {
  const quantities = new Map<string, number>()
  for (const item of items || []) {
    if (!item.line_item_id) continue
    quantities.set(item.line_item_id, (quantities.get(item.line_item_id) || 0) + toQuantity(item.quantity))
  }
  return quantities
}

export function getRemainingItemQuantities({ orderItems, fulfillments, currentFulfillmentId }: {
  orderItems: OrderItemQuantity[]
  fulfillments: FulfillmentReference[]
  currentFulfillmentId: string
}): Map<string, number> {
  const shippedQuantities = new Map<string, number>()
  for (const fulfillment of fulfillments) {
    if (!fulfillment.shipped_at && fulfillment.id !== currentFulfillmentId) continue
    for (const [lineItemId, quantity] of getShipmentItemQuantities(fulfillment.items)) {
      shippedQuantities.set(lineItemId, (shippedQuantities.get(lineItemId) || 0) + quantity)
    }
  }
  return new Map(orderItems
    .map((item) => [item.id, Math.max(0, toQuantity(item.quantity) - (shippedQuantities.get(item.id) || 0))] as const)
    .filter(([, quantity]) => quantity > 0))
}
