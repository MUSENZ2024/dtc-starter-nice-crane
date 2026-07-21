import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  hashMarketingIp,
  summarizeUserAgent,
} from "../../../../lib/marketing-consent"
import { subscribeMarketingProfileWorkflow } from "../../../../workflows/marketing/subscribe-marketing-profile"
import type { PostStoreMarketingSubscribe } from "../validators"

const messages = {
  subscribed: "You're on the MUSE list.",
  already_subscribed: "You're already on the MUSE list. We've kept your preferences up to date.",
  preference_updated: "Your MUSE email preferences are up to date.",
}

export async function POST(
  req: MedusaRequest<PostStoreMarketingSubscribe>,
  res: MedusaResponse,
) {
  const { result } = await subscribeMarketingProfileWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      ip_hash: hashMarketingIp(req.ip),
      user_agent_summary: summarizeUserAgent(req.get("user-agent")),
    },
  })

  res.status(200).json({
    success: true,
    status: result.public_status,
    message: messages[result.public_status],
  })
}
