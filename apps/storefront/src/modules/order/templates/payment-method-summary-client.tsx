"use client"

import { useEffect, useState } from "react"

type PaymentMethodSummaryClientProps = {
  initialTitle: string
  amountText: string
}

export default function PaymentMethodSummaryClient({
  initialTitle,
  amountText,
}: PaymentMethodSummaryClientProps) {
  const [title, setTitle] = useState(initialTitle)

  useEffect(() => {
    const clientSecret = window.sessionStorage.getItem(
      "muse:lastStripePaymentClientSecret"
    )

    if (!clientSecret) {
      return
    }

    const controller = new AbortController()

    fetch(
      `/api/stripe/payment-summary?client_secret=${encodeURIComponent(
        clientSecret
      )}`,
      { signal: controller.signal }
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((summary: { title?: string } | null) => {
        if (summary?.title) {
          setTitle(summary.title)
        }
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [])

  return (
    <>
      <p
        className="text-[13.5px] font-bold text-[#0A0A0A]"
        data-testid="payment-method"
      >
        {title}
      </p>
      <p className="text-[12px] text-[#666]" data-testid="payment-amount">
        {amountText}
      </p>
    </>
  )
}
