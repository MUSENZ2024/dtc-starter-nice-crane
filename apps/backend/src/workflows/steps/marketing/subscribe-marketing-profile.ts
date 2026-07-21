import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import type {
  MarketingPreference,
  MarketingSource,
} from "../../../modules/marketing/types"
import {
  MARKETING_CONSENT_TEXT,
  MARKETING_PRIVACY_POLICY_VERSION,
  normalizeMarketingEmail,
} from "../../../lib/marketing-consent"

export type SubscribeMarketingProfileInput = {
  email: string
  preference: MarketingPreference
  source: MarketingSource
  consent_version: string
  session_id?: string
  country_code?: string
  ip_hash?: string | null
  user_agent_summary?: string | null
}

type Compensation = {
  subscriber_id: string
  created: boolean
  previous?: Record<string, unknown>
  consent_event_id?: string
  preference_event_id?: string
}

export const subscribeMarketingProfileStep = createStep(
  "subscribe-marketing-profile",
  async (input: SubscribeMarketingProfileInput, { container }) => {
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    const emailNormalized = normalizeMarketingEmail(input.email)
    const [existing] = await service.listMarketingSubscribers(
      { email_normalized: emailNormalized },
      { take: 1 },
    )
    const now = new Date()

    if (existing?.status === "suppressed") {
      return new StepResponse(
        { public_status: "preference_updated" as const, subscriber_id: existing.id },
        { subscriber_id: existing.id, created: false } satisfies Compensation,
      )
    }

    if (existing) {
      const wasUnsubscribed = existing.status === "unsubscribed"
      const preferenceChanged = existing.primary_preference !== input.preference
      const previous = {
        status: existing.status,
        primary_preference: existing.primary_preference,
        source_latest: existing.source_latest,
        subscribed_at: existing.subscribed_at,
        unsubscribed_at: existing.unsubscribed_at,
      }
      await service.updateMarketingSubscribers({
        id: existing.id,
        status: "subscribed",
        primary_preference: input.preference,
        source_latest: input.source,
        subscribed_at: wasUnsubscribed ? now : existing.subscribed_at,
        unsubscribed_at: null,
      })

      let consentEventId: string | undefined
      if (wasUnsubscribed) {
        const event = await service.createMarketingConsentEvents({
          subscriber_id: existing.id,
          action: "resubscribed",
          channel: "email",
          source: input.source,
          consent_text: MARKETING_CONSENT_TEXT,
          privacy_policy_version: MARKETING_PRIVACY_POLICY_VERSION,
          occurred_at: now,
          ip_hash: input.ip_hash,
          user_agent_summary: input.user_agent_summary,
          country_code: input.country_code,
          metadata: { consent_version: input.consent_version },
        })
        consentEventId = event.id
      }

      let preferenceEventId: string | undefined
      if (preferenceChanged) {
        const event = await service.createMarketingPreferenceEvents({
          subscriber_id: existing.id,
          preference: input.preference,
          source: input.source,
          occurred_at: now,
        })
        preferenceEventId = event.id
      }

      return new StepResponse(
        {
          public_status: wasUnsubscribed
            ? ("subscribed" as const)
            : preferenceChanged
              ? ("preference_updated" as const)
              : ("already_subscribed" as const), subscriber_id: existing.id,
        },
        {
          subscriber_id: existing.id,
          created: false,
          previous,
          consent_event_id: consentEventId,
          preference_event_id: preferenceEventId,
        } satisfies Compensation,
      )
    }

    const subscriber = await service.createMarketingSubscribers({
      email: input.email.trim(),
      email_normalized: emailNormalized,
      status: "subscribed",
      customer_type: "unknown",
      primary_preference: input.preference,
      source_first: input.source,
      source_latest: input.source,
      subscribed_at: now,
      order_count: 0,
      lifetime_revenue: 0,
      metadata: input.session_id ? { signup_session_id: input.session_id } : null,
    })
    const consentEvent = await service.createMarketingConsentEvents({
      subscriber_id: subscriber.id,
      action: "subscribed",
      channel: "email",
      source: input.source,
      consent_text: MARKETING_CONSENT_TEXT,
      privacy_policy_version: MARKETING_PRIVACY_POLICY_VERSION,
      occurred_at: now,
      ip_hash: input.ip_hash,
      user_agent_summary: input.user_agent_summary,
      country_code: input.country_code,
      metadata: { consent_version: input.consent_version },
    })
    const preferenceEvent = await service.createMarketingPreferenceEvents({
      subscriber_id: subscriber.id,
      preference: input.preference,
      source: input.source,
      occurred_at: now,
    })

    return new StepResponse(
      { public_status: "subscribed" as const, subscriber_id: subscriber.id },
      {
        subscriber_id: subscriber.id,
        created: true,
        consent_event_id: consentEvent.id,
        preference_event_id: preferenceEvent.id,
      } satisfies Compensation,
    )
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation) return
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    if (compensation.preference_event_id) {
      await service.deleteMarketingPreferenceEvents(compensation.preference_event_id)
    }
    if (compensation.consent_event_id) {
      await service.deleteMarketingConsentEvents(compensation.consent_event_id)
    }
    if (compensation.created) {
      await service.deleteMarketingSubscribers(compensation.subscriber_id)
    } else if (compensation.previous) {
      await service.updateMarketingSubscribers({
        id: compensation.subscriber_id,
        ...compensation.previous,
      })
    }
  },
)
