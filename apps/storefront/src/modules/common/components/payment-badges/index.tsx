"use client"

type PaymentBadgesProps = {
  className?: string
  include?: string[]
  variant?: "flat" | "tile"
}

const badges = [
  { src: "/payment-badges/Visa.png", alt: "Visa" },
  { src: "/payment-badges/mastercard.png", alt: "Mastercard" },
  { src: "/payment-badges/Amex.png", alt: "American Express" },
  { src: "/payment-badges/Applepay.png", alt: "Apple Pay" },
  { src: "/payment-badges/Gpay.png", alt: "Google Pay" },
  { src: "/payment-badges/Afterpay.png", alt: "Afterpay" },
  { src: "/payment-badges/Klarna.png", alt: "Klarna" },
]

export default function PaymentBadges({
  className = "",
  include,
  variant = "flat",
}: PaymentBadgesProps) {
  const visibleBadges = include
    ? badges.filter((badge) => include.includes(badge.alt))
    : badges

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2.5 ${className}`}
    >
      {visibleBadges.map((badge) => (
        <span
          key={badge.src}
          className={
            variant === "tile"
              ? "flex h-[22px] w-[38px] items-center justify-center overflow-hidden rounded border border-muse-border bg-white"
              : "flex h-[28px] w-[48px] items-center justify-center overflow-hidden"
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badge.src}
            alt={badge.alt}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        </span>
      ))}
    </div>
  )
}
