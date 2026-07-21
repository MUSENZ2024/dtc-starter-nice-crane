import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { hashMarketingSession } from "../../../../lib/marketing-consent"
import { recordMarketingCaptureEventWorkflow } from "../../../../workflows/marketing/record-marketing-capture-event"
import type { PostStoreMarketingEvent } from "../validators"

export async function POST(req: MedusaRequest<PostStoreMarketingEvent>, res: MedusaResponse) {
  const { session_id, ...event } = req.validatedBody
  await recordMarketingCaptureEventWorkflow(req.scope).run({
    input: { ...event, session_id_hash: hashMarketingSession(session_id) },
  })
  res.status(202).json({ accepted: true })
}
