import { sdk } from "@lib/config"
import type {
  MarketingPreference,
  MarketingSource,
  MarketingSubscribeResponse,
} from "../types"

export const MARKETING_CONSENT_VERSION = "2026-07-21-v1"

export const getMarketingSessionId = () => {
  const key = "muse_marketing_session_id"
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const value = crypto.randomUUID()
  sessionStorage.setItem(key, value)
  return value
}

export const subscribeToMarketing = (input: {
  email: string
  preference: MarketingPreference
  source: MarketingSource
  countryCode: string
}) =>
  sdk.client.fetch<MarketingSubscribeResponse>("/store/marketing/subscribe", {
    method: "POST",
    body: {
      email: input.email,
      preference: input.preference,
      source: input.source,
      consent_version: MARKETING_CONSENT_VERSION,
      session_id: getMarketingSessionId(),
      country_code: input.countryCode.toUpperCase(),
    },
  })

export const recordMarketingCaptureEvent = (input: {
  event_type: string
  source: MarketingSource
  preference?: MarketingPreference
  page_type: string
  device_type: "mobile" | "desktop"
}) =>
  sdk.client.fetch("/store/marketing/events", {
    method: "POST",
    body: {
      ...input,
      session_id: getMarketingSessionId(),
    },
  }).catch(() => undefined)
