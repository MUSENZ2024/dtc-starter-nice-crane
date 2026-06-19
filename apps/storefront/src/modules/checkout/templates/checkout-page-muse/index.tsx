"use client"

import { HttpTypes } from "@medusajs/types"
import CheckoutHeaderMuse from "@modules/checkout/components/checkout-header-muse"
import CheckoutSummaryMuse from "@modules/checkout/components/checkout-summary-muse"
import ExpressPayMuse from "@modules/checkout/components/express-pay-muse"
import { StepKey } from "@modules/checkout/components/step-base.types"
import StepContact from "@modules/checkout/components/step-contact"
import StepDelivery from "@modules/checkout/components/step-delivery"
import { getShippingProtectionItem } from "@modules/checkout/components/step-delivery"
import StepPaymentMuse from "@modules/checkout/components/step-payment-muse"
import StepShipping from "@modules/checkout/components/step-shipping"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import Script from "next/script"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type Props = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingMethods: HttpTypes.StoreCartShippingOption[]
  paymentMethods: { id: string }[]
}

const stepOrder: StepKey[] = ["contact", "shipping", "delivery", "payment"]
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export default function CheckoutPageMuse({
  cart,
  customer,
  shippingMethods,
  paymentMethods,
}: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const initialStep = normalizeStep(searchParams.get("muse_step"))
  const [activeStep, setActiveStep] = useState<StepKey>(initialStep)
  const [shippingProtectionSelected, setShippingProtectionSelected] = useState(
    Boolean(getShippingProtectionItem(cart))
  )
  const [completedSteps, setCompletedSteps] = useState<StepKey[]>(() =>
    stepOrder.filter((step) => isStepComplete(step, cart))
  )

  const mobileSummaryTotal = useMemo(
    () => convertCartTotal(cart),
    [cart]
  )

  useEffect(() => {
    setShippingProtectionSelected(Boolean(getShippingProtectionItem(cart)))
  }, [cart])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set("muse_step", activeStep)

    if (activeStep === "payment" && params.get("step") !== "review") {
      params.set("step", "payment")
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [activeStep, pathname, router, searchParams])

  function completeStep(step: StepKey) {
    setCompletedSteps((current) => Array.from(new Set([...current, step])))
    const next = stepOrder[stepOrder.indexOf(step) + 1]
    if (next) {
      setActiveStep(next)
    }
  }

  function editStep(step: StepKey) {
    const index = stepOrder.indexOf(step)
    setActiveStep(step)
    setCompletedSteps((current) =>
      current.filter((currentStep) => stepOrder.indexOf(currentStep) < index)
    )
  }

  return (
    <div className="min-h-screen bg-muse-cream font-inter text-muse-black">
      {googleMapsApiKey && (
        <>
          <link rel="preconnect" href="https://maps.googleapis.com" />
          <link rel="preconnect" href="https://maps.gstatic.com" />
          <Script
            id="google-maps-places-script"
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async&language=en-NZ&region=NZ`}
            strategy="afterInteractive"
          />
        </>
      )}
      <CheckoutHeaderMuse />

      <div className="border-b border-muse-border bg-muse-cream-warm px-4 py-4 small:hidden">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-muse-black">
              <svg className="h-4 w-4 stroke-muse-orange" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Show order summary
            </span>
            <span className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight">{mobileSummaryTotal}</span>
              <span className="mobile-summary-toggle-icon text-[15px] leading-none text-muse-text-muted transition group-open:rotate-180">
                ▾
              </span>
            </span>
          </summary>
          <div className="pt-4">
            <CheckoutSummaryMuse
              cart={cart}
              compact
              shippingProtectionSelected={shippingProtectionSelected}
            />
          </div>
        </details>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-10 px-4 py-8 small:grid-cols-[1fr_420px] small:gap-20 small:px-8 small:py-12">
        <div>
          <PaymentWrapper cart={cart}>
            <ExpressPayMuse cart={cart} />

            <div className="my-6 flex items-center gap-3 text-xs font-medium text-muse-text-light">
              <div className="h-px flex-1 bg-muse-border" />
              or continue with email
              <div className="h-px flex-1 bg-muse-border" />
            </div>

            <StepContact
              cart={cart}
              customer={customer}
              isActive={activeStep === "contact"}
              isComplete={completedSteps.includes("contact")}
              stepNumber={1}
              onComplete={() => completeStep("contact")}
              onEdit={() => editStep("contact")}
            />

            <hr className="my-9 border-muse-border" />

            <StepShipping
              cart={cart}
              isActive={activeStep === "shipping"}
              isComplete={completedSteps.includes("shipping")}
              stepNumber={2}
              onComplete={() => completeStep("shipping")}
              onEdit={() => editStep("shipping")}
            />

            <hr className="my-9 border-muse-border" />

            <StepDelivery
              cart={cart}
              shippingMethods={shippingMethods}
              shippingProtectionSelected={shippingProtectionSelected}
              onShippingProtectionChange={setShippingProtectionSelected}
              isActive={activeStep === "delivery"}
              isComplete={completedSteps.includes("delivery")}
              stepNumber={3}
              onComplete={() => completeStep("delivery")}
              onEdit={() => editStep("delivery")}
            />

            <hr className="my-9 border-muse-border" />

            <StepPaymentMuse
              cart={cart}
              availablePaymentMethods={paymentMethods}
              isActive={activeStep === "payment"}
              stepNumber={4}
            />
          </PaymentWrapper>
        </div>

        <div className="hidden small:sticky small:top-8 small:block">
          <CheckoutSummaryMuse
            cart={cart}
            shippingProtectionSelected={shippingProtectionSelected}
          />
        </div>
      </div>
    </div>
  )
}

function normalizeStep(step: string | null): StepKey {
  if (step && stepOrder.includes(step as StepKey)) {
    return step as StepKey
  }

  return "contact"
}

function isStepComplete(step: StepKey, cart: HttpTypes.StoreCart) {
  if (step === "contact") {
    return Boolean(cart.email)
  }
  if (step === "shipping") {
    return Boolean(cart.shipping_address?.address_1 && cart.shipping_address?.city)
  }
  if (step === "delivery") {
    return Boolean(cart.shipping_methods?.length)
  }

  return false
}

function convertCartTotal(cart: HttpTypes.StoreCart) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: cart.currency_code || "nzd",
  }).format(cart.total ?? 0)
}
