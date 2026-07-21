import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import type { MarketingOfferStatus } from "../../modules/marketing/types"
import { updateMarketingOfferStatusStep } from "../steps/marketing/update-marketing-offer-status"

export const updateMarketingOfferStatusWorkflow = createWorkflow(
  "update-marketing-offer-status-workflow",
  function (input: { id: string; status: MarketingOfferStatus }) { return new WorkflowResponse(updateMarketingOfferStatusStep(input)) },
)
