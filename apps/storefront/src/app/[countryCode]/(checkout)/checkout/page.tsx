import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout | MUSE NZ",
}

const logo =
  "https://d3k81ch9hvuctc.cloudfront.net/company/WsZzTe/images/18ad57dd-63d9-4151-9f41-dccf70026e4c.png"

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return <CheckoutPreview />
  }

  const customer = await retrieveCustomer()

  return (
    <main className="min-h-screen bg-[#F4F2ED] text-black">
      <CheckoutHeader />
      <CheckoutProgress active="Details" />
      <div className="content-container grid grid-cols-1 gap-8 py-8 small:grid-cols-[1fr_430px] small:py-12">
        <section className="grid gap-5">
          <div className="rounded-[28px] bg-white p-5 shadow-sm small:p-8">
            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
                Secure checkout
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] small:text-5xl">
                Finish your order.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
                Clear NZD pricing, tracked shipping, and final-mile delivery
                through NZ Post.
              </p>
            </div>
            <PaymentWrapper cart={cart}>
              <CheckoutForm cart={cart} customer={customer} />
            </PaymentWrapper>
          </div>
          <TrustPanel />
        </section>
        <aside className="small:sticky small:top-8 small:self-start">
          <CheckoutSummary cart={cart} />
        </aside>
      </div>
    </main>
  )
}

function CheckoutHeader() {
  return (
    <header className="bg-black px-5 py-5">
      <div className="content-container flex items-center justify-between">
        <LocalizedClientLink href="/" className="inline-flex">
          <img src={logo} alt="MUSE" className="h-8 w-auto" />
        </LocalizedClientLink>
        <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
          Secure checkout
        </div>
      </div>
    </header>
  )
}

function CheckoutProgress({ active }: { active: string }) {
  const steps = ["Cart", "Details", "Shipping", "Payment"]

  return (
    <div className="border-b border-black/10 bg-white">
      <div className="content-container flex items-center justify-center gap-3 overflow-x-auto py-4 text-[11px] font-black uppercase tracking-[0.14em]">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            <span
              className={
                step === active
                  ? "rounded-full bg-[#C1440E] px-4 py-2 text-white"
                  : index === 0
                  ? "rounded-full bg-[#1F7A3A] px-4 py-2 text-white"
                  : "rounded-full bg-[#F4F2ED] px-4 py-2 text-black/40"
              }
            >
              {step}
            </span>
            {index < steps.length - 1 && <span className="text-black/25">/</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function TrustPanel() {
  return (
    <div className="grid gap-3 small:grid-cols-3">
      {[
        ["Tracking", "Live updates from dispatch to NZ Post handover."],
        ["Money back", "30-day support if the fit is not right."],
        ["NZD pricing", "No currency surprises at the end."],
      ].map(([title, body]) => (
        <div key={title} className="rounded-[24px] bg-black p-5 text-white">
          <p className="text-sm font-black text-[#C8D050]">{title}</p>
          <p className="mt-2 text-xs leading-5 text-white/55">{body}</p>
        </div>
      ))}
    </div>
  )
}

function CheckoutPreview() {
  return (
    <main className="min-h-screen bg-[#F4F2ED] text-black">
      <CheckoutHeader />
      <CheckoutProgress active="Details" />
      <div className="content-container grid gap-8 py-8 small:grid-cols-[1fr_430px] small:py-12">
        <section className="grid gap-5">
          <div className="rounded-[28px] bg-white p-5 shadow-sm small:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C1440E]">
              Checkout preview
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] small:text-5xl">
              Fast, focused, no distractions.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
              This placeholder appears when there is no active cart. Once a
              product is added, the real Medusa address, shipping, and payment
              forms render inside this same shell.
            </p>

            <div className="mt-8 grid gap-5">
              {[
                ["1", "Contact", "Email address and delivery updates"],
                ["2", "Delivery", "NZ address and Standard Shipping"],
                ["3", "Payment", "Stripe, card, Apple Pay, or Google Pay later"],
              ].map(([num, title, body]) => (
                <div key={num} className="rounded-[24px] border border-black/10 bg-[#F8F7F4] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-black text-[#C8D050]">
                      {num}
                    </span>
                    <div>
                      <p className="font-black">{title}</p>
                      <p className="text-sm text-black/50">{body}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <div className="h-12 rounded-2xl bg-white" />
                    <div className="h-12 rounded-2xl bg-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <TrustPanel />
        </section>

        <aside className="rounded-[32px] bg-black p-5 text-white small:sticky small:top-8 small:self-start">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C8D050]">
            Order summary
          </p>
          <div className="mt-5 flex gap-4 rounded-[24px] bg-white/10 p-4">
            <div className="h-20 w-20 rounded-2xl bg-[#D8D1C4]" />
            <div className="flex-1">
              <p className="font-black">1996 Retro Puffer Jacket</p>
              <p className="mt-1 text-sm text-white/50">Black / Medium</p>
              <p className="mt-3 font-black text-[#C8D050]">NZ$180</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 border-t border-white/10 pt-6 text-sm">
            <div className="flex justify-between text-white/55"><span>Subtotal</span><span>NZ$180</span></div>
            <div className="flex justify-between text-white/55"><span>Shipping</span><span>Free</span></div>
            <div className="flex justify-between text-lg font-black"><span>Total</span><span>NZ$180</span></div>
          </div>
          <LocalizedClientLink
            href="/products/1996-retro-puffer-jacket-black"
            className="mt-6 flex h-14 items-center justify-center rounded-full bg-[#C8D050] text-[12px] font-black uppercase tracking-[0.16em] text-black"
          >
            Add test product
          </LocalizedClientLink>
        </aside>
      </div>
    </main>
  )
}
