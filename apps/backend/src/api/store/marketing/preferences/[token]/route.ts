import { MedusaError } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyMarketingToken } from "../../../../../lib/marketing-consent"
import { MARKETING_MODULE } from "../../../../../modules/marketing"
import MarketingModuleService from "../../../../../modules/marketing/service"
import { unsubscribeMarketingProfileWorkflow } from "../../../../../workflows/marketing/unsubscribe-marketing-profile"
import { updateMarketingPreferenceWorkflow } from "../../../../../workflows/marketing/update-marketing-preference"
import type { PostStoreMarketingPreferences } from "../../validators"

const subscriberIdFromRequest = (req: MedusaRequest) => {
  const subscriberId = verifyMarketingToken(req.params.token)
  if (!subscriberId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid preference link")
  }
  return subscriberId
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const subscriberId = subscriberIdFromRequest(req)
  const service: MarketingModuleService = req.scope.resolve(MARKETING_MODULE)
  const [subscriber] = await service.listMarketingSubscribers(
    { id: subscriberId },
    { take: 1 },
  )
  if (!subscriber) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Marketing profile not found")
  }
  res.status(200).json({
    preference: subscriber.primary_preference,
    subscribed: subscriber.status === "subscribed",
  })
}

export async function POST(
  req: MedusaRequest<PostStoreMarketingPreferences>,
  res: MedusaResponse,
) {
  const subscriberId = subscriberIdFromRequest(req)
  if (req.validatedBody.unsubscribe) {
    await unsubscribeMarketingProfileWorkflow(req.scope).run({
      input: { subscriber_id: subscriberId, source: "campaign_landing_page" },
    })
    return res.status(200).json({ success: true, status: "unsubscribed" })
  }
  await updateMarketingPreferenceWorkflow(req.scope).run({
    input: {
      subscriber_id: subscriberId,
      preference: req.validatedBody.preference!,
      source: "campaign_landing_page",
    },
  })
  return res.status(200).json({ success: true, status: "preference_updated" })
}
