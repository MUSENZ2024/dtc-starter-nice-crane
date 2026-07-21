"use client"

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useCartDrawer } from "@lib/context/cart-drawer-context"
import { useMarketingOverlay } from "../../context/marketing-overlay-context"
import { recordMarketingCaptureEvent, subscribeToMarketing } from "../../lib/client"
import type { MarketingPreference } from "../../types"

const DISMISS_KEY = "muse_marketing_dismissed_until"
const SIGNED_UP_KEY = "muse_marketing_subscribed"
const SESSION_VIEW_KEY = "muse_marketing_popup_viewed"
const PRODUCT_VIEW_KEY = "muse_marketing_product_views"
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

const options: Array<[MarketingPreference, string, string]> = [
  ["footwear", "Sneakers and footwear", "New pairs and sought-after sizes"],
  ["outerwear", "Outerwear and apparel", "Jackets, layers, and seasonal arrivals"],
  ["restocks", "Restocks in my size", "Be early when sold-out sizes return"],
  ["everything", "Everything MUSE", "Drops, restocks, and private offers"],
]

const pageType = (pathname: string) =>
  pathname.includes("/products/") ? "product" : pathname.endsWith("/store") ? "store" : "other"

export default function WelcomePopup() {
  const pathname = usePathname()
  const params = useParams<{ countryCode?: string }>()
  const { isOpen: isCartOpen } = useCartDrawer()
  const { isMarketingActive, marketingSource, openMarketingDialog, closeMarketingDialog } = useMarketingOverlay()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [preference, setPreference] = useState<MarketingPreference>("everything")
  const [email, setEmail] = useState("")
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "error">("idle")
  const triggerArmed = useRef(false)

  const excluded = useMemo(
    () => /\/(cart|checkout|order-confirmed|account|unsubscribe|preferences)(\/|$)/.test(pathname),
    [pathname],
  )

  useEffect(() => {
    if (!pathname.includes("/products/")) return
    const views = Number(sessionStorage.getItem(PRODUCT_VIEW_KEY) || "0") + 1
    sessionStorage.setItem(PRODUCT_VIEW_KEY, String(views))
    if (views >= 2) triggerArmed.current = true
  }, [pathname])

  useEffect(() => {
    if (excluded || isCartOpen || localStorage.getItem(SIGNED_UP_KEY) === "true") return
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || "0")
    if (dismissedUntil > Date.now() || sessionStorage.getItem(SESSION_VIEW_KEY) === "true") return

    const mobile = window.matchMedia("(max-width: 767px)").matches
    const delay = mobile ? 25000 : 13000
    const scrollThreshold = mobile ? 0.5 : 0.375

    const openIfEligible = () => {
      if (isCartOpen || excluded || isMarketingActive) return
      sessionStorage.setItem(SESSION_VIEW_KEY, "true")
      openMarketingDialog("welcome_popup")
      recordMarketingCaptureEvent({
        event_type: "popup_viewed",
        source: "welcome_popup",
        page_type: pageType(pathname),
        device_type: mobile ? "mobile" : "desktop",
      })
    }
    const timer = window.setTimeout(openIfEligible, delay)
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if ((scrollable > 0 && window.scrollY / scrollable >= scrollThreshold) || triggerArmed.current) {
        window.clearTimeout(timer)
        window.removeEventListener("scroll", onScroll)
        openIfEligible()
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    if (triggerArmed.current) openIfEligible()
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("scroll", onScroll)
    }
  }, [excluded, isCartOpen, isMarketingActive, openMarketingDialog, pathname])

  useEffect(() => {
    if (isCartOpen && isMarketingActive) closeMarketingDialog()
  }, [closeMarketingDialog, isCartOpen, isMarketingActive])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + THIRTY_DAYS))
    closeMarketingDialog()
    recordMarketingCaptureEvent({
      event_type: "dismissed",
      source: marketingSource,
      preference,
      page_type: pageType(pathname),
      device_type: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
    })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitState("loading")
    recordMarketingCaptureEvent({
      event_type: "submitted",
      source: marketingSource,
      preference,
      page_type: pageType(pathname),
      device_type: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
    })
    try {
      await subscribeToMarketing({
        email,
        preference,
        source: marketingSource,
        countryCode: params.countryCode || "nz",
      })
      localStorage.setItem(SIGNED_UP_KEY, "true")
      setStep(3)
      setSubmitState("idle")
      recordMarketingCaptureEvent({
        event_type: "succeeded",
        source: marketingSource,
        preference,
        page_type: pageType(pathname),
        device_type: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
      })
    } catch {
      setSubmitState("error")
      recordMarketingCaptureEvent({
        event_type: "error",
        source: marketingSource,
        preference,
        page_type: pageType(pathname),
        device_type: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
      })
    }
  }

  return (
    <Dialog open={isMarketingActive && !excluded && !isCartOpen} onClose={dismiss} className="relative z-[220]">
      <DialogBackdrop className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity" />
      <div className="fixed inset-0 overflow-y-auto p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="relative w-full max-w-[620px] overflow-hidden rounded-[24px] bg-muse-cream p-6 text-muse-black shadow-2xl small:p-10">
            <button type="button" onClick={dismiss} aria-label="Close signup dialog" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-muse-border bg-muse-cream-warm transition hover:bg-muse-cream-deep"><XMark className="h-5 w-5" /></button>

            {step === 1 && (
              <>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muse-orange">MUSE drop access</p>
                <DialogTitle className="mt-3 pr-12 text-[34px] font-black leading-[1] tracking-[-0.04em] small:text-[46px]">What do you want first access to?</DialogTitle>
                <div className="mt-7 grid gap-3 xsmall:grid-cols-2">
                  {options.map(([value, title, description]) => (
                    <button key={value} type="button" onClick={() => { setPreference(value); setStep(2); recordMarketingCaptureEvent({ event_type: "preference_selected", source: marketingSource, preference: value, page_type: pageType(pathname), device_type: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop" }) }} className="min-h-[96px] rounded-[16px] border border-muse-border bg-muse-cream-warm p-4 text-left transition hover:border-muse-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muse-black">
                      <span className="block text-[14px] font-black">{title}</span>
                      <span className="mt-1 block text-[12px] leading-5 text-muse-text-muted">{description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <form onSubmit={submit}>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muse-orange">Private access</p>
                <DialogTitle className="mt-3 pr-12 text-[32px] font-black leading-[1.02] tracking-[-0.04em] small:text-[44px]">Get first access—and $20 off your first order over $150.</DialogTitle>
                <label htmlFor="welcome-marketing-email" className="mt-7 block text-[12px] font-black uppercase tracking-[0.1em]">Email address</label>
                <input id="welcome-marketing-email" autoFocus type="email" inputMode="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-[10px] border border-muse-border bg-white px-4 text-[16px] outline-none focus:border-muse-black" />
                <p className="mt-3 text-[11px] leading-5 text-muse-text-muted">By joining, you agree to receive MUSE NZ marketing emails about new drops, restocks and offers. You can unsubscribe at any time. See our <a href={`/${params.countryCode || "nz"}/privacy`} className="underline">Privacy Policy</a>.</p>
                {submitState === "error" && <p className="mt-3 text-[13px] font-semibold text-muse-orange">We couldn't add you just now. Check your connection and try again.</p>}
                <button type="submit" disabled={submitState === "loading"} className="mt-6 min-h-12 w-full rounded-full bg-muse-yellow px-6 text-[12px] font-black uppercase tracking-[0.13em] transition hover:bg-muse-yellow-deep disabled:opacity-60">{submitState === "loading" ? "Unlocking…" : "Unlock my access"}</button>
                <button type="button" onClick={() => setStep(1)} className="mt-3 min-h-11 w-full text-[12px] font-bold text-muse-text-muted underline">Change preference</button>
              </form>
            )}

            {step === 3 && (
              <div className="py-8 text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muse-orange">You're in</p>
                <DialogTitle className="mx-auto mt-3 max-w-[460px] text-[36px] font-black leading-[1] tracking-[-0.04em]">You're on the list. Check your inbox for your private code.</DialogTitle>
                <p className="mx-auto mt-4 max-w-[420px] text-[13px] leading-6 text-muse-text-muted">Email delivery and welcome offers activate in a later phase. Your access preference has been saved.</p>
                <button type="button" onClick={closeMarketingDialog} className="mt-7 min-h-12 rounded-full bg-muse-black px-8 text-[12px] font-black uppercase tracking-[0.12em] text-white">Continue shopping</button>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
