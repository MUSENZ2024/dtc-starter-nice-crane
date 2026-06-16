import {
  SPLIT_PAY_INSTALLMENTS,
  formatSplitPayMoney,
} from "@lib/split-pay"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Split Pay Created | MUSE NZ",
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function SplitPayCompletePage({ searchParams }: Props) {
  const params = await searchParams
  const currency = getParam(params, "currency") || "nzd"
  const totalCents = Number(getParam(params, "total_cents") || 0)
  const baseCents = Number(getParam(params, "base_cents") || 0)
  const finalCents = Number(getParam(params, "final_cents") || 0)
  const scheduleId = getParam(params, "schedule_id")
  const subscriptionId = getParam(params, "subscription_id")

  return (
    <main className="min-h-screen bg-muse-cream px-4 py-12 font-inter text-muse-black">
      <div className="mx-auto max-w-[680px] rounded-[24px] border border-muse-border bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] small:p-8">
        <p className="mb-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-muse-orange">
          Test Split Pay schedule created
        </p>
        <h1 className="mb-4 text-3xl font-black tracking-tight">
          MUSE Split Pay is set up
        </h1>
        <p className="mb-6 text-[14px] leading-6 text-muse-text-muted">
          Stripe saved the test card and created a weekly subscription schedule.
          This test version does not release fulfilment automatically yet. In
          production, the order should ship only after the final invoice is paid.
        </p>

        <div className="mb-6 rounded-2xl bg-muse-cream-warm p-4 text-[14px]">
          <div className="mb-3 flex justify-between gap-4">
            <span className="text-muse-text-muted">Total</span>
            <strong>{formatSplitPayMoney(totalCents, currency)}</strong>
          </div>
          <div className="mb-3 flex justify-between gap-4">
            <span className="text-muse-text-muted">Payments 1-3</span>
            <strong>{formatSplitPayMoney(baseCents, currency)} weekly</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muse-text-muted">Payment 4</span>
            <strong>{formatSplitPayMoney(finalCents, currency)}</strong>
          </div>
        </div>

        <div className="mb-6 space-y-2 rounded-2xl border border-muse-border p-4 text-[12.5px] text-muse-text-muted">
          <p>
            <strong className="text-muse-black">Schedule:</strong>{" "}
            {scheduleId || "Not returned"}
          </p>
          <p>
            <strong className="text-muse-black">Subscription:</strong>{" "}
            {subscriptionId || "Creating"}
          </p>
          <p>
            <strong className="text-muse-black">Instalments:</strong>{" "}
            {SPLIT_PAY_INSTALLMENTS} weekly payments, auto-cancel after final
            phase
          </p>
        </div>

        <LocalizedClientLink
          href="/checkout?step=payment&muse_step=payment"
          className="inline-flex rounded-full bg-muse-black px-5 py-3 text-[13px] font-extrabold uppercase tracking-[0.08em] text-muse-cream transition hover:bg-muse-orange"
        >
          Back to checkout
        </LocalizedClientLink>
      </div>
    </main>
  )
}
