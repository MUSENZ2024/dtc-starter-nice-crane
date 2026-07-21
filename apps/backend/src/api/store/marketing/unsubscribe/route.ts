import { MedusaError } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyMarketingToken } from "../../../../lib/marketing-consent"
import { unsubscribeMarketingProfileWorkflow } from "../../../../workflows/marketing/unsubscribe-marketing-profile"
import type { PostStoreMarketingUnsubscribe } from "../validators"

export async function POST(
  req: MedusaRequest<PostStoreMarketingUnsubscribe>,
  res: MedusaResponse,
) {
  const subscriberId = verifyMarketingToken(req.validatedBody.token)
  if (!subscriberId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid unsubscribe link")
  }
  await unsubscribeMarketingProfileWorkflow(req.scope).run({
    input: { subscriber_id: subscriberId, source: "campaign_landing_page" },
  })
  res.status(200).json({ success: true, status: "unsubscribed" })
}
