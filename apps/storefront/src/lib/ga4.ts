declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackGaEvent(name: string, parameters: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return
  }

  window.gtag("event", name, parameters)
}

type GaItem = {
  id: string
  name: string
  price: number
  quantity?: number
}

export function trackGaAddToCart({
  id,
  name,
  price,
  quantity = 1,
  currency,
}: GaItem & { currency: string }) {
  trackGaEvent("add_to_cart", {
    currency: currency.toUpperCase(),
    value: price * quantity,
    items: [{ item_id: id, item_name: name, price, quantity }],
  })
}

export function trackGaBeginCheckout({
  currency,
  value,
  items,
}: {
  currency: string
  value: number
  items: { id: string; name: string; price: number; quantity: number }[]
}) {
  trackGaEvent("begin_checkout", {
    currency: currency.toUpperCase(),
    value,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  })
}
