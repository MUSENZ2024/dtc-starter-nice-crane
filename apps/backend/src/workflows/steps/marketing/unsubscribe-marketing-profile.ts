import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import type { MarketingSource } from "../../../modules/marketing/types"
import {
  MARKETING_CONSENT_TEXT,
  MARKETING_PRIVACY_POLICY_VERSION,
} from "../../../lib/marketing-consent"

export type UnsubscribeMarketingProfileInput = {
  subscriber_id: string
  source: MarketingSource
}

type Compensation = {
  subscriber_id: string
  consent_event_id?: string
  previous_status?: "subscribed" | "unsubscribed" | "suppressed" | "pending"
  previous_unsubscribed_at?: Date | null
}

export const unsubscribeMarketingProfileStep = createStep(
  "unsubscribe-marketing-profile",
  async (input: UnsubscribeMarketingProfileInput, { container }) => {
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    const [subscriber] = await service.listMarketingSubscribers(
      { id: input.subscriber_id },
      { take: 1 },
    )
    if (!subscriber) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Marketing profile not found")
    }
    if (subscriber.status === "unsubscribed" || subscriber.status === "suppressed") {
      return new StepResponse(
        { status: "unsubscribed" as const, subscriber_id: subscriber.id },
        { subscriber_id: subscriber.id } satisfies Compensation,
      )
    }

    const now = new Date()
    await service.updateMarketingSubscribers({
      id: subscriber.id,
      status: "unsubscribed",
      unsubscribed_at: now,
    })
    const event = await service.createMarketingConsentEvents({
      subscriber_id: subscriber.id,
      action: "unsubscribed",
      channel: "email",
      source: input.source,
      consent_text: MARKETING_CONSENT_TEXT,
      privacy_policy_version: MARKETING_PRIVACY_POLICY_VERSION,
      occurred_at: now,
      metadata: { scope: "marketing_only" },
    })

    return new StepResponse(
      { status: "unsubscribed" as const, subscriber_id: subscriber.id },
      {
        subscriber_id: subscriber.id,
        consent_event_id: event.id,
        previous_status: subscriber.status,
        previous_unsubscribed_at: subscriber.unsubscribed_at,
      } satisfies Compensation,
    )
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation?.previous_status) return
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    if (compensation.consent_event_id) {
      await service.deleteMarketingConsentEvents(compensation.consent_event_id)
    }
    await service.updateMarketingSubscribers({
      id: compensation.subscriber_id,
      status: compensation.previous_status,
      unsubscribed_at: compensation.previous_unsubscribed_at,
    })
  },
)
