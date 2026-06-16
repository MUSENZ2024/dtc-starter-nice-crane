"use client"

import { HttpTypes } from "@medusajs/types"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import SplitPayTest from "@modules/checkout/components/split-pay-test"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import StepHeader from "../step-header"

type Props = {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
  isActive: boolean
  stepNumber: number
}

export default function StepPaymentMuse({
  cart,
  availablePaymentMethods,
  isActive,
  stepNumber,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isActive) {
      return
    }

    const currentStep = searchParams.get("step")
    if (currentStep !== "payment" && currentStep !== "review") {
      const params = new URLSearchParams(searchParams)
      params.set("step", "payment")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [isActive, pathname, router, searchParams])

  return (
    <section id="step-payment">
      <StepHeader stepNumber={stepNumber} isComplete={false} title="Payment" />

      {isActive && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-muse-border bg-white p-4">
            <Payment
              cart={cart}
              availablePaymentMethods={availablePaymentMethods}
              hideHeading
            />
          </div>

          <SplitPayTest cart={cart} />

          <div className="rounded-2xl border border-muse-border bg-white p-4">
            <Review cart={cart} />
          </div>

          <p className="text-center text-[11.5px] leading-relaxed text-muse-text-light">
            By placing your order you agree to MUSE NZ&apos;s Terms of Service and Privacy Policy.
            <br />
            30-day money back · inspected before dispatch · Auckland, New Zealand
          </p>
        </div>
      )}
    </section>
  )
}
