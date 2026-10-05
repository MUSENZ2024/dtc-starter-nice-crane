"use client"

import { trackGaBeginCheckout } from "@lib/ga4"
import { trackMetaEvent } from "@lib/meta-pixel"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useRef } from "react"

type Props = {
  cart: HttpTypes.StoreCart
}

const isShippingProtection = (item: HttpTypes.StoreCartLineItem) =>
  (item.product_title ?? item.title ?? "").trim().toLowerCase() ===
  "shipping protection"

export default function MetaCheckoutTracker({ cart }: Props) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) {
      return
    }

    const storageKey = `muse:meta:initiate-checkout:${cart.id}`

    try {
      if (window.sessionStorage.getItem(storageKey)) {
        tracked.current = true
        return
      }
    } catch {
      // Tracking must still work when browser storage is unavailable.
    }

    tracked.current = true
    const items = (cart.items ?? []).filter(
      (item) => !isShippingProtection(item)
    )
    const contents = items.map((item) => ({
      id: item.product_id ?? item.variant_id ?? item.variant?.id ?? item.id,
      quantity: item.quantity,
      item_price: item.unit_price ?? 0,
    }))

    trackMetaEvent(
      "InitiateCheckout",
      {
        content_ids: contents.map((item) => item.id),
        content_type: "product",
        contents,
        currency: (cart.currency_code || "nzd").toUpperCase(),
        num_items: contents.reduce((total, item) => total + item.quantity, 0),
        value: cart.total ?? 0,
      },
      `checkout_${cart.id}`
    )

    trackGaBeginCheckout({
      currency: cart.currency_code || "nzd",
      value: cart.total ?? 0,
      items: contents.map((item) => ({
        id: item.id,
        name: items.find((i) => (i.product_id ?? i.variant_id ?? i.variant?.id ?? i.id) === item.id)?.product_title ?? "MUSE item",
        price: item.item_price,
        quantity: item.quantity,
      })),
    })

    try {
      window.sessionStorage.setItem(storageKey, "1")
    } catch {
      // The event has already been queued or sent.
    }
  }, [cart])

  return null
}
