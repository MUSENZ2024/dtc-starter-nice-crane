"use client"
import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import {
  Button,
  Heading,
  Text,
  clx,
} from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
  hideHeading = false,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
  hideHeading?: boolean
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )
  const didAutoSelectPayment = useRef(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"
  const defaultStripeMethod = useMemo(
    () => availablePaymentMethods.find((method) => isStripeLike(method.id))?.id,
    [availablePaymentMethods]
  )
  const refreshCart = useCallback(() => {
    router.refresh()
  }, [router])

  const setPaymentMethod = useCallback(async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
      refreshCart()
    }
  }, [cart, refreshCart])

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
        refreshCart()
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err) {
      setError(getAdaptivePaymentError(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  useEffect(() => {
    if (
      !isOpen ||
      paidByGiftcard ||
      selectedPaymentMethod ||
      !defaultStripeMethod ||
      didAutoSelectPayment.current
    ) {
      return
    }

    didAutoSelectPayment.current = true
    setPaymentMethod(defaultStripeMethod).catch((err) => {
      setError(getAdaptivePaymentError(err))
    })
  }, [
    defaultStripeMethod,
    isOpen,
    paidByGiftcard,
    selectedPaymentMethod,
    setPaymentMethod,
  ])

  return (
    <div className="bg-white">
      {!hideHeading && (
        <div className="flex flex-row items-center justify-between mb-6">
          <Heading
            level="h2"
            className={clx(
              "flex flex-row text-3xl-regular gap-x-2 items-baseline",
              {
                "opacity-50 pointer-events-none select-none":
                  !isOpen && !paymentReady,
              }
            )}
          >
            Payment
            {!isOpen && paymentReady && <CheckCircleSolid />}
          </Heading>
          {!isOpen && paymentReady && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-payment-button"
              >
                Edit
              </button>
            </Text>
          )}
        </div>
      )}
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        cart={cart}
                        setError={setError}
                        setPaymentComplete={setPaymentComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !paymentComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? "Enter payment details"
              : "Review order"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="rounded-2xl border border-muse-border bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <Text className="text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-muse-text-muted">
                  Payment saved
                </Text>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-muse-orange transition hover:text-muse-black"
                  data-testid="edit-payment-button"
                >
                  Edit
                </button>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={handleEdit}
                className="grid w-full gap-3 text-left small:grid-cols-2"
                aria-label="Edit payment details"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    handleEdit()
                  }
                }}
              >
                <div className="rounded-2xl border border-muse-border bg-muse-cream-warm p-4">
                <Text className="mb-1 block text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-muse-text-muted">
                  Payment method
                </Text>
                <Text
                  className="text-[14px] font-bold text-muse-black"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
                <div className="rounded-2xl border border-muse-border bg-muse-cream-warm p-4">
                <Text className="mb-1 block text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-muse-text-muted">
                  Payment details
                </Text>
                <div
                  className="flex items-center gap-2 text-[14px] font-bold text-muse-black"
                  data-testid="payment-details-summary"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-muse-input bg-white text-muse-text-muted">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </span>
                  <Text>
                    {isStripeLike(selectedPaymentMethod)
                      ? "Entered securely with Stripe"
                      : "Another step will appear"}
                  </Text>
                </div>
              </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment

function getAdaptivePaymentError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("shipping")) {
    return "Choose a delivery method before continuing to payment."
  }

  if (lowerMessage.includes("payment") || lowerMessage.includes("stripe")) {
    return "We could not start the secure payment step. Check your details and try again."
  }

  return message || "Something went wrong. Please review the highlighted step and try again."
}
