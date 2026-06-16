"use client"

import { updateCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useRouter } from "next/navigation"
import { FormEvent, useState, useTransition } from "react"
import StepHeader from "../step-header"

type Props = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  isActive: boolean
  isComplete: boolean
  stepNumber: number
  onComplete: () => void
  onEdit: () => void
}

export default function StepContact({
  cart,
  customer,
  isActive,
  isComplete,
  stepNumber,
  onComplete,
  onEdit,
}: Props) {
  const [email, setEmail] = useState(cart.email ?? customer?.email ?? "")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      await updateCart({ email })
      router.refresh()
      onComplete()
    })
  }

  return (
    <section id="step-contact">
      <StepHeader
        stepNumber={stepNumber}
        isComplete={isComplete}
        title="Contact"
        onEdit={onEdit}
      />

      {isComplete && !isActive && (
        <div className="rounded-2xl border border-muse-border bg-muse-cream-warm px-4 py-3.5 text-[13px] text-muse-text-muted">
          <strong className="text-muse-black">{email}</strong>
        </div>
      )}

      {isActive && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-2xl border border-muse-border bg-muse-cream-warm px-4 py-3 text-[13px] leading-relaxed text-muse-text-muted">
            <strong className="text-muse-black">Guest checkout is ready.</strong>{" "}
            Use your email for the receipt and delivery updates. You can create
            an account after your order if you want one.
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-email" className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muse-text-muted">
              Email address
            </label>
            <input
              id="checkout-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-xl border border-muse-input bg-white px-4 py-3.5 text-[14px] text-muse-black outline-none transition placeholder:text-[#c0bdb8] focus:border-muse-black focus:ring-2 focus:ring-black/5"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-muse-text-muted">
            <input type="checkbox" defaultChecked className="mt-0.5 accent-muse-black" />
            <span>Send me drop alerts and 10% off my next order. No account required.</span>
          </label>

          <p className="text-[12.5px] text-muse-text-muted">
            Already a customer?{" "}
            <LocalizedClientLink href="/account" className="border-b border-muse-orange font-bold text-muse-orange">
              Log in
            </LocalizedClientLink>
          </p>

          <button
            type="submit"
            disabled={isPending || !email}
            className="mt-2 w-full rounded-full bg-muse-black py-4 text-[13px] font-extrabold uppercase tracking-widest text-muse-cream transition hover:bg-muse-orange disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Continue to shipping"}
          </button>
        </form>
      )}
    </section>
  )
}
