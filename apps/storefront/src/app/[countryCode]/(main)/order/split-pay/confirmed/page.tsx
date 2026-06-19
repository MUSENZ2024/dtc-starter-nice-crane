import {
  SPLIT_PAY_INSTALLMENTS,
  formatSplitPayMoney,
} from "@lib/split-pay"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "MUSE Split Payment Confirmed | MUSE NZ",
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

export default async function SplitPayConfirmedPage({ searchParams }: Props) {
  const params = await searchParams
  const currency = getParam(params, "currency") || "nzd"
  const totalCents = Number(getParam(params, "total_cents") || 0)
  const baseCents = Number(getParam(params, "base_cents") || 0)
  const finalCents = Number(getParam(params, "final_cents") || 0)
  const scheduleId = getParam(params, "schedule_id")
  const subscriptionId = getParam(params, "subscription_id")

  return (
    <main className="min-h-screen bg-muse-cream font-inter text-muse-black">
      <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between bg-muse-black px-[18px] small:h-16 small:px-8">
        <LocalizedClientLink href="/store" className="flex items-center">
          <img
            src="https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png"
            alt="MUSE"
            className="h-7 w-auto"
          />
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/store"
          className="text-[12.5px] font-bold uppercase tracking-[0.1em] text-muse-cream/70 transition hover:text-muse-cream"
        >
          Continue shopping
        </LocalizedClientLink>
      </header>

      <section className="bg-muse-black px-[18px] py-10 text-center small:px-8 small:py-12">
        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-muse-green">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-muse-yellow">
          Order confirmation
        </p>
        <h1 className="mx-auto mb-3 max-w-[620px] text-[clamp(30px,5vw,46px)] font-black leading-[1.05] text-muse-cream">
          MUSE Split Payment is set up.
        </h1>
        <p className="mx-auto max-w-[560px] text-[14px] leading-6 text-muse-cream/65">
          Your card has been saved securely with Stripe. We will collect the
          payment plan below and ship once the final payment is complete.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1060px] gap-6 px-[18px] py-8 small:px-8 small:py-10 large:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-[22px] border border-muse-border bg-white p-6">
            <p className="mb-4 text-[13px] font-black uppercase tracking-[0.08em] text-muse-text-muted">
              Payment method
            </p>
            <div className="flex items-center gap-3.5 rounded-[16px] bg-muse-cream-warm px-4 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muse-black text-muse-yellow">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </span>
              <div>
                <p
                  className="text-[15px] font-black text-muse-black"
                  data-testid="payment-method"
                >
                  MUSE Split Payment
                </p>
                <p className="mt-0.5 text-[12.5px] text-muse-text-muted">
                  Stored card, charged weekly by Stripe
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-muse-border bg-white p-6">
            <p className="mb-4 text-[13px] font-black uppercase tracking-[0.08em] text-muse-text-muted">
              What happens next
            </p>
            {[
              [
                "1",
                "First split payment is created",
                "Stripe starts the weekly payment schedule in test mode.",
              ],
              [
                "2",
                "We hold fulfilment until paid",
                "The order ships once the final Split Payment is complete.",
              ],
              [
                "3",
                "You can ask us anytime",
                "Reply to your emails or message MUSE if anything looks off.",
              ],
            ].map(([step, title, body]) => (
              <div
                key={step}
                className="flex gap-3.5 border-b border-muse-border py-3.5 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muse-black text-[12px] font-black text-muse-cream">
                  {step}
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-muse-black">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-muse-text-muted">
                    {body}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-[24px] border border-muse-border bg-white p-6 large:sticky large:top-24">
          <p className="mb-4 text-[13px] font-black uppercase tracking-[0.08em] text-muse-text-muted">
            Split Payment plan
          </p>
          <div className="mb-5 rounded-[18px] bg-muse-cream-warm p-4">
            <div className="mb-3 flex justify-between gap-4 text-[13.5px]">
              <span className="text-muse-text-muted">Total</span>
              <strong>{formatSplitPayMoney(totalCents, currency)}</strong>
            </div>
            <div className="mb-3 flex justify-between gap-4 text-[13.5px]">
              <span className="text-muse-text-muted">Payments 1-3</span>
              <strong>{formatSplitPayMoney(baseCents, currency)} weekly</strong>
            </div>
            <div className="flex justify-between gap-4 text-[13.5px]">
              <span className="text-muse-text-muted">Payment 4</span>
              <strong>{formatSplitPayMoney(finalCents, currency)}</strong>
            </div>
          </div>

          <div className="space-y-2 border-t border-muse-border pt-4 text-[12px] text-muse-text-muted">
            <p>
              <strong className="text-muse-black">Schedule:</strong>{" "}
              {scheduleId || "Created"}
            </p>
            <p>
              <strong className="text-muse-black">Subscription:</strong>{" "}
              {subscriptionId || "Starting"}
            </p>
            <p>
              <strong className="text-muse-black">Instalments:</strong>{" "}
              {SPLIT_PAY_INSTALLMENTS} weekly payments
            </p>
          </div>

          <LocalizedClientLink
            href="/store"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-muse-black px-5 py-4 text-[12.5px] font-black uppercase tracking-[0.1em] text-muse-cream transition hover:bg-muse-orange"
          >
            Continue shopping
          </LocalizedClientLink>
        </aside>
      </section>
    </main>
  )
}
