"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { subscribeToMarketing } from "../../lib/client"
import type { MarketingPreference, MarketingSource } from "../../types"

type Props = {
  source: MarketingSource
  compact?: boolean
}

const preferences: Array<[MarketingPreference, string]> = [
  ["footwear", "Footwear"],
  ["outerwear", "Outerwear"],
  ["restocks", "Restocks"],
  ["everything", "Everything"],
]

export default function NewsletterForm({ source, compact = false }: Props) {
  const params = useParams<{ countryCode?: string }>()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "duplicate" | "error">("idle")
  const [preference, setPreference] = useState<MarketingPreference>("everything")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus("loading")
    try {
      const response = await subscribeToMarketing({
        email,
        preference,
        source,
        countryCode: params.countryCode || "nz",
      })
      localStorage.setItem("muse_marketing_subscribed", "true")
      setStatus(response.status === "already_subscribed" ? "duplicate" : "success")
    } catch {
      setStatus("error")
    }
  }

  const updatePreference = async (value: MarketingPreference) => {
    setPreference(value)
    try {
      await subscribeToMarketing({
        email,
        preference: value,
        source,
        countryCode: params.countryCode || "nz",
      })
    } catch {
      setStatus("error")
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-[560px] flex-col gap-3" aria-live="polite">
      <div className="flex flex-col gap-2 xsmall:flex-row">
        <label className="sr-only" htmlFor={`${source}-email`}>Email address</label>
        <input
          id={`${source}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email"
          className="min-h-12 min-w-0 flex-1 rounded-[8px] border border-white/[0.12] bg-white/[0.06] px-4 text-[16px] text-white outline-none placeholder:text-white/35 focus:border-muse-yellow"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="min-h-12 rounded-[8px] bg-muse-yellow px-5 text-[12px] font-black uppercase tracking-[0.1em] text-muse-black transition hover:bg-muse-yellow-deep disabled:cursor-wait disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Join the list"}
        </button>
      </div>

      {(status === "success" || status === "duplicate") && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-white/75">
            {status === "duplicate"
              ? "You're already on the MUSE list. We've kept your preferences up to date."
              : "You're on the list. Check your inbox for updates."}
          </p>
          {!compact && (
            <fieldset>
              <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white/45">What should we send first?</legend>
              <div className="flex flex-wrap gap-2">
                {preferences.map(([value, label]) => (
                  <button key={value} type="button" onClick={() => updatePreference(value)} className={`min-h-11 rounded-full border px-4 text-[12px] ${preference === value ? "border-muse-yellow bg-muse-yellow text-muse-black" : "border-white/20 text-white/70"}`}>{label}</button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}
      {status === "error" && <p className="text-[13px] text-muse-yellow">We couldn't add you just now. Check your connection and try again.</p>}
    </form>
  )
}
