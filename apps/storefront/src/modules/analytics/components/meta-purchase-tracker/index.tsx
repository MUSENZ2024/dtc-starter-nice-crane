"use client"

import { trackMetaEvent } from "@lib/meta-pixel"
import { useEffect, useRef } from "react"

type PurchaseContent = {
  id: string
  quantity: number
  item_price: number
}

type Props = {
  orderId: string
  currency: string
  value: number
  contents: PurchaseContent[]
}

export default function MetaPurchaseTracker({
  orderId,
  currency,
  value,
  contents,
}: Props) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) {
      return
    }

    const storageKey = `muse:meta:purchase:${orderId}`

    try {
      if (window.localStorage.getItem(storageKey)) {
        tracked.current = true
        return
      }
    } catch {
      // Tracking must still work when browser storage is unavailable.
    }

    tracked.current = true
    trackMetaEvent(
      "Purchase",
      {
        content_ids: contents.map((item) => item.id),
        content_type: "product",
        contents,
        currency: currency.toUpperCase(),
        num_items: contents.reduce((total, item) => total + item.quantity, 0),
        value,
      },
      `purchase_${orderId}`
    )

    try {
      window.localStorage.setItem(storageKey, "1")
    } catch {
      // The event has already been queued or sent.
    }
  }, [contents, currency, orderId, value])

  return null
}
