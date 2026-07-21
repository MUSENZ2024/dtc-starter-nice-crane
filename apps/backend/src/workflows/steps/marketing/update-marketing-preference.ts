import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETING_MODULE } from "../../../modules/marketing"
import MarketingModuleService from "../../../modules/marketing/service"
import type {
  MarketingPreference,
  MarketingSource,
} from "../../../modules/marketing/types"

export type UpdateMarketingPreferenceInput = {
  subscriber_id: string
  preference: MarketingPreference
  source: MarketingSource
}

type Compensation = {
  subscriber_id: string
  previous_preference?: MarketingPreference
  event_id?: string
}

export const updateMarketingPreferenceStep = createStep(
  "update-marketing-preference",
  async (input: UpdateMarketingPreferenceInput, { container }) => {
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    const [subscriber] = await service.listMarketingSubscribers(
      { id: input.subscriber_id },
      { take: 1 },
    )
    if (!subscriber) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Marketing profile not found")
    }
    if (subscriber.primary_preference === input.preference) {
      return new StepResponse(
        { preference: input.preference },
        { subscriber_id: subscriber.id } satisfies Compensation,
      )
    }

    const now = new Date()
    await service.updateMarketingSubscribers({
      id: subscriber.id,
      primary_preference: input.preference,
      source_latest: input.source,
    })
    const event = await service.createMarketingPreferenceEvents({
      subscriber_id: subscriber.id,
      preference: input.preference,
      source: input.source,
      occurred_at: now,
    })

    return new StepResponse(
      { preference: input.preference },
      {
        subscriber_id: subscriber.id,
        previous_preference: subscriber.primary_preference,
        event_id: event.id,
      } satisfies Compensation,
    )
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation?.previous_preference) return
    const service: MarketingModuleService = container.resolve(MARKETING_MODULE)
    if (compensation.event_id) {
      await service.deleteMarketingPreferenceEvents(compensation.event_id)
    }
    await service.updateMarketingSubscribers({
      id: compensation.subscriber_id,
      primary_preference: compensation.previous_preference,
    })
  },
)
