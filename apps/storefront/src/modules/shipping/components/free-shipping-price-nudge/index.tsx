"use client"

import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid, XMark } from "@medusajs/icons"
import {
  HttpTypes,
  StoreCart,
  StoreCartShippingOption,
  StorePrice,
} from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"
import { StoreFreeShippingPrice } from "types/global"

const computeTarget = (
  cart: HttpTypes.StoreCart,
  price: HttpTypes.StorePrice,
) => {
  const priceRule = (price.price_rules || []).find(
    (pr) => pr.attribute === "item_total",
  )!

  const currentAmount = cart.item_total
  const targetAmount = parseFloat(priceRule.value)

  if (priceRule.operator === "gt") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: currentAmount > targetAmount,
      target_remaining:
        currentAmount > targetAmount ? 0 : targetAmount + 1 - currentAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else if (priceRule.operator === "gte") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: currentAmount >= targetAmount,
      target_remaining:
        currentAmount >= targetAmount ? 0 : targetAmount - currentAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else if (priceRule.operator === "lt") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: targetAmount > currentAmount,
      target_remaining:
        targetAmount > currentAmount ? 0 : currentAmount + 1 - targetAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else if (priceRule.operator === "lte") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: targetAmount > currentAmount,
      target_remaining:
        targetAmount > currentAmount ? 0 : currentAmount - targetAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: currentAmount === targetAmount,
      target_remaining:
        targetAmount > currentAmount ? 0 : targetAmount - currentAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  }
}

export default function ShippingPriceNudge({
  variant = "inline",
  cart,
  shippingOptions,
}: {
  variant?: "popup" | "inline"
  cart: StoreCart
  shippingOptions: StoreCartShippingOption[]
}) {
  if (!cart || !shippingOptions?.length) {
    return
  }

  // Check if any shipping options have a conditional price based on item_total
  const freeShippingPrice = shippingOptions
    .map((shippingOption) => {
      const calculatedPrice = shippingOption.calculated_price

      if (!calculatedPrice) {
        return
      }

      // Get all prices that are:
      // 1. Currency code is same as the cart's
      // 2. Have a rule that is set on item_total
      const validCurrencyPrices = shippingOption.prices.filter(
        (price) =>
          price.currency_code === cart.currency_code &&
          (price.price_rules || []).some(
            (priceRule) => priceRule.attribute === "item_total",
          ),
      )

      return validCurrencyPrices.map((price) => {
        return {
          ...price,
          shipping_option_id: shippingOption.id,
          ...computeTarget(cart, price),
        }
      })
    })
    .flat(1)
    .filter(Boolean)
    // We focus here entirely on free shipping, but this can be edited to handle multiple layers
    // of reduced shipping prices.
    .find((price) => price?.amount === 0)

  if (!freeShippingPrice) {
    return
  }

  if (variant === "popup") {
    return <FreeShippingPopup cart={cart} price={freeShippingPrice} />
  } else {
    return <FreeShippingInline cart={cart} price={freeShippingPrice} />
  }
}

function FreeShippingInline({
  cart,
  price,
}: {
  cart: StoreCart
  price: StorePrice & {
    target_reached: boolean
    target_remaining: number
    remaining_percentage: number
  }
}) {
  return (
    <div className="bg-neutral-100 p-2 rounded-lg border">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-neutral-600">
          <div>
            {price.target_reached ? (
              <div className="flex items-center gap-1.5">
                {" "}
                <CheckCircleSolid className="text-green-500 inline-block" />{" "}
                Free Shipping unlocked!
              </div>
            ) : (
              `Unlock Free Shipping`
            )}
          </div>

          <div
            className={clx("visible", {
              "opacity-0 invisible": price.target_reached,
            })}
          >
            Only{" "}
            <span className="text-neutral-950">
              {convertToLocale({
                amount: price.target_remaining,
                currency_code: cart.currency_code,
              })}
            </span>{" "}
            away
          </div>
        </div>
        <div className="flex justify-between gap-1">
          <div
            className={clx(
              "bg-gradient-to-r from-zinc-400 to-zinc-500 h-1 rounded-full max-w-full duration-500 ease-in-out",
              {
                "from-green-400 to-green-500": price.target_reached,
              },
            )}
            style={{ width: `${price.remaining_percentage}%` }}
          ></div>
          <div className="bg-neutral-300 h-1 rounded-full w-fit flex-grow"></div>
        </div>
      </div>
    </div>
  )
}

function FreeShippingPopup({
  cart,
  price,
}: {
  cart: StoreCart
  price: StoreFreeShippingPrice
}) {
  const [isClosed, setIsClosed] = useState(false)
  const progress = Math.min(price.remaining_percentage, 100)
  const remaining = convertToLocale({
    amount: price.target_remaining,
    currency_code: cart.currency_code,
  })
  const current = convertToLocale({
    amount: price.current_amount,
    currency_code: cart.currency_code,
  })
  const target = convertToLocale({
    amount: price.target_amount,
    currency_code: cart.currency_code,
  })

  const TruckIcon = () => (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px] shrink-0"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M1 4h11v8H1V4z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 7h4l2 3v2h-6V7z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle
        cx="4.5"
        cy="14.5"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle
        cx="14.5"
        cy="14.5"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  )

  const ProgressBar = () => (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
      <div
        className={clx(
          "h-full rounded-full transition-[width] duration-500 ease-in-out",
          price.target_reached ? "bg-muse-green" : "bg-muse-yellow",
        )}
        style={{ width: `${price.target_reached ? 100 : progress}%` }}
      />
    </div>
  )

  const CloseButton = () => (
    <button
      type="button"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
      onClick={() => setIsClosed(true)}
      aria-label="Dismiss free shipping message"
    >
      <XMark className="h-4 w-4" />
    </button>
  )

  const UnlockedLabel = () => (
    <span className="flex items-center gap-1.5">
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-muse-green text-white">
        <CheckCircleSolid className="h-3.5 w-3.5" />
      </span>
      Free shipping unlocked!
    </span>
  )

  return (
    <>
      <div
        className={clx(
          "fixed inset-x-0 bottom-0 z-[201] transition-transform duration-500 ease-in-out md:hidden",
          isClosed ? "translate-y-[110%]" : "translate-y-0",
        )}
      >
        <div className="flex flex-col gap-2.5 rounded-t-2xl bg-muse-black px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-3.5 text-white shadow-[0_-4px_24px_rgba(0,0,0,0.18)]">
          <div className="flex items-center gap-2">
            {!price.target_reached && (
              <span className="text-white/55">
                <TruckIcon />
              </span>
            )}
            <div className="flex-1 text-[13px] font-medium text-white/70">
              {price.target_reached ? (
                <UnlockedLabel />
              ) : (
                <>
                  Only <span className="font-bold text-white">{remaining}</span>{" "}
                  away from free shipping
                </>
              )}
            </div>
            <CloseButton />
          </div>

          <ProgressBar />

          <div
            className={clx(
              "grid gap-2",
              price.target_reached ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            {!price.target_reached && (
              <LocalizedClientLink
                className="flex h-10 items-center justify-center rounded-[10px] border-[1.5px] border-white/30 text-[13px] font-semibold text-white transition-colors hover:border-white/55 hover:bg-white/[0.06]"
                href="/cart"
              >
                View cart
              </LocalizedClientLink>
            )}
            <LocalizedClientLink
              className="flex h-10 items-center justify-center rounded-[10px] bg-muse-yellow text-[13px] font-bold text-muse-black transition-colors hover:bg-muse-yellow-deep"
              href="/store"
            >
              Shop products
            </LocalizedClientLink>
          </div>
        </div>
      </div>

      <div
        className={clx(
          "fixed bottom-6 right-6 z-[201] hidden transition-all duration-500 ease-in-out md:block",
          isClosed
            ? "pointer-events-none invisible opacity-0"
            : "visible opacity-100",
        )}
      >
        <div className="flex w-[340px] flex-col gap-3.5 rounded-2xl bg-muse-black px-5 py-[18px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.22),0_2px_8px_rgba(0,0,0,0.12)]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white/70">
                {price.target_reached ? (
                  <UnlockedLabel />
                ) : (
                  <>
                    <span className="text-white/50">
                      <TruckIcon />
                    </span>
                    Unlock free shipping
                  </>
                )}
              </div>
              <div className="text-xl font-bold leading-[1.15] tracking-[-0.02em]">
                {price.target_reached ? (
                  <>
                    You&apos;ve qualified for
                    <br />
                    <span className="text-muse-yellow">free NZ delivery</span>
                  </>
                ) : (
                  <>
                    Only <span className="text-muse-yellow">{remaining}</span>{" "}
                    away
                  </>
                )}
              </div>
            </div>
            <CloseButton />
          </div>

          <div className="flex flex-col gap-1.5">
            <ProgressBar />
            <div className="flex justify-between text-[11px] text-white/45">
              <span>{current} in cart</span>
              <span>{target} threshold</span>
            </div>
          </div>

          <div
            className={clx(
              "grid gap-2",
              price.target_reached ? "grid-cols-1" : "grid-cols-[auto_1fr]",
            )}
          >
            {!price.target_reached && (
              <LocalizedClientLink
                className="flex h-[38px] items-center justify-center whitespace-nowrap rounded-lg border-[1.5px] border-white/20 px-4 text-[13px] font-semibold text-white/80 transition-colors hover:border-white/45 hover:text-white"
                href="/cart"
              >
                View cart
              </LocalizedClientLink>
            )}
            <LocalizedClientLink
              className="flex h-[38px] items-center justify-center rounded-lg bg-muse-yellow text-[13px] font-bold text-muse-black transition-colors hover:bg-muse-yellow-deep"
              href="/store"
            >
              Shop products
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </>
  )
}
