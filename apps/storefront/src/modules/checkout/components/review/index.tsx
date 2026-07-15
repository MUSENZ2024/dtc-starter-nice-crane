"use client"

import { Heading, clx } from "@modules/common/components/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Checkout
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
          <p className="mt-3 text-center text-[11.5px] leading-relaxed text-muse-text-light">
            By placing your order, you agree to our{" "}
            <LocalizedClientLink
              href="/terms"
              className="underline hover:text-muse-black"
            >
              Terms
            </LocalizedClientLink>
            ,{" "}
            <LocalizedClientLink
              href="/terms#returns"
              className="underline hover:text-muse-black"
            >
              Returns Policy
            </LocalizedClientLink>
            , and{" "}
            <LocalizedClientLink
              href="/privacy"
              className="underline hover:text-muse-black"
            >
              Privacy Policy
            </LocalizedClientLink>
            .
          </p>
        </>
      )}
    </div>
  )
}

export default Review
