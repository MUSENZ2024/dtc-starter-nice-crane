"use client"

import {
  acceptTransferRequest,
  createTransferRequest,
  declineTransferRequest,
} from "@lib/data/orders"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

type ClaimState = {
  success: boolean
  error: string | null
  message: string | null
}

export default function MuseClaimOrder() {
  const [requestState, requestAction] = useActionState(createTransferRequest, {
    success: false,
    error: null,
    order: null,
  })
  const [claimState, setClaimState] = useState<ClaimState>({
    success: false,
    error: null,
    message: null,
  })

  const claim = async (formData: FormData) => {
    const orderId = formData.get("order_id") as string
    const code = formData.get("code") as string
    const result = await acceptTransferRequest(orderId, code)

    setClaimState({
      success: result.success,
      error: result.error,
      message: result.success ? "Order added to your account." : null,
    })
  }

  const decline = async (formData: FormData) => {
    const orderId = formData.get("order_id") as string
    const code = formData.get("code") as string
    const result = await declineTransferRequest(orderId, code)

    setClaimState({
      success: result.success,
      error: result.error,
      message: result.success ? "Request cancelled." : null,
    })
  }

  return (
    <div data-testid="claim-order-page-wrapper">
      <div className="mb-[26px] flex gap-2 text-xs text-muse-text-light">
        <span>Home</span>
        <span>/</span>
        <span>Link order</span>
      </div>
      <div className="mb-7">
        <h1 className="muse-page-title">Link an order</h1>
        <p className="muse-page-sub">
          Bought something before signing in? Add that order to this account so
          you can see it in your order history.
        </p>
      </div>

      <div className="grid gap-[18px] small:grid-cols-2">
        <div className="muse-panel">
          <h2 className="muse-panel-title">Send me a link code</h2>
          <p className="mt-2 text-sm leading-6 text-muse-text-muted">
            Enter the order ID from your confirmation email. We will send a code
            to the email address on that order.
          </p>
          <form action={requestAction} className="muse-auth-form">
            <div className="muse-field">
              <label htmlFor="transfer-order">Order ID</label>
              <input
                id="transfer-order"
                name="order_id"
                placeholder="order_01J..."
                required
                className="muse-input"
              />
            </div>
            <PendingButton>Send link code</PendingButton>
            {requestState.success && requestState.order && (
              <div className="muse-alert muse-alert-success">
                Code sent to {requestState.order.email}.
              </div>
            )}
            {requestState.error && (
              <div className="muse-alert muse-alert-error">
                {requestState.error}
              </div>
            )}
          </form>
        </div>

        <div className="muse-panel">
          <h2 className="muse-panel-title">Add the order</h2>
          <p className="mt-2 text-sm leading-6 text-muse-text-muted">
            Paste the code from your email. If you did not request this, you can
            cancel the request instead.
          </p>
          <form className="muse-auth-form">
            <div className="muse-field">
              <label htmlFor="claim-order-id">Order ID</label>
              <input
                id="claim-order-id"
                name="order_id"
                placeholder="order_01J..."
                required
                className="muse-input"
              />
            </div>
            <div className="muse-field">
              <label htmlFor="transfer-code">Link code</label>
              <input
                id="transfer-code"
                name="code"
                placeholder="Code from your email"
                required
                className="muse-input"
              />
            </div>
            <div className="grid gap-3 small:grid-cols-2">
              <button formAction={claim} className="muse-btn-primary">
                Add order
              </button>
              <button formAction={decline} className="muse-btn-danger">
                Cancel request
              </button>
            </div>
            {claimState.message && (
              <div className="muse-alert muse-alert-success">
                {claimState.message}
              </div>
            )}
            {claimState.error && (
              <div className="muse-alert muse-alert-error">{claimState.error}</div>
            )}
          </form>
        </div>
      </div>

      <div className="muse-panel mt-[18px]">
        <h2 className="muse-panel-title">How linking works</h2>
        <div className="mt-[18px] grid gap-3">
          <FlowStep
            title="1. Find your order ID"
            body="It is in your MUSE order confirmation email."
          />
          <FlowStep
            title="2. Check your inbox"
            body="We send the code to the email used when the order was placed."
          />
          <FlowStep
            title="3. Add it to your account"
            body="Once confirmed, the order appears with the rest of your account orders."
          />
        </div>
      </div>
    </div>
  )
}

function PendingButton({ children }: { children: string }) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className="muse-btn-primary">
      {children}
    </button>
  )
}

function FlowStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid gap-1 rounded-[14px] border border-muse-border bg-muse-cream-warm p-3.5">
      <strong className="text-[13px] text-muse-black">{title}</strong>
      <span className="muse-fine">{body}</span>
    </div>
  )
}
