export const META_PIXEL_ID = "26034408302830626"

export type MetaPixelParameters = Record<string, unknown>

type QueuedMetaEvent = {
  name: string
  parameters: MetaPixelParameters
  eventId?: string
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: (...args: unknown[]) => void
  }
}

const queuedEvents: QueuedMetaEvent[] = []

function sendMetaEvent({ name, parameters, eventId }: QueuedMetaEvent) {
  if (typeof window === "undefined" || !window.fbq) {
    return false
  }

  if (eventId) {
    window.fbq("track", name, parameters, { eventID: eventId })
  } else {
    window.fbq("track", name, parameters)
  }

  return true
}

export function trackMetaEvent(
  name: string,
  parameters: MetaPixelParameters = {},
  eventId?: string
) {
  const event = { name, parameters, eventId }

  if (!sendMetaEvent(event) && typeof window !== "undefined") {
    queuedEvents.push(event)
  }
}

export function flushMetaPixelEvents() {
  if (typeof window === "undefined" || !window.fbq) {
    return
  }

  queuedEvents.splice(0).forEach(sendMetaEvent)
}

type AddToCartEvent = {
  contentId: string
  contentName: string
  currency: string
  value: number
  quantity?: number
}

export function trackMetaAddToCart({
  contentId,
  contentName,
  currency,
  value,
  quantity = 1,
}: AddToCartEvent) {
  trackMetaEvent("AddToCart", {
    content_ids: [contentId],
    content_name: contentName,
    content_type: "product",
    contents: [{ id: contentId, quantity, item_price: value }],
    currency: currency.toUpperCase(),
    value: value * quantity,
  })
}
