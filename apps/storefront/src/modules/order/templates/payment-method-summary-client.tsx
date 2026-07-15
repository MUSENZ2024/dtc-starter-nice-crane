"use client"

import { useEffect, useState } from "react"

type PaymentMethodSummaryClientProps = {
  initialTitle: string
  amountText: string
}

const badgeByType: Record<string, { src: string; alt: string }> = {
  afterpay_clearpay: { src: "/payment-badges/Afterpay.png", alt: "Afterpay" },
  klarna: { src: "/payment-badges/Klarna.png", alt: "Klarna" },
  paypal: { src: "/payment-badges/paypal.png", alt: "PayPal" },
}

function CardIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

export default function PaymentMethodSummaryClient({
  initialTitle,
  amountText,
}: PaymentMethodSummaryClientProps) {
  const [title, setTitle] = useState(initialTitle)
  const [badge, setBadge] = useState<{ src: string; alt: string } | null>(null)

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
      .then((summary: { title?: string; type?: string } | null) => {
        if (summary?.title) {
          setTitle(summary.title)
        }
        if (summary?.type && badgeByType[summary.type]) {
          setBadge(badgeByType[summary.type])
        }
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [])

  return (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A0A0A] text-[#C8D050]">
        {badge ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={badge.src}
            alt={badge.alt}
            className="h-6 w-6 object-contain"
          />
        ) : (
          <CardIcon />
        )}
      </span>
      <div className="flex-1">
        <p
          className="text-[13.5px] font-bold text-[#0A0A0A]"
          data-testid="payment-method"
        >
          {title}
        </p>
        <p className="text-[12px] text-[#666]" data-testid="payment-amount">
          {amountText}
        </p>
      </div>
    </>
  )
}
