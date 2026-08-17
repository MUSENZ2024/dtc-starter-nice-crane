"use client"

import { trackMetaEvent } from "@lib/meta-pixel"
import { useEffect, useRef } from "react"

type Props = {
  contentId: string
  contentName: string
  currency: string
  value: number
}

export default function MetaViewContentTracker({
  contentId,
  contentName,
  currency,
  value,
}: Props) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) {
      return
    }

    tracked.current = true
    trackMetaEvent("ViewContent", {
      content_ids: [contentId],
      content_name: contentName,
      content_type: "product",
      currency: currency.toUpperCase(),
      value,
    })
  }, [contentId, contentName, currency, value])

  return null
}
