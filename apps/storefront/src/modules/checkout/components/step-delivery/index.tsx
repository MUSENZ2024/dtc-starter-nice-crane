"use client"

import { addToCart, deleteLineItem, setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import StepHeader from "../step-header"

type Props = {
  cart: HttpTypes.StoreCart
  shippingMethods: HttpTypes.StoreCartShippingOption[]
  shippingProtectionSelected: boolean
  isActive: boolean
  isComplete: boolean
  stepNumber: number
  onShippingProtectionChange: (checked: boolean) => void
  onComplete: () => void
  onEdit: () => void
}

type DeliveryChoice = {
  label: "Standard" | "Express"
  method: HttpTypes.StoreCartShippingOption
}

const shippingProtectionVariantId =
  process.env.NEXT_PUBLIC_SHIPPING_PROTECTION_VARIANT_ID

export default function StepDelivery({
  cart,
  shippingMethods,
  shippingProtectionSelected,
  isActive,
  isComplete,
  stepNumber,
  onShippingProtectionChange,
  onComplete,
  onEdit,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id ?? shippingMethods[0]?.id ?? null
  )
  const [calculatedPrices, setCalculatedPrices] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const calculated = shippingMethods.filter((method) => method.price_type === "calculated")

    Promise.allSettled(
      calculated.map((method) => calculatePriceForShippingOption(method.id, cart.id))
    ).then((results) => {
      const nextPrices: Record<string, number> = {}
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value?.id) {
          nextPrices[result.value.id] = result.value.amount ?? 0
        }
      })
      setCalculatedPrices(nextPrices)
    })
  }, [cart.id, shippingMethods])

  const selected = shippingMethods.find((method) => method.id === selectedId)
  const deliveryChoices = getDeliveryChoices(shippingMethods, selectedId)
  const shippingProtectionItem = getShippingProtectionItem(cart)
  const isShippingProtectionActive = Boolean(shippingProtectionItem)

  function methodAmount(method: HttpTypes.StoreCartShippingOption) {
    if (method.price_type === "calculated") {
      return calculatedPrices[method.id] ?? method.amount ?? 0
    }

    return method.amount ?? 0
  }

  function handleSelect(id: string) {
    setError(null)
    setSelectedId(id)
    startTransition(async () => {
      try {
        await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  function handleShippingProtectionChange(checked: boolean) {
    setError(null)
    onShippingProtectionChange(checked)

    if (!shippingProtectionVariantId) {
      setError("Shipping protection needs a Medusa product variant ID before it can be added.")
      onShippingProtectionChange(false)
      return
    }

    startTransition(async () => {
      try {
        if (checked && !shippingProtectionItem) {
          await addToCart({
            variantId: shippingProtectionVariantId,
            quantity: 1,
            countryCode: cart.shipping_address?.country_code || "nz",
          })
        }

        if (!checked && shippingProtectionItem) {
          await deleteLineItem(shippingProtectionItem.id)
        }

        router.refresh()
      } catch (err) {
        onShippingProtectionChange(!checked)
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  function handleContinue() {
    if (!selectedId) {
      return
    }

    startTransition(async () => {
      try {
        await setShippingMethod({ cartId: cart.id, shippingMethodId: selectedId })
        router.refresh()
        onComplete()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  return (
    <section id="step-delivery">
      <StepHeader
        stepNumber={stepNumber}
        isComplete={isComplete}
        title="Delivery method"
        onEdit={onEdit}
      />

      {isComplete && !isActive && selected && (
        <div className="rounded-2xl border border-muse-border bg-muse-cream-warm px-4 py-3.5 text-[13px] text-muse-text-muted">
          <strong className="text-muse-black">
            {getDeliveryLabel(selected.name)}
          </strong>
          {" - "}
          {methodAmount(selected) === 0 ? (
            <span className="font-bold text-muse-green">Free</span>
          ) : (
            convertToLocale({ amount: methodAmount(selected), currency_code: cart.currency_code })
          )}
        </div>
      )}

      {isActive && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2.5">
            {deliveryChoices.length ? (
              deliveryChoices.map(({ label, method }) => {
                const isSelected = method.id === selectedId
                const amount = methodAmount(method)

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => handleSelect(method.id)}
                    className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition ${
                      isSelected ? "border-muse-black bg-white" : "border-muse-input hover:border-muse-black"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected ? "border-muse-black" : "border-muse-input"
                      }`}
                    >
                      {isSelected && <span className="block h-2.5 w-2.5 rounded-full bg-muse-black" />}
                    </span>

                    <span className="flex-1">
                      <span className="mb-0.5 flex items-center gap-2 text-[13.5px] font-bold text-muse-black">
                        {label}
                      </span>
                      <span className="block text-[12.5px] text-muse-text-muted">
                        {getDeliveryWindow(label)}. Tracked end-to-end with NZ Post.
                      </span>
                    </span>

                    <span className={`whitespace-nowrap text-[14px] font-extrabold ${amount === 0 ? "text-muse-green" : "text-muse-black"}`}>
                      {amount === 0
                        ? "Free"
                        : convertToLocale({ amount, currency_code: cart.currency_code })}
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="rounded-2xl border border-muse-border bg-muse-cream-warm p-4 text-sm text-muse-text-muted">
                Enter your shipping address to see available delivery methods.
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-muse-input bg-white p-4 transition hover:border-muse-black">
            <input
              type="checkbox"
              checked={shippingProtectionSelected || isShippingProtectionActive}
              onChange={(event) => handleShippingProtectionChange(event.target.checked)}
              disabled={isPending}
              className="mt-1 h-4 w-4 accent-muse-black"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3 text-[13.5px] font-bold text-muse-black">
                Shipping protection
                <span className="whitespace-nowrap text-[14px] font-extrabold">
                  {convertToLocale({ amount: 7.99, currency_code: cart.currency_code })}
                </span>
              </span>
              <span className="mt-1 block text-[12.5px] leading-relaxed text-muse-text-muted">
                Optional cover for lost, stolen, or damaged parcels while your
                order is in transit. Added to the total before payment.
              </span>
            </span>
          </label>

          {error && <p className="text-sm font-semibold text-muse-orange">{error}</p>}

          <button
            type="button"
            disabled={!selectedId || isPending}
            onClick={handleContinue}
            className="w-full rounded-full bg-muse-black py-4 text-[13px] font-extrabold uppercase tracking-widest text-muse-cream transition hover:bg-muse-orange disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Continue to payment"}
          </button>
        </div>
      )}
    </section>
  )
}

export function getShippingProtectionItem(cart: HttpTypes.StoreCart) {
  if (!shippingProtectionVariantId) {
    return undefined
  }

  return cart.items?.find((item) => {
    const variantId =
      (item as { variant_id?: string | null }).variant_id || item.variant?.id

    return variantId === shippingProtectionVariantId
  })
}

function getDeliveryLabel(name?: string | null): "Standard" | "Express" {
  return name?.toLowerCase().includes("express") ? "Express" : "Standard"
}

function getDeliveryWindow(label: "Standard" | "Express") {
  if (label === "Express") {
    return `Estimated delivery ${formatDeliveryDate(13)} - ${formatDeliveryDate(16)}`
  }

  return `Estimated delivery ${formatDeliveryDate(13)} - ${formatDeliveryDate(16)}`
}

function formatDeliveryDate(daysFromNow: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)

  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "long",
  }).format(date)
}

function getDeliveryChoices(
  shippingMethods: HttpTypes.StoreCartShippingOption[],
  selectedId: string | null
): DeliveryChoice[] {
  const choices: DeliveryChoice[] = []

  ;(["Standard", "Express"] as const).forEach((label) => {
    const candidates = shippingMethods.filter(
      (method) => getDeliveryLabel(method.name) === label
    )
    const selectedCandidate = candidates.find((method) => method.id === selectedId)
    const fallback = candidates[0]

    if (selectedCandidate || fallback) {
      choices.push({ label, method: selectedCandidate || fallback })
    }
  })

  return choices
}
